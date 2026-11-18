// useOrderReviews(orderId, options), useCreateReview(orderId).
import { createReview, getOrderReviews } from "@/api/reviews.api";
import type { CreateReviewBody } from "@/types/api";
import type { Review } from "@/types/models";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

// Submit a review and refresh reviews and ratings.
export const useCreateReview = (id: number) => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateReviewBody) => createReview(id, body),

    onError: async (error) => {
      if (!isAxiosError(error) || ![403, 404, 409].includes(error.response?.status ?? 0)) return;
      // Another tab may have submitted this participant's review already.
      await client.invalidateQueries({ queryKey: ["orders"] });
    },

    onSuccess: async (review) => {
      // Hide the form immediately using the review confirmed by the server.
      client.setQueryData<Review[]>(["orders", "review", id], (current = []) =>
        [...current.filter((item) => item.id !== review.id), review],
      );
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
export const useOrderReviews = (id: number, { enabled = true }: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ["orders", "review", id],
    queryFn: () => getOrderReviews(id),
    // Skip unfinished projects and invalid URL IDs.
    enabled: enabled && Number.isSafeInteger(id) && id > 0,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      if (status !== undefined && status >= 400 && status < 500) return false;
      return failureCount < 1;
    },
  });
};
