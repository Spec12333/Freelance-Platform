// getFreelancers(filters), getFreelancer(id), updateMyProfile(body), getFreelancersReviews(id).

import type { FreelancerFilters, Paginated, PaginationParams, UpdateProfileBody } from "@/types/api";
import api from "./client";
import type { CurrentUser, PublicProfile, Review, User } from "@/types/models";

export const getFreelancers = async (filters: FreelancerFilters) => {
  const result = await api.get<Paginated<User>>("/freelancers", {
    params: filters,
  });
  return result.data;
};

export const getFreelancer = async (id: number) => {
  const result = await api.get<PublicProfile>(`/freelancers/${id}`);
  return result.data;
};

export const updateMyProfile = async (body: UpdateProfileBody) => {
  const result = await api.patch<CurrentUser>("/freelancers/me", body);
  return result.data;
};

export const getFreelancersReviews = async (id: number, params ?: PaginationParams) => {
  const result = await api.get<Paginated<Review>>(`/freelancers/${id}/reviews`, {params});
  return result.data;
};
