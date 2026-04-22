import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { User } from "./useAuthStore";
import type { SignupInput, LoginInput } from "./auth.schemas";

type AuthResponse = { user: User };

export async function signup(input: SignupInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/signup", input);
  return data;
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", input);
  return data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<AuthResponse>("/auth/me");
  return data.user;
}

export async function logoutRequest(): Promise<void> {
  await api.post("/auth/logout");
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    retry: false,
    // 5-min stale time: re-checks /me when a stale tab regains focus,
    // catching server-side session invalidation without polling.
    staleTime: 5 * 60 * 1000,
  });
}

export function useSignup() {
  return useMutation({ mutationFn: signup });
}

export function useLogin() {
  return useMutation({ mutationFn: login });
}
