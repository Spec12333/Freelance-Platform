// getFreelancers(filters), getFreelancer(id), updateMyProfile(body), updateMyAvatar(file), getFreelancersReviews(id).

import type { FreelancerFilters, Paginated, PaginationParams, UpdateProfileBody } from "@/types/api";
import api from "./client";
import type { CurrentUser, PublicProfile, Review, User } from "@/types/models";

export const getFreelancers = async (filters: FreelancerFilters, signal?: AbortSignal) => {
  const result = await api.get<Paginated<User>>("/freelancers", {
    params: filters,
    signal,
  });
  return result.data;
};

export const getFreelancer = async (id: number, signal?: AbortSignal) => {
  const result = await api.get<PublicProfile>(`/freelancers/${id}`, { signal });
  return result.data;
};

export const updateMyProfile = async (body: UpdateProfileBody) => {
  const result = await api.patch<CurrentUser>("/freelancers/me", body);
  return result.data;
};

// Send the file itself; null removes either an uploaded or external photo.
export const updateMyAvatar = async (file: File | null) => {
  if (!file) {
    const result = await api.delete<CurrentUser>("/freelancers/me/avatar");
    return result.data;
  }
  const result = await api.put<CurrentUser>("/freelancers/me/avatar", file, {
    headers: { "Content-Type": file.type },
  });
  return result.data;
};

export const getFreelancersReviews = async (id: number, params?: PaginationParams, signal?: AbortSignal) => {
  const result = await api.get<Paginated<Review>>(`/freelancers/${id}/reviews`, { params, signal });
  return result.data;
};
