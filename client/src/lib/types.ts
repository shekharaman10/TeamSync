export type TaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type Role = "OWNER" | "ADMIN" | "MEMBER";

export type TaskFilters = {
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string;
  epicId?: string;
  search?: string;
};

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceMember = {
  id: string;
  userId: string;
  workspaceId: string;
  role: Role;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
};

export type Invitation = {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
  createdAt: string;
  invitedBy?: { id: string; name: string };
};

export type Project = {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  description: string | null;
  taskCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type Epic = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  taskCount: number;
  doneCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  id: string;
  projectId: string;
  epicId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  assigneeId: string | null;
  createdById: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
  createdBy: { id: string; name: string };
  epic: { id: string; title: string } | null;
};

export type AnalyticsData = {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
  tasksByPriority: Record<Priority, number>;
  tasksByAssignee: Array<{
    userId: string;
    name: string;
    avatarUrl: string | null;
    count: number;
    doneCount: number;
  }>;
};
