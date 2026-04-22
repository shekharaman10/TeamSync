import { prisma } from "../../config/prisma";
import { HttpError } from "../../utils/http-error";
import type { CreateEpicInput } from "./epics.schemas";

async function assertProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, workspaceId: true },
  });
  if (!project) throw new HttpError(404, "Project not found");

  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: project.workspaceId } },
    select: { role: true },
  });
  if (!membership) throw new HttpError(404, "Project not found");

  return { project, membership };
}

export async function listEpics(projectId: string, userId: string) {
  await assertProjectAccess(projectId, userId);

  const epics = await prisma.epic.findMany({
    where: { projectId },
    select: {
      id: true,
      projectId: true,
      title: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { tasks: true } },
      tasks: { select: { status: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return epics.map(({ _count, tasks, ...e }) => ({
    ...e,
    taskCount: _count.tasks,
    doneCount: tasks.filter((t) => t.status === "DONE").length,
  }));
}

export async function createEpic(projectId: string, userId: string, input: CreateEpicInput) {
  await assertProjectAccess(projectId, userId);

  const epic = await prisma.epic.create({
    data: { projectId, title: input.title, description: input.description },
    select: {
      id: true,
      projectId: true,
      title: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { ...epic, taskCount: 0, doneCount: 0 };
}

export async function deleteEpic(epicId: string, userId: string) {
  const epic = await prisma.epic.findUnique({
    where: { id: epicId },
    select: { id: true, project: { select: { workspaceId: true } } },
  });
  if (!epic) throw new HttpError(404, "Epic not found");

  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: epic.project.workspaceId } },
    select: { role: true },
  });
  if (!membership) throw new HttpError(404, "Epic not found");
  if (membership.role === "MEMBER") throw new HttpError(403, "Forbidden");

  await prisma.epic.delete({ where: { id: epicId } });
}
