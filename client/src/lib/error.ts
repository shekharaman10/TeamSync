import { isAxiosError } from "axios";
import { ZodError } from "zod";

/**
 * Extracts a human-readable error message from any thrown value.
 * Handles Axios HTTP errors, Axios network failures, client-side ZodErrors,
 * and unknown errors — always returns a non-empty string safe for display.
 */
export function extractErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    // No response → network-level failure (server down, DNS, CORS preflight fail)
    if (!error.response) {
      return "Unable to reach the server. Check your connection.";
    }
    // Server responded: use message only if it's a non-empty string
    const msg: unknown = error.response.data?.message;
    if (typeof msg === "string" && msg.trim().length > 0) {
      return msg;
    }
    return "Something went wrong. Please try again.";
  }

  // Client-side ZodError — shouldn't reach onError in RHF flows (zodResolver
  // blocks submission), but handled defensively for reuse outside forms.
  if (error instanceof ZodError) {
    const first = error.errors[0];
    return first
      ? `${first.path.join(".") ? first.path.join(".") + ": " : ""}${first.message}`
      : "Validation error.";
  }

  return "Something went wrong. Please try again.";
}
