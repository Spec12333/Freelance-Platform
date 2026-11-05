// useGetUsers(filters), useBlockUsers, useAdminCategories(params), useCreateCategory, useRenameCategory, useDeleteCategory.

import {
  blockUser,
  createCategory,
  deleteCategory,
  getAdminCategories,
  getUsers,
  renameCategory,
} from "@/api/admin.api";
import { AdminUserFilters, PaginationParams } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Fetch users with admin filters.
export const useGetUsers = (filters: AdminUserFilters) => {
  return useQuery({
    queryKey: ["admin", "users", filters],
    queryFn: () => getUsers(filters),
  });
};

// Block or unblock a user.
export const useBlockUsers = (id: number, isBlocked: boolean) => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: () => blockUser(id, isBlocked),

    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin", "users"] }),
        client.invalidateQueries({ queryKey: ["freelancers"] }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
};

// Fetch categories with order counts.
export const useAdminCategories = (params: PaginationParams) => {
  return useQuery({
    queryKey: ["admin", "categories", params],
    queryFn: () => getAdminCategories(params),
  });
};

// Create a category.
export const useCreateCategory = (name: string) => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: () => createCategory(name),

    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin", "categories"] }),
        client.invalidateQueries({ queryKey: ["categories"] }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
};

// Rename a category.
export const useRenameCategory = (id: number, name: string) => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: () => renameCategory(id, name),

    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin", "categories"] }),
        client.invalidateQueries({ queryKey: ["categories"] }),
        client.invalidateQueries({ queryKey: ["orders"] }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
};

// Delete an unused category.
export const useDeleteCategory = (id: number) => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: () => deleteCategory(id),

    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin", "categories"] }),
        client.invalidateQueries({ queryKey: ["categories"] }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
};
