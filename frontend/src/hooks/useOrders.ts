// TanStack Query: useOrders(filters), useOrder(id), useCreateOrder, useUpdateOrder, useDeleteOrder, useUpdateOrderStatus.

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  changeStatus,
  createOrder,
  deleteOrder,
  getOrder,
  getOrders,
  updateOrder,
} from "@/api/orders.api";
import type { OrderFilters, UpdateOrderBody } from "@/types/api";
import type { OrderStatus } from "@/types/models";

type ChangeStatusParams = {
  id: number;
  status: OrderStatus;
};

type UpdateOrderParams = {
  id: number;
  body: UpdateOrderBody;
};

// Fetch orders with filters and pagination.
export const useOrders = (
  filters: OrderFilters = {},
  { enabled = true }: { enabled?: boolean } = {},
) => {
  return useQuery({
    queryKey: ["orders", "list", filters],
    queryFn: ({ signal }) => getOrders(filters, signal),
    // Keep the list mounted while a new search or page loads.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    // Wait until URL filters are valid before making a request.
    enabled,
  });
};

// Fetch a single order.
export const useOrder = (id: number) => {
  return useQuery({
    queryKey: ["orders", "detail", id],
    queryFn: () => getOrder(id),
    // Skip requests for invalid URL IDs.
    enabled: Number.isSafeInteger(id) && id > 0,
    // Missing orders and other client errors do not need automatic retries.
    retry: (failureCount, error) => {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      if (status !== undefined && status >= 400 && status < 500) return false;
      return failureCount < 1;
    },
  });
};

// Create an order and refresh related data.
export const useCreateOrder = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: createOrder,

    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["orders"] }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
        client.invalidateQueries({ queryKey: ["admin", "categories"] }),
      ]);
    },
  });
};

// Edit an order and refresh related data.
export const useUpdateOrder = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateOrderParams) => updateOrder(data.id, data.body),

    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["orders"] }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
        client.invalidateQueries({ queryKey: ["proposals"] }),
        client.invalidateQueries({ queryKey: ["admin", "categories"] }),
      ]);
    },
  });
};

// Delete an open order, refresh lists and discard its cached details.
export const useDeleteOrder = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: deleteOrder,
    onError: async (error) => {
      if (!isAxiosError(error) || ![404, 409].includes(error.response?.status ?? 0)) return;
      await client.invalidateQueries({ queryKey: ["orders"] });
    },
    onSuccess: async (_, id) => {
      const relatedKeys = [
        ["orders", "detail", id],
        ["orders", "review", id],
        ["proposals", "detail", id],
        ["messages", "detail", id],
      ];
      await Promise.all(relatedKeys.map((queryKey) => client.cancelQueries({ queryKey })));

      // Do not refetch endpoints belonging to the deleted order.
      await Promise.all([
        client.invalidateQueries({ queryKey: ["orders", "list"] }),
        client.invalidateQueries({ queryKey: ["proposals"], predicate: (query) => query.queryKey[1] !== "detail" || query.queryKey[2] !== id }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
        client.invalidateQueries({ queryKey: ["admin", "categories"] }),
      ]);

      // Remove details last so the page can immediately navigate away.
      for (const queryKey of relatedKeys) client.removeQueries({ queryKey });
    },
  });
};

// Change an order status and refresh related data.
export const useUpdateOrderStatus = () => {
  const client = useQueryClient();

  const refreshOrders = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["orders"] }),
      client.invalidateQueries({ queryKey: ["dashboard"] }),
      client.invalidateQueries({ queryKey: ["proposals"] }),
    ]);
  };

  return useMutation({
    mutationFn: (data: ChangeStatusParams) =>
      changeStatus(data.id, data.status),

    // Another participant may have changed the project in another tab.
    onError: async (error) => {
      if (isAxiosError(error) && [403, 404, 409].includes(error.response?.status ?? 0)) await refreshOrders();
    },

    onSuccess: async (order) => {
      // Use the confirmed status immediately, then refresh related lists.
      client.setQueryData(["orders", "detail", order.id], order);
      await refreshOrders();
    },
  });
};
