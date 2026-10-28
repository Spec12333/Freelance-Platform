import { Category } from "@/types/models";
import api from "./client";

export const getCategories = async () => {
  const result = await api.get<Category[]>("/categories");
  return result.data;
};
