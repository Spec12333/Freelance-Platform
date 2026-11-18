// useMessages(orderId, page, options), useSendMessage(orderId).

import { getMessages, sendMessage } from "@/api/messages.api";
import type { CreateMessageBody } from "@/types/api";
import { useAuthStore } from "@/store/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

// Fetch a history page; WebSocket events refresh the latest messages.
export const useMessages = (
  id: number,
  page = 1,
  { enabled = true }: { enabled?: boolean } = {},
) => {
  const userId = useAuthStore((state) => state.user?.id);
  const token = useAuthStore((state) => state.token);

  return useQuery({
    // Private history belongs to one signed-in user and order.
    queryKey: ["messages", "detail", id, userId, page],
    queryFn: ({ signal }) => getMessages(id, page, signal),
    // The parent enables the chat only for the two project participants.
    enabled: enabled && Boolean(token && userId)
      && Number.isSafeInteger(id) && id > 0 && Number.isSafeInteger(page) && page > 0,
    // Catch up after returning to the tab or recovering the network.
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      if (status !== undefined && status >= 400 && status < 500) return false;
      return failureCount < 1;
    },
  });
};

// Send a message and refresh the chat.
export const useSendMessage = (id: number) => {
  const client = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationKey: ["messages", "send", id, userId],
    mutationFn: (body: CreateMessageBody) => sendMessage(id, body),

    onError: async (error) => {
      if (!isAxiosError(error) || ![403, 404, 409].includes(error.response?.status ?? 0)) return;
      // Refresh participation if the project changed while composing.
      await client.invalidateQueries({ queryKey: ["orders", "detail", id] });
    },

    onSuccess: () => {
      return client.invalidateQueries({
        queryKey: ["messages", "detail", id, userId],
      });
    },
  });
};
