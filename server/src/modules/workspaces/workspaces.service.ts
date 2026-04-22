import { prisma } from "../../config/prisma";
import { HttpError } from "../../utils/http-error";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "./workspaces.schemas";
import type { TaskStatus, Priority } from "@prisma/client";

const workspaceSelect = {
  id: true,
  name: true,
  slug: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { members: true } },
} as const;

function fmt(ws: { _count: { members: number }; id: string; name: string; slug: string; ownerId: string; createdAt: Date; updatedAt: Date }) {
  const { _count, ...rest } = ws;
  return { ...rest, memberCount: _count.members };
}

/** Returns all workspaces the user is a member of. */
export async function listWorkspaces(userId: string) {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { workspace: { select: workspaceSelect } },
    orderBy: { joinedAt: "asc" },
  });
  return memberships.map((m) => fmt(m.workspace));
}

/** Gets a single workspace; throws 404 if not found. Membership already verified by middleware. */
export async function getWorkspace(workspaceId: string) {
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: workspaceSelect,
  });
  if (!ws) throw new HttpError(404, "Workspace not found");
  return fmt(ws);
}

/** Creates a workspace and owner membership in a single transaction. */
export async function createWorkspace(userId: string, input: CreateWorkspaceInput) {
  const existing = await prisma.workspace.findUnique({ where: { slug: input.slug } });
  if (existing) throw new HttpError(409, "Slug already in use");

  const workspaceId = await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.create({
      data: { name: input.name, slug: input.slug, ownerId: userId },
    });
    await tx.membership.create({
      data: { userId, workspaceId: ws.id, role: "OWNER" },
    });
    return ws.id;
  });

  const ws = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: workspaceSelect,
  });
  return fmt(ws);
}

/** Updates workspace name/slug. Membership + role already verified by middleware. */
export async function updateWorkspace(workspaceId: string, input: UpdateWorkspaceInput) {
  if (input.slug) {
    const existing = await prisma.workspace.findUnique({ where: { slug: input.slug } });
    if (existing && existing.id !== workspaceId) throw new HttpError(409, "Slug already in use");
  }
  const ws = await prisma.workspace.update({
    where: { id: workspaceId },
    data: input,
    select: workspaceSelect,
  });
  return fmt(ws);
}

/** Lists all members of a workspace. */
export async function listMembers(workspaceId: string) {
  return prisma.membership.findMany({
    where: { workspaceId },
    select: {
      id: true,
      userId: true,
      workspaceId: true,
      role: true,
      joinedAt: true,
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { joinedAt: "asc" },
  });
}

/** Removes a member from a workspace. Cannot remove the OWNER. */
export async function removeMember(workspaceId: string, targetUserId: string) {
  const target = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
  });
  if (!target) throw new HttpError(404, "Member not found");
  if (target.role === "OWNER") throw new HttpError(403, "Cannot remove the workspace owner");

  await prisma.membership.delete({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
  });
}

/** Aggregates task metrics across all projects in the workspace. */
export async function getAnalytics(workspaceId: string) {
  const projects = await prisma.project.findMany({
    where: { workspaceId },
    select: { id: true },
  });
  const projectIds = projects.map((p) => p.id);

  if (projectIds.length === 0) {
    const empty: Record<string, number> = {};
    const statuses: TaskStatus[] = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
    const priorities: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
    return {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      overdueTasks: 0,
      tasksByStatus: Object.fromEntries(statuses.map((s) => [s, 0])) as Record<TaskStatus, number>,
      tasksByPriority: Object.fromEntries(priorities.map((p) => [p, 0])) as Record<Priority, number>,
      tasksByAssignee: [],
    };
  }

  const now = new Date();
  const tasks = await prisma.task.findMany({
    where: { projectId: { in: projectIds } },
    select: {
      status: true,
      priority: true,
      dueDate: true,
      assigneeId: true,
      assignee: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  const statuses: TaskStatus[] = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
  const priorities: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

  const tasksByStatus = Object.fromEntries(statuses.map((s) => [s, 0])) as Record<TaskStatus, number>;
  const tasksByPriority = Object.fromEntries(priorities.map((p) => [p, 0])) as Record<Priority, number>;
  const assigneeMap = new Map<string, { userId: string; name: string; avatarUrl: string | null; count: number; doneCount: number }>();

  let completedTasks = 0;
  let inProgressTasks = 0;
  let overdueTasks = 0;

  for (const task of tasks) {
    tasksByStatus[task.status] = (tasksByStatus[task.status] ?? 0) + 1;
    tasksByPriority[task.priority] = (tasksByPriority[task.priority] ?? 0) + 1;

    if (task.status === "DONE") completedTasks++;
    if (task.status === "IN_PROGRESS") inProgressTasks++;
    if (task.dueDate && task.dueDate < now && task.status !== "DONE") overdueTasks++;

    if (task.assignee) {
      const entry = assigneeMap.get(task.assignee.id) ?? {
        userId: task.assignee.id,
        name: task.assignee.name,
        avatarUrl: task.assignee.avatarUrl,
        count: 0,
        doneCount: 0,
      };
      entry.count++;
      if (task.status === "DONE") entry.doneCount++;
      assigneeMap.set(task.assignee.id, entry);
    }
  }

  return {
    totalTasks: tasks.length,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    tasksByStatus,
    tasksByPriority,
    tasksByAssignee: Array.from(assigneeMap.values()),
  };
}
