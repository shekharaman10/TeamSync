import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http-error";

/**
 * Factory that returns middleware resolving a workspace from a URL slug param,
 * verifying the authenticated user is a member, and attaching req.membership.
 *
 * 404 is returned for both "workspace not found" and "user not a member" so
 * non-members cannot enumerate whether a workspace slug exists.
 *
 * Must run after requireAuth.
 */
export function requireMembership(slugParam: string) {
  return async function (req: Request, _res: Response, next: NextFunction): Promise<void> {
    if (!req.user) {
      next(new HttpError(500, "Internal server error"));
      return;
    }

    const slug = req.params[slugParam] as string | undefined;
    if (!slug) {
      next(new HttpError(404, "Resource not found"));
      return;
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspace) {
      next(new HttpError(404, "Resource not found"));
      return;
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: { userId: req.user.id, workspaceId: workspace.id },
      },
      select: { userId: true, workspaceId: true, role: true },
    });
    if (!membership) {
      next(new HttpError(404, "Resource not found"));
      return;
    }

    req.membership = membership;
    next();
  };
}
