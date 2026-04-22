import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry 401s — the interceptor handles refresh transparently.
      retry: false,
      staleTime: 30_000,
    },
  },
});
