import type { Response } from "express";
import { env } from "../config/env";

const IS_PROD = env.NODE_ENV === "production";

const BASE = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: "strict" as const,
};

/** Sets access_token and refresh_token httpOnly cookies on the response. */
export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
): void {
  res.cookie("access_token", accessToken, {
    ...BASE,
    path: "/api",
    maxAge: 15 * 60 * 1000,
  });
  // Refresh cookie is scoped to /api/auth so it's only sent to auth endpoints.
  res.cookie("refresh_token", refreshToken, {
    ...BASE,
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

/** Clears both auth cookies. Path must match what was used during set. */
export function clearAuthCookies(res: Response): void {
  res.clearCookie("access_token", { path: "/api" });
  res.clearCookie("refresh_token", { path: "/api/auth" });
}
