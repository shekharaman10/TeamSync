import { prisma } from "../../config/prisma";
import { HttpError } from "../../utils/http-error";
import type { CreateTaskInput, UpdateTaskInput, TaskFiltersInput } from "./tasks.schemas";
import type { Prisma } from "@prisma/client";

const taskSelect = {
  id: true,
  projectId: true,
  epicId: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  assigneeId: true,
  createdById: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  assignee: { select: { id: true, name: true, avatarUrl: true } },
  createdBy: { select: { id: true, name: true } },
  epic: { select: { id: true, title: true } },
} as const;

async function assertProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, workspaceId: true },
  });
  if (!project) throw new HttpError(404, "Project not found");

  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: project.workspaceId } },
    select: { role: true, workspaceId: true },
  });
  if (!membership) throw new HttpError(404, "Project not found");

  return { project, membership };
}

async function assertTaskAccess(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, project: { select: { workspaceId: true } } },
  });
  if (!task) throw new HttpError(404, "Task not found");

  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: task.project.workspaceId } },
    select: { role: true },
  });
  if (!membership) throw new HttpError(404, "Task not found");

  return { task, membership };
}

export async function listTasks(projectId: string, userId: string, filters: TaskFiltersInput) {
  await assertProjectAccess(projectId, userId);

  const where: Prisma.TaskWhereInput = { projectId };
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.assigneeId) where.assigneeId = filters.assigneeId;
  if (filters.epicId) where.epicId = filters.epicId;
  if (filters.search) where.title = { contains: filters.search, mode: "insensitive" };

  const limit = filters.limit ?? 25;
  const tasks = await prisma.task.findMany({
    where,
    select: taskSelect,
    take: limit + 1,
    skip: filters.cursor ? 1 : 0,
    cursor: filters.cursor ? { id: filters.cursor } : undefined,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  const hasMore = tasks.length > limit;
  const page = hasMore ? tasks.slice(0, limit) : tasks;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return { tasks: page, nextCursor };
}

export async function createTask(projectId: string, userId: string, input: CreateTaskInput) {
  await assertProjectAccess(projectId, userId);

  const task = await prisma.task.create({
    data: {
      projectId,
      title: input.title,
      description: input.description,
      status: input.status ?? "TODO",
      priority: input.priority ?? "MEDIUM",
      assigneeId: input.assigneeId,
      epicId: input.epicId,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      createdById: userId,
    },
    select: taskSelect,
  });

  return task;
}

export async function getTask(taskId: string, userId: string) {
  await assertTaskAccess(taskId, userId);
  return prisma.task.findUniqueOrThrow({ where: { id: taskId }, select: taskSelect });
}

export async function updateTask(taskId: string, userId: string, input: UpdateTaskInput) {
  await assertTaskAccess(taskId, userId);

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...input,
      dueDate: input.dueDate === null ? null : input.dueDate ? new Date(input.dueDate) : undefined,
    },
    select: taskSelect,
  });

  return task;
}

export async function deleteTask(taskId: string, userId: string) {
  await assertTaskAccess(taskId, userId);
  await prisma.task.delete({ where: { id: taskId } });
}
