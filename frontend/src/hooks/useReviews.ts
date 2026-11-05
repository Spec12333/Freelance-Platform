// useOrderReviews(orderId), useCreateReview.
import { createReview, getOrderReviews } from "@/api/reviews.api";
import type { CreateReviewBody } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Submit a review and refresh reviews and ratings.
export const useCreateReview = (id: number, body: CreateReviewBody) => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: () => createReview(id, body),

    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["orders"] }),
        client.invalidateQueries({ queryKey: ["freelancers"] }),
        client.invalidateQueries({ queryKey: ["proposals"] }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
};

// Fetch reviews for an order.
export const useOrderReviews = (id: number) => {
  return useQuery({
    queryKey: ["orders", "review", id],
    queryFn: () => getOrderReviews(id),
  });
};
