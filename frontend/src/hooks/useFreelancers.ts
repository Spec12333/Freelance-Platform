// useFreelancers(filters), useFreelancer(id), useUpdateMyProfile, useUpdateMyAvatar, useFreelancersReviews(id, params).

import {
  getFreelancer,
  getFreelancers,
  getFreelancersReviews,
  updateMyProfile,
  updateMyAvatar,
} from "@/api/freelancers.api";
import type {
  FreelancerFilters,
  Paginated,
  PaginationParams,
  UpdateProfileBody,
} from "@/types/api";
import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { isAxiosError } from "axios";
import type { CurrentUser, Review } from "@/types/models";

// Refresh nested avatars as well as full profiles after an owner update.
const syncProfile = async (client: QueryClient, updatedUser: CurrentUser, startedToken?: string | null) => {
  const { token, user, login } = useAuthStore.getState();
  if (!token || token !== startedToken || user?.id !== updatedUser.id) return;
  login(token, updatedUser);
  await Promise.all([
    client.invalidateQueries({ queryKey: ["freelancers"] }),
    client.invalidateQueries({ queryKey: ["orders"] }),
    client.invalidateQueries({ queryKey: ["proposals"] }),
    client.invalidateQueries({ queryKey: ["messages"] }),
    client.invalidateQueries({ queryKey: ["admin", "users"] }),
    client.invalidateQueries({ queryKey: ["dashboard"] }),
  ]);
};

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
export const useFreelancers = (filters: FreelancerFilters = {}, { enabled = true }: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ["freelancers", "list", filters],
    queryFn: ({ signal }) => getFreelancers(filters, signal),
    // Retain cards while valid filters or the page are changing.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: retryPublicRequest,
    // Invalid URL filters stay editable without reaching the API.
    enabled,
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
export const useUpdateMyProfile = () => {
  const client = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationKey: ["profile", userId],
    mutationFn: (body: UpdateProfileBody) => updateMyProfile(body),
    onMutate: () => ({ token: useAuthStore.getState().token }),

    onSuccess: (updatedUser, _body, context) => syncProfile(client, updatedUser, context?.token),
  });
};

// Upload or remove a photo and sync the current account plus public avatars.
export const useUpdateMyAvatar = () => {
  const client = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  return useMutation({
    mutationKey: ["profile", userId],
    mutationFn: updateMyAvatar,
    onMutate: () => ({ token: useAuthStore.getState().token }),
    onSuccess: (updatedUser, _file, context) => syncProfile(client, updatedUser, context?.token),
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
