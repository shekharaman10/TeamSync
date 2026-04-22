import type { Request, Response } from "express";
import * as svc from "./invitations.service";
import { InviteSchema, AcceptInviteSchema } from "./invitations.schemas";

export async function list(req: Request, res: Response) {
  const invitations = await svc.listInvitations(req.membership!.workspaceId);
  res.json({ invitations });
}

export async function create(req: Request, res: Response) {
  const input = InviteSchema.parse(req.body);
  const invitation = await svc.createInvitation(req.membership!.workspaceId, req.user!.id, input);
  res.status(201).json({ invitation });
}

export async function revoke(req: Request, res: Response) {
  await svc.revokeInvitation(req.membership!.workspaceId, req.params.invitationId as string);
  res.status(204).send();
}

export async function accept(req: Request, res: Response) {
  const { token } = AcceptInviteSchema.parse(req.body);
  const workspace = await svc.acceptInvitation(token, req.user!.id);
  res.json({ workspace });
}
