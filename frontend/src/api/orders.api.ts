// getOrders(filters), getOrder(id), createOrder(body), updateOrder(id, body), changeStatus(id, status).

import type {
  CreateOrderBody,
  OrderFilters,
  Paginated,
  UpdateOrderBody,
} from "@/types/api";
import api from "./client";
import type { Order, OrderStatus } from "@/types/models";

export const getOrders = async (filters: OrderFilters) => {
  const result = await api.get<Paginated<Order>>("/orders", {
    params: filters,
  });
  return result.data;
};

export const getOrder = async (id: Order["id"]) => {
  const result = await api.get<Order>(`/orders/${id}`);
  return result.data;
};

export const createOrder = async (body: CreateOrderBody) => {
  const result = await api.post<Order>("/orders", body);
  return result.data;
};

export const updateOrder = async (id: Order["id"], body: UpdateOrderBody) => {
  const result = await api.patch<Order>(`/orders/${id}`, body);
  return result.data;
};

export const changeStatus = async (id: Order["id"], status: OrderStatus) => {
  const result = await api.patch<Order>(`/orders/${id}/status`, { status });
  return result.data;
};
