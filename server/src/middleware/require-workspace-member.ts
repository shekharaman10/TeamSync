import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http-error";

/**
 * Verifies the authenticated user is a member of the workspace identified
 * by the workspaceId URL parameter (DB id, not slug) and attaches req.membership.
 * Returns 404 for both "not found" and "not a member" to prevent enumeration.
 */
export function requireWorkspaceMember(paramName = "workspaceId") {
  return async function (req: Request, _res: Response, next: NextFunction): Promise<void> {
    if (!req.user) {
      next(new HttpError(500, "Internal server error"));
      return;
    }
    const workspaceId = req.params[paramName] as string;
    if (!workspaceId) {
      next(new HttpError(404, "Not found"));
      return;
    }
    const membership = await prisma.membership.findUnique({
      where: { userId_workspaceId: { userId: req.user.id, workspaceId } },
      select: { userId: true, workspaceId: true, role: true },
    });
    if (!membership) {
      next(new HttpError(404, "Not found"));
      return;
    }
    req.membership = membership;
    next();
  };
}
