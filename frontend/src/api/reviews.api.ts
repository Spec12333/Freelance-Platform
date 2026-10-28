// createReview(orderId, data), getOrderReviews(orderId).

import { CreateReviewBody, Paginated } from "@/types/api";
import api from "./client";
import { Review } from "@/types/models";

export const createReview = async (orderId: number, data: CreateReviewBody) => {
  const result = await api.post<Review>(`/orders/${orderId}/review`, data);
  return result.data;
};

export const getOrderReviews = async (orderId: number) => {
  const result = await api.get<Paginated<Review[]>>(`/orders/${orderId}/reviews`);
  return result.data;
};
