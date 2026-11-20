// useGetUsers(filters), useBlockUsers(), useAdminCategories(params), useCreateCategory(), useRenameCategory(), useDeleteCategory().
import { blockUser, createCategory, deleteCategory, getAdminCategories, getUsers, renameCategory } from "@/api/admin.api";
import { useAuthStore } from "@/store/auth";
import type { AdminUserFilters, PaginationParams } from "@/types/api";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

// Access/validation errors need user action; retry temporary failures once.
const retryAdminRequest = (failureCount: number, error: unknown) => {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  return status !== undefined && status >= 400 && status < 500 ? false : failureCount < 1;
};

const refreshUsers = (client: QueryClient) => Promise.all([
  client.invalidateQueries({ queryKey: ["admin", "users"] }),
  client.invalidateQueries({ queryKey: ["freelancers"] }),
  client.invalidateQueries({ queryKey: ["dashboard"] }),
]);

const refreshCategories = (client: QueryClient) => Promise.all([
  client.invalidateQueries({ queryKey: ["admin", "categories"] }),
  client.invalidateQueries({ queryKey: ["categories"] }),
  // Renaming changes the category nested inside orders and dashboard projects.
  client.invalidateQueries({ queryKey: ["orders"] }),
  client.invalidateQueries({ queryKey: ["dashboard"] }),
]);

// Fetch private users; preserve rows only within this administrator's cache.
export const useGetUsers = (filters: AdminUserFilters = {}, { enabled = true } = {}) => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin", "users", user?.id, filters],
    queryFn: ({ signal }) => getUsers(filters, signal),
    enabled: enabled && Boolean(token && user?.role === "ADMIN"),
    placeholderData: (previous, query) => query?.queryKey[2] === user?.id ? previous : undefined,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    retry: retryAdminRequest,
  });
};

// Pass the target and desired state when confirming, not when rendering rows.
export const useBlockUsers = () => {
  const client = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  return useMutation({
    mutationKey: ["admin", "users", userId],
    mutationFn: ({ id, isBlocked }: { id: number; isBlocked: boolean }) => blockUser(id, isBlocked),
    onSuccess: async () => { await refreshUsers(client); },
    onError: async (error) => {
      if (isAxiosError(error) && [404, 409].includes(error.response?.status ?? 0)) await refreshUsers(client);
    },
  });
};

// Fetch categories with actual usage counts for delete availability.
export const useAdminCategories = (params: PaginationParams = {}) => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin", "categories", user?.id, params],
    queryFn: ({ signal }) => getAdminCategories(params, signal),
    enabled: Boolean(token && user?.role === "ADMIN"),
    placeholderData: (previous, query) => query?.queryKey[2] === user?.id ? previous : undefined,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    retry: retryAdminRequest,
  });
};

// Create a category; the server generates and validates its unique slug.
export const useCreateCategory = () => {
  const client = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  return useMutation({
    mutationKey: ["admin", "categories", userId],
    mutationFn: (name: string) => createCategory(name),
    onSuccess: async () => { await refreshCategories(client); },
  });
};

// Rename a category and refresh names wherever projects display them.
export const useRenameCategory = () => {
  const client = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  return useMutation({
    mutationKey: ["admin", "categories", userId],
    mutationFn: ({ id, name }: { id: number; name: string }) => renameCategory(id, name),
    onSuccess: async () => { await refreshCategories(client); },
    onError: async (error) => {
      if (isAxiosError(error) && error.response?.status === 404) await refreshCategories(client);
    },
  });
};

// Recheck usage when another request has made deletion impossible.
export const useDeleteCategory = () => {
  const client = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  return useMutation({
    mutationKey: ["admin", "categories", userId],
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: async () => { await refreshCategories(client); },
    onError: async (error) => {
      if (isAxiosError(error) && [400, 404, 409].includes(error.response?.status ?? 0)) await refreshCategories(client);
    },
  });
};
