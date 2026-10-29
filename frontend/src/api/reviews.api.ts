// createReview(orderId, data), getOrderReviews(orderId).

import type { CreateReviewBody } from "@/types/api";
import api from "./client";
import type { Review } from "@/types/models";

export const createReview = async (orderId: number, data: CreateReviewBody) => {
  const result = await api.post<Review>(`/orders/${orderId}/review`, data);
  return result.data;
};

export const getOrderReviews = async (orderId: number) => {
  const result = await api.get<Review[]>(`/orders/${orderId}/reviews`);
  return result.data;
};
