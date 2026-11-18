// useFreelancers(filters), useFreelancer(id), useUpdateMyProfile, useFreelancersReviews(id, params).

import {
  getFreelancer,
  getFreelancers,
  getFreelancersReviews,
  updateMyProfile,
} from "@/api/freelancers.api";
import type {
  FreelancerFilters,
  Paginated,
  PaginationParams,
  UpdateProfileBody,
} from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { isAxiosError } from "axios";
import type { Review } from "@/types/models";

// Retry temporary failures once; missing profiles do not need a retry.
const retryPublicRequest = (failureCount: number, error: unknown) => {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  if (status !== undefined && status >= 400 && status < 500) return false;
  return failureCount < 1;
};

type ReviewsOptions = {
  enabled?: boolean;
  initialData?: Paginated<Review>;
  initialDataUpdatedAt?: number;
};

// Fetch freelancers with filters.
export const useFreelancers = (filters: FreelancerFilters) => {
  return useQuery({
    queryKey: ["freelancers", "list", filters],
    queryFn: () => getFreelancers(filters),
  });
};

// Fetch a public user profile.
export const useFreelancer = (id: number) => {
  return useQuery({
    queryKey: ["freelancers", "detail", id],
    queryFn: ({ signal }) => getFreelancer(id, signal),
    // Invalid URL IDs must never reach the API.
    enabled: Number.isSafeInteger(id) && id > 0,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: retryPublicRequest,
  });
};

// Update the profile and sync the auth store.
export const useUpdateMyProfile = (body: UpdateProfileBody) => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: () => updateMyProfile(body),

    onSuccess: async (updatedUser) => {
      const { token, user, login } = useAuthStore.getState();

      if (token && user?.id === updatedUser.id) {
        login(token, updatedUser);
      }
      await client.invalidateQueries({
        queryKey: ["freelancers"],
      });
    },
  });
};

// Fetch a page of reviews about a user.
export const useFreelancersReviews = (
  id: number,
  params?: PaginationParams,
  { enabled = true, initialData, initialDataUpdatedAt }: ReviewsOptions = {},
) => {
  return useQuery({
    queryKey: ["freelancers", "reviews", id, params],
    queryFn: ({ signal }) => getFreelancersReviews(id, params, signal),
    enabled: enabled && Number.isSafeInteger(id) && id > 0
      && Number.isSafeInteger(params?.page ?? 1) && (params?.page ?? 1) > 0,
    // Reuse the five reviews already included in the profile response.
    initialData,
    initialDataUpdatedAt,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: retryPublicRequest,
    // Keep rows while paging, but never show a different user's reviews.
    placeholderData: (previous, previousQuery) => previousQuery?.queryKey[2] === id ? previous : undefined,
  });
};
