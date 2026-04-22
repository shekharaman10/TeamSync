import type { TaskFilters } from "./types";

export const QK = {
  me: () => ["me"] as const,
  workspaces: () => ["workspaces"] as const,
  workspace: (id: string) => ["workspaces", id] as const,
  workspaceMembers: (id: string) => ["workspaces", id, "members"] as const,
  workspaceInvitations: (id: string) => ["workspaces", id, "invitations"] as const,
  workspaceAnalytics: (id: string) => ["workspaces", id, "analytics"] as const,
  projects: (wsId: string) => ["workspaces", wsId, "projects"] as const,
  project: (id: string) => ["projects", id] as const,
  epics: (projectId: string) => ["projects", projectId, "epics"] as const,
  tasks: (projectId: string, filters: TaskFilters) =>
    ["projects", projectId, "tasks", filters] as const,
  boardTasks: (projectId: string) => ["projects", projectId, "board"] as const,
  task: (id: string) => ["tasks", id] as const,
} as const;
