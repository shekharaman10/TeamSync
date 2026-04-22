import { Router } from "express";
import { requireAuth } from "../../middleware/require-auth";
import { requireWorkspaceMember } from "../../middleware/require-workspace-member";
import * as ctrl from "./projects.controller";

export const projectsRouter = Router();

// Workspace-scoped project listing/creation — membership verified via workspaceId
projectsRouter.get(
  "/workspaces/:workspaceId/projects",
  requireAuth,
  requireWorkspaceMember(),
  ctrl.list
);
projectsRouter.post(
  "/workspaces/:workspaceId/projects",
  requireAuth,
  requireWorkspaceMember(),
  ctrl.create
);

// Project-specific routes — access check done inline in service
projectsRouter.get("/projects/:projectId", requireAuth, ctrl.get);
projectsRouter.patch("/projects/:projectId", requireAuth, ctrl.update);
projectsRouter.delete("/projects/:projectId", requireAuth, ctrl.remove);
