import { Router } from "express";
import { requireAuth } from "../../middleware/require-auth";
import { requireWorkspaceMember } from "../../middleware/require-workspace-member";
import { requireRole } from "../../middleware/require-role";
import * as ctrl from "./invitations.controller";

export const invitationsRouter = Router();

const adminOrOwner = [requireAuth, requireWorkspaceMember(), requireRole("ADMIN", "OWNER")];

invitationsRouter.get("/workspaces/:workspaceId/invitations", ...adminOrOwner, ctrl.list);
invitationsRouter.post("/workspaces/:workspaceId/invitations", ...adminOrOwner, ctrl.create);
invitationsRouter.delete("/workspaces/:workspaceId/invitations/:invitationId", ...adminOrOwner, ctrl.revoke);

// Accept is public-ish — requires auth but no workspace membership yet
invitationsRouter.post("/invitations/accept", requireAuth, ctrl.accept);
