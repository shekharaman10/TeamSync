import type { Request, Response, NextFunction } from "express";
import type { Role } from "@prisma/client";
import { HttpError } from "../utils/http-error";

/**
 * Returns middleware that enforces req.membership.role is in the allowed set.
 * Requires at least one role argument (enforced by TypeScript tuple type).
 * Must run after requireMembership.
 */
export function requireRole(...roles: [Role, ...Role[]]) {
  return function (req: Request, _res: Response, next: NextFunction): void {
    if (!req.membership) {
      next(new HttpError(500, "Internal server error"));
      return;
    }

    if (!roles.includes(req.membership.role)) {
      next(new HttpError(403, "Forbidden"));
      return;
    }

    next();
  };
}
