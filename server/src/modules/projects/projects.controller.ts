import type { Request, Response } from "express";
import * as svc from "./projects.service";
import { CreateProjectSchema, UpdateProjectSchema } from "./projects.schemas";

export async function list(req: Request, res: Response) {
  const projects = await svc.listProjects(req.membership!.workspaceId);
  res.json({ projects });
}

export async function get(req: Request, res: Response) {
  const project = await svc.getProject(req.params.projectId as string, req.user!.id);
  res.json({ project });
}

export async function create(req: Request, res: Response) {
  const input = CreateProjectSchema.parse(req.body);
  const project = await svc.createProject(req.membership!.workspaceId, input);
  res.status(201).json({ project });
}

export async function update(req: Request, res: Response) {
  const input = UpdateProjectSchema.parse(req.body);
  const project = await svc.updateProject(req.params.projectId as string, req.user!.id, input);
  res.json({ project });
}

export async function remove(req: Request, res: Response) {
  await svc.deleteProject(req.params.projectId as string, req.user!.id);
  res.status(204).send();
}
