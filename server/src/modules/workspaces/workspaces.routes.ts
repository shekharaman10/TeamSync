import { Router } from "express";
import { requireAuth } from "../../middleware/require-auth";
import { requireWorkspaceMember } from "../../middleware/require-workspace-member";
import { requireRole } from "../../middleware/require-role";
import * as ctrl from "./workspaces.controller";

export const workspacesRouter = Router();

const member = [requireAuth, requireWorkspaceMember()];
const adminOrOwner = [...member, requireRole("ADMIN", "OWNER")];

workspacesRouter.get("/workspaces", requireAuth, ctrl.list);
workspacesRouter.post("/workspaces", requireAuth, ctrl.create);

workspacesRouter.get("/workspaces/:workspaceId", ...member, ctrl.get);
workspacesRouter.patch("/workspaces/:workspaceId", ...adminOrOwner, ctrl.update);

workspacesRouter.get("/workspaces/:workspaceId/members", ...member, ctrl.getMembers);
workspacesRouter.delete("/workspaces/:workspaceId/members/:userId", ...adminOrOwner, ctrl.deleteMember);

workspacesRouter.get("/workspaces/:workspaceId/analytics", ...member, ctrl.analytics);
workspacesRouter.post("/workspaces/:workspaceId/seed-demo", ...member, ctrl.seedDemo);
