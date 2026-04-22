import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "../lib/query-client";
import { setOnAuthFailure } from "../lib/api";
import { useAuthStore } from "../features/auth/useAuthStore";

// Wire the auth-failure callback once, outside any component, so lib/api.ts
// never needs to import from features/.
setOnAuthFailure(() => useAuthStore.getState().clear());

type Props = { children: React.ReactNode };

export function Providers({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
