// One shared cache for all server data.
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // one retry on failure instead of the default three
      refetchOnWindowFocus: false, // do not refetch every time the tab gets focus
    },
  },
});
