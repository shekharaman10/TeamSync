import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { HttpError } from "../utils/http-error";

/** Reads the access_token cookie, verifies it, and attaches req.user = { id }. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token: string | undefined = req.cookies?.access_token;
  if (!token) {
    next(new HttpError(401, "Unauthorized"));
    return;
  }
  try {
    const { userId } = verifyAccessToken(token);
    req.user = { id: userId };
    next();
  } catch {
    next(new HttpError(401, "Unauthorized"));
  }
}
