import axios from "axios";
import type { AxiosError } from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  withCredentials: true,
});

// Wired in providers.tsx so lib/api.ts has no dependency on Zustand.
let onAuthFailure: (() => void) | null = null;

export function setOnAuthFailure(fn: () => void): void {
  onAuthFailure = fn;
}

// Auth endpoints that must never trigger a refresh attempt.
// Using endsWith to avoid substring matches on future paths.
const AUTH_ENDPOINTS = [
  "/auth/refresh",
  "/auth/login",
  "/auth/signup",
  "/auth/logout",
];

function isAuthEndpoint(url: string | undefined): boolean {
  return AUTH_ENDPOINTS.some((endpoint) => url?.endsWith(endpoint));
}

// Shared promise while a refresh is in flight.
// All concurrent 401s attach to it instead of firing multiple /refresh calls.
let refreshPromise: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config;

    if (
      error.response?.status !== 401 ||
      !config ||
      isAuthEndpoint(config.url)
    ) {
      return Promise.reject(error);
    }

    if (!refreshPromise) {
      refreshPromise = api
        .post("/auth/refresh")
        .then(() => undefined)
        .catch((refreshError: unknown) => {
          // Refresh failed — session is dead. Clear auth state.
          // The router detects the Zustand change and redirects to /login.
          onAuthFailure?.();
          return Promise.reject(refreshError);
        })
        .finally(() => {
          // Clean up so future 401s trigger a fresh attempt.
          refreshPromise = null;
        });
    }

    // Await the shared promise — whether this request started it or joined it.
    await refreshPromise;
    // Cookies are now rotated; replay the original request.
    return api(config);
  }
);
