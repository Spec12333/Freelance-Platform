// getCategories() - public list for the order filters and the order form.

import type { Category } from "@/types/models";
import api from "./client";

export const getCategories = async () => {
  const result = await api.get<Category[]>("/categories");
  return result.data;
};
