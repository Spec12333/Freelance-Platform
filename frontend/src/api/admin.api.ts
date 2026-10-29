// Categories: list/create/update/remove. Users: list, block/unblock.
// getUsers(filters), blockUser(id, isBlocked), getAdminCategories(params), createCategory(name), renameCategory(id, name), deleteCategory(id).

import type {
  AdminUserFilters,
  AdminUsersResponse,
  CategoryWithCount,
  Paginated,
  PaginationParams,
} from "@/types/api";
import api from "./client";
import type { CurrentUser } from "@/types/models";

export const getUsers = async (filters: AdminUserFilters) => {
  const result = await api.get<AdminUsersResponse>("/admin/users", {
    params: filters,
  });
  return result.data;
};

export const blockUser = async (id: number, isBlocked: boolean) => {
  const result = await api.patch<CurrentUser>(`/admin/users/${id}/block`, {
    isBlocked: isBlocked,
  });
  return result.data;
};

export const getAdminCategories = async (params?: PaginationParams) => {
  const result = await api.get<Paginated<CategoryWithCount>>(
    "/admin/categories",
    { params: params },
  );
  return result.data;
};

export const createCategory = async (name: string) => {
  const result = await api.post<CategoryWithCount>("/admin/categories", {
    name: name,
  });
  return result.data;
};

export const renameCategory = async (id: number, name: string) => {
  const result = await api.patch<CategoryWithCount>(`/admin/categories/${id}`, {
    name: name,
  });
  return result.data;
};

export const deleteCategory = async (id: number): Promise<void> => {
  await api.delete(`/admin/categories/${id}`);
};
