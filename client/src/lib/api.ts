import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  withCredentials: true,
});

// Callback wired in main.tsx so lib/api.ts has no dependency on Zustand.
let onAuthFailure: (() => void) | null = null;

export function setOnAuthFailure(fn: () => void): void {
  onAuthFailure = fn;
}

export function getOnAuthFailure(): (() => void) | null {
  return onAuthFailure;
}
