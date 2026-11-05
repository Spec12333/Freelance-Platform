// useMessages(orderId) with refetchInterval: 5000 (deliberate MVP choice), useSendMessage.

import { getMessages, sendMessage } from "@/api/messages.api";
import type { CreateMessageBody } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Fetch chat messages; poll page one every 5 seconds.
export const useMessages = (id: number, page: number) => {
  return useQuery({
    queryKey: ["messages", "detail", id, page],
    queryFn: () => getMessages(id, page),
    // Check for new messages every 5 seconds on page one only.
    refetchInterval: page === 1 ? 5000 : false,
  });
};

// Send a message and refresh the chat.
export const useSendMessage = (id: number, body: CreateMessageBody) => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: () => sendMessage(id, body),

    onSuccess: () => {
      return client.invalidateQueries({
        queryKey: ["messages", "detail", id],
      });
    },
  });
};
