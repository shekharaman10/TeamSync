import type { Request, Response } from "express";
import * as svc from "./workspaces.service";
import { CreateWorkspaceSchema, UpdateWorkspaceSchema } from "./workspaces.schemas";

export async function list(req: Request, res: Response) {
  const workspaces = await svc.listWorkspaces(req.user!.id);
  res.json({ workspaces });
}

export async function get(req: Request, res: Response) {
  const workspace = await svc.getWorkspace(req.membership!.workspaceId);
  res.json({ workspace });
}

export async function create(req: Request, res: Response) {
  const input = CreateWorkspaceSchema.parse(req.body);
  const workspace = await svc.createWorkspace(req.user!.id, input);
  res.status(201).json({ workspace });
}

export async function update(req: Request, res: Response) {
  const input = UpdateWorkspaceSchema.parse(req.body);
  const workspace = await svc.updateWorkspace(req.membership!.workspaceId, input);
  res.json({ workspace });
}

export async function getMembers(req: Request, res: Response) {
  const members = await svc.listMembers(req.membership!.workspaceId);
  res.json({ members });
}

export async function deleteMember(req: Request, res: Response) {
  await svc.removeMember(req.membership!.workspaceId, req.params.userId as string);
  res.status(204).send();
}

export async function analytics(req: Request, res: Response) {
  const data = await svc.getAnalytics(req.membership!.workspaceId);
  res.json({ analytics: data });
}
