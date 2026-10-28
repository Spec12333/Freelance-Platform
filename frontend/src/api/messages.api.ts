// getMessages(orderId), sendMessage(orderId, body).

import { Message } from "@/types/models";
import api from "./client";
import { CreateMessageBody, Paginated } from "@/types/api";

export const getMessages = async (orderId: number, page = 1) => {
  const result = await api.get<Paginated<Message>>(
    `/orders/${orderId}/messages`,
    { params: { page } },
  );
  return result.data;
};

export const sendMessage = async (orderId: number, body: CreateMessageBody) => {
  const result = await api.post<Message>(`/orders/${orderId}/messages`, body);
  return result.data;
};
