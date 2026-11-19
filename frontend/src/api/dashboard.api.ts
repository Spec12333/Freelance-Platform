// getDashboard().

import type { DashboardResponse } from "@/types/api";
import api from "./client";

export const getDashboard = async (signal?: AbortSignal) => {
  const result = await api.get<DashboardResponse>("/dashboard", { signal });
  return result.data;
};
