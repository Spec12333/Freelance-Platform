// useDashboard() - role-specific statistics and current projects.

import { getDashboard } from "@/api/dashboard.api";
import { useAuthStore } from "@/store/auth";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";

// Fetch the current user's dashboard.
export const useDashboard = ({ enabled = true, refetchInterval = false }: { enabled?: boolean; refetchInterval?: number | false } = {}) => {
  const userId = useAuthStore((state) => state.user?.id);
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["dashboard", userId],
    queryFn: ({ signal }) => getDashboard(signal),
    // Fetch only when a user is signed in.
    enabled: enabled && Boolean(token && userId),
    staleTime: 15_000,
    // Catch up when returning to the workspace or recovering the network.
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // Navbar checks for new offers while the client keeps the tab visible.
    refetchInterval,
    refetchIntervalInBackground: false,
    retry: (failureCount, error) => {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      if (status !== undefined && status >= 400 && status < 500) return false;
      return failureCount < 1;
    },
  });
};
