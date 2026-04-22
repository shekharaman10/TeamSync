import type { Request, Response } from "express";
import * as svc from "./epics.service";
import { CreateEpicSchema } from "./epics.schemas";

export async function list(req: Request, res: Response) {
  const epics = await svc.listEpics(req.params.projectId as string, req.user!.id);
  res.json({ epics });
}

export async function create(req: Request, res: Response) {
  const input = CreateEpicSchema.parse(req.body);
  const epic = await svc.createEpic(req.params.projectId as string, req.user!.id, input);
  res.status(201).json({ epic });
}

export async function remove(req: Request, res: Response) {
  await svc.deleteEpic(req.params.epicId as string, req.user!.id);
  res.status(204).send();
}
