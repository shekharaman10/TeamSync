import jwt from "jsonwebtoken";
import { env } from "../config/env";

/** Signs a short-lived access token (15 min) containing only the user id. */
export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
}

/** Verifies an access token and returns the userId. Throws on invalid or expired. */
export function verifyAccessToken(token: string): { userId: string } {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string };
  return { userId: payload.sub };
}
