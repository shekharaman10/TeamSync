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

// ── Demo seed data ────────────────────────────────────────────────────────────

const DEMO_PROJECTS = [
  {
    name: "Product Roadmap",
    key: "PRM",
    description: "Core product features and user-facing improvements",
    epics: [
      {
        title: "User Authentication & Onboarding",
        tasks: [
          { title: "Design sign-up flow with email verification",         status: "DONE"        as const, priority: "HIGH"   as const, daysOffset: -20 },
          { title: "Implement OAuth 2.0 with Google and GitHub",          status: "DONE"        as const, priority: "HIGH"   as const, daysOffset: -15 },
          { title: "Build password reset via email token",                status: "DONE"        as const, priority: "MEDIUM" as const, daysOffset: -10 },
          { title: "Add onboarding checklist for new users",              status: "IN_PROGRESS" as const, priority: "MEDIUM" as const, daysOffset:  -3 },
          { title: "Create account settings and profile page",            status: "IN_PROGRESS" as const, priority: "LOW"    as const, daysOffset:   5 },
          { title: "Implement multi-factor authentication (MFA)",         status: "TODO"        as const, priority: "URGENT" as const, daysOffset:  14 },
        ],
      },
      {
        title: "Dashboard & Analytics",
        tasks: [
          { title: "Build workspace overview dashboard",                  status: "DONE"        as const, priority: "HIGH"   as const, daysOffset: -18 },
          { title: "Implement task completion metrics chart",             status: "DONE"        as const, priority: "MEDIUM" as const, daysOffset: -12 },
          { title: "Add team velocity tracking widget",                   status: "IN_REVIEW"   as const, priority: "MEDIUM" as const, daysOffset:  -2 },
          { title: "Create exportable PDF and CSV reports",               status: "TODO"        as const, priority: "LOW"    as const, daysOffset:  21 },
          { title: "Add real-time data refresh without page reload",      status: "BACKLOG"     as const, priority: "LOW"    as const, daysOffset:   0 },
        ],
      },
      {
        title: "Team Collaboration",
        tasks: [
          { title: "Build task comment system with threading",            status: "DONE"        as const, priority: "HIGH"   as const, daysOffset: -25 },
          { title: "Implement @mention notifications in-app",             status: "IN_REVIEW"   as const, priority: "HIGH"   as const, daysOffset:   3 },
          { title: "Add file attachment support to task cards",           status: "IN_PROGRESS" as const, priority: "MEDIUM" as const, daysOffset:  10 },
          { title: "Create workspace-level activity feed",                status: "TODO"        as const, priority: "MEDIUM" as const, daysOffset:  18 },
          { title: "Build notification preference center",                status: "BACKLOG"     as const, priority: "LOW"    as const, daysOffset:   0 },
          { title: "Add emoji reactions to task comments",                status: "BACKLOG"     as const, priority: "LOW"    as const, daysOffset:   0 },
        ],
      },
    ],
  },
  {
    name: "Technical Foundation",
    key: "TFN",
    description: "Infrastructure, performance, and security improvements",
    epics: [
      {
        title: "Infrastructure & DevOps",
        tasks: [
          { title: "Set up CI/CD pipeline with GitHub Actions",           status: "DONE"        as const, priority: "URGENT" as const, daysOffset: -30 },
          { title: "Configure Docker Compose for local development",      status: "DONE"        as const, priority: "HIGH"   as const, daysOffset: -22 },
          { title: "Deploy production environment on AWS ECS",            status: "IN_PROGRESS" as const, priority: "URGENT" as const, daysOffset:  -4 },
          { title: "Set up staging environment with seed fixtures",       status: "IN_REVIEW"   as const, priority: "HIGH"   as const, daysOffset:   2 },
          { title: "Configure automated nightly database backups",        status: "TODO"        as const, priority: "HIGH"   as const, daysOffset:  12 },
        ],
      },
      {
        title: "Performance Optimization",
        tasks: [
          { title: "Add Redis caching layer for frequent DB queries",     status: "IN_PROGRESS" as const, priority: "HIGH"   as const, daysOffset:  -5 },
          { title: "Implement cursor-based pagination across all lists",  status: "DONE"        as const, priority: "MEDIUM" as const, daysOffset: -14 },
          { title: "Optimize slow Prisma queries with composite indexes", status: "IN_REVIEW"   as const, priority: "HIGH"   as const, daysOffset:   1 },
          { title: "Lazy-load board columns and virtualize long lists",   status: "TODO"        as const, priority: "MEDIUM" as const, daysOffset:  20 },
          { title: "Enable gzip compression on all API responses",        status: "BACKLOG"     as const, priority: "LOW"    as const, daysOffset:   0 },
        ],
      },
      {
        title: "Security & Compliance",
        tasks: [
          { title: "Audit all API endpoints for authorization gaps",      status: "IN_PROGRESS" as const, priority: "URGENT" as const, daysOffset:  -6 },
          { title: "Add rate limiting to auth and mutation endpoints",    status: "DONE"        as const, priority: "HIGH"   as const, daysOffset: -17 },
          { title: "Implement GDPR data export and deletion endpoint",    status: "TODO"        as const, priority: "HIGH"   as const, daysOffset:  16 },
          { title: "Add strict CSP headers and run security audit",      status: "TODO"        as const, priority: "MEDIUM" as const, daysOffset:  28 },
        ],
      },
    ],
  },
];

function daysFromNow(n: number): Date | undefined {
  if (n === 0) return undefined;
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

/** Creates demo projects, epics, and tasks for a workspace.
 *  Pass force=true to wipe all existing data first (destructive reset). */
export async function seedDemoData(workspaceId: string, userId: string, force = false) {
  const existing = await prisma.project.count({ where: { workspaceId } });
  if (existing > 0 && !force) {
    throw new HttpError(409, "Workspace already has projects — use force reset to replace them");
  }

  if (existing > 0 && force) {
    // Explicit ordered delete: tasks → epics → projects to avoid FK constraint races
    const projectIds = await prisma.project
      .findMany({ where: { workspaceId }, select: { id: true } })
      .then((ps) => ps.map((p) => p.id));

    await prisma.task.deleteMany({ where: { projectId: { in: projectIds } } });
    await prisma.epic.deleteMany({ where: { projectId: { in: projectIds } } });
    await prisma.project.deleteMany({ where: { workspaceId } });
  }

  // Collect member IDs to rotate as assignees
  const members = await prisma.membership.findMany({
    where: { workspaceId },
    select: { userId: true },
  });
  const memberIds = members.map((m) => m.userId);

  let taskTotal = 0;
  let assigneeIdx = 0;

  for (const proj of DEMO_PROJECTS) {
    const project = await prisma.project.create({
      data: { workspaceId, name: proj.name, key: proj.key, description: proj.description },
    });

    for (const ep of proj.epics) {
      const epic = await prisma.epic.create({
        data: { projectId: project.id, title: ep.title, description: null },
      });

      const taskData = ep.tasks.map((t) => {
        const assigneeId = memberIds[assigneeIdx % memberIds.length] ?? userId;
        assigneeIdx++;
        const due = daysFromNow(t.daysOffset);
        return {
          projectId: project.id,
          epicId: epic.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          assigneeId,
          createdById: userId,
          dueDate: due ?? null,
        };
      });

      await prisma.task.createMany({ data: taskData });
      taskTotal += taskData.length;
    }
  }

  return { projects: DEMO_PROJECTS.length, tasks: taskTotal };
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
