// useFreelancers(filters), useFreelancer(id), useUpdateMyProfile, useFreelancersReviews(id, params).

import {
  getFreelancer,
  getFreelancers,
  getFreelancersReviews,
  updateMyProfile,
} from "@/api/freelancers.api";
import type {
  FreelancerFilters,
  PaginationParams,
  UpdateProfileBody,
} from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";

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
    queryFn: () => getFreelancer(id),
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
) => {
  return useQuery({
    queryKey: ["freelancers", "reviews", id, params],
    queryFn: () => getFreelancersReviews(id, params),
  });
};
