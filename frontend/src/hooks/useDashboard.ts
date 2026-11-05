// useDashboard() - my orders, my proposals, notification counter.

import { getDashboard } from "@/api/dashboard.api";
import { useAuthStore } from "@/store/auth";
import { useQuery } from "@tanstack/react-query";

// Fetch the current user's dashboard.
export const useDashboard = () => {
  const userId = useAuthStore((state) => state.user?.id);
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["dashboard", userId],
    queryFn: () => getDashboard(),
    // Fetch only when a user is signed in.
    enabled: Boolean(token && userId),
  });
};
