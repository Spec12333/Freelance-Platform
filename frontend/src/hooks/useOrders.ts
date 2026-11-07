// TanStack Query: useOrders(filters), useOrder(id), useCreateOrder, useUpdateOrder, useUpdateOrderStatus.

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  changeStatus,
  createOrder,
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

// Change an order status and refresh related data.
export const useUpdateOrderStatus = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (data: ChangeStatusParams) =>
      changeStatus(data.id, data.status),

    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["orders"] }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
        client.invalidateQueries({ queryKey: ["proposals"] }),
      ]);
    },
  });
};
