import { prisma } from "../../config/prisma";
import { HttpError } from "../../utils/http-error";
import type { CreateProjectInput, UpdateProjectInput } from "./projects.schemas";

const projectSelect = {
  id: true,
  workspaceId: true,
  name: true,
  key: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { tasks: true } },
} as const;

function fmt(p: { _count: { tasks: number }; id: string; workspaceId: string; name: string; key: string; description: string | null; createdAt: Date; updatedAt: Date }) {
  const { _count, ...rest } = p;
  return { ...rest, taskCount: _count.tasks };
}

/** Verifies the user is a member of the workspace that owns the project. Returns membership. */
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

export async function listProjects(workspaceId: string) {
  const projects = await prisma.project.findMany({
    where: { workspaceId },
    select: projectSelect,
    orderBy: { createdAt: "asc" },
  });
  return projects.map(fmt);
}

export async function getProject(projectId: string, userId: string) {
  const { project } = await assertProjectAccess(projectId, userId);
  const p = await prisma.project.findUniqueOrThrow({
    where: { id: project.id },
    select: projectSelect,
  });
  return fmt(p);
}

export async function createProject(workspaceId: string, input: CreateProjectInput) {
  const existing = await prisma.project.findUnique({
    where: { workspaceId_key: { workspaceId, key: input.key } },
  });
  if (existing) throw new HttpError(409, "Project key already in use in this workspace");

  const p = await prisma.project.create({
    data: { workspaceId, name: input.name, key: input.key, description: input.description },
    select: projectSelect,
  });
  return fmt(p);
}

export async function updateProject(projectId: string, userId: string, input: UpdateProjectInput) {
  const { project, membership } = await assertProjectAccess(projectId, userId);
  if (membership.role === "MEMBER") throw new HttpError(403, "Forbidden");

  if (input.key) {
    const existing = await prisma.project.findUnique({
      where: { workspaceId_key: { workspaceId: project.workspaceId, key: input.key } },
    });
    if (existing && existing.id !== projectId) throw new HttpError(409, "Project key already in use");
  }

  const p = await prisma.project.update({
    where: { id: projectId },
    data: input,
    select: projectSelect,
  });
  return fmt(p);
}

export async function deleteProject(projectId: string, userId: string) {
  const { membership } = await assertProjectAccess(projectId, userId);
  if (membership.role === "MEMBER") throw new HttpError(403, "Forbidden");

  await prisma.project.delete({ where: { id: projectId } });
}
