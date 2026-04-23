import type { Request, Response } from "express";
import * as svc from "./tasks.service";
import * as commentSvc from "./comments.service";
import { CreateTaskSchema, UpdateTaskSchema, TaskFiltersSchema, CreateCommentSchema, UpdateCommentSchema } from "./tasks.schemas";

export async function list(req: Request, res: Response) {
  const filters = TaskFiltersSchema.parse(req.query);
  const result = await svc.listTasks(req.params.projectId as string, req.user!.id, filters);
  res.json(result);
}

export async function create(req: Request, res: Response) {
  const input = CreateTaskSchema.parse(req.body);
  const task = await svc.createTask(req.params.projectId as string, req.user!.id, input);
  res.status(201).json({ task });
}

export async function get(req: Request, res: Response) {
  const task = await svc.getTask(req.params.taskId as string, req.user!.id);
  res.json({ task });
}

export async function update(req: Request, res: Response) {
  const input = UpdateTaskSchema.parse(req.body);
  const task = await svc.updateTask(req.params.taskId as string, req.user!.id, input);
  res.json({ task });
}

export async function remove(req: Request, res: Response) {
  await svc.deleteTask(req.params.taskId as string, req.user!.id);
  res.status(204).send();
}

export async function listComments(req: Request, res: Response) {
  const comments = await commentSvc.listComments(req.params.taskId as string, req.user!.id);
  res.json({ comments });
}

export async function createComment(req: Request, res: Response) {
  const { body } = CreateCommentSchema.parse(req.body);
  const comment = await commentSvc.createComment(req.params.taskId as string, req.user!.id, body);
  res.status(201).json({ comment });
}

export async function updateComment(req: Request, res: Response) {
  const { body } = UpdateCommentSchema.parse(req.body);
  const comment = await commentSvc.updateComment(req.params.commentId as string, req.user!.id, body);
  res.json({ comment });
}

export async function removeComment(req: Request, res: Response) {
  await commentSvc.deleteComment(req.params.commentId as string, req.user!.id);
  res.status(204).send();
}
