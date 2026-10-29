// getDashboard().

import type { DashboardResponse } from "@/types/api";
import api from "./client";

export const getDashboard = async () => {
  const result = await api.get<DashboardResponse>("/dashboard");
  return result.data;
};
