import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { QK } from "../../lib/query-keys";
import type { Workspace, WorkspaceMember } from "../../lib/types";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "./schemas";

type WorkspacesResponse = { workspaces: Workspace[] };
type WorkspaceResponse = { workspace: Workspace };
type MembersResponse = { members: WorkspaceMember[] };

export function useWorkspaces() {
  return useQuery({
    queryKey: QK.workspaces(),
    queryFn: async () => {
      const { data } = await api.get<WorkspacesResponse>("/workspaces");
      return data.workspaces;
    },
    staleTime: 60_000,
  });
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: QK.workspace(id),
    queryFn: async () => {
      const { data } = await api.get<WorkspaceResponse>(`/workspaces/${id}`);
      return data.workspace;
    },
    staleTime: 60_000,
  });
}

export function useWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: QK.workspaceMembers(workspaceId),
    queryFn: async () => {
      const { data } = await api.get<MembersResponse>(`/workspaces/${workspaceId}/members`);
      return data.members;
    },
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateWorkspaceInput) => {
      const { data } = await api.post<WorkspaceResponse>("/workspaces", input);
      return data.workspace;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.workspaces() }),
  });
}

export function useUpdateWorkspace(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateWorkspaceInput) => {
      const { data } = await api.patch<WorkspaceResponse>(`/workspaces/${workspaceId}`, input);
      return data.workspace;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.workspace(workspaceId) });
      qc.invalidateQueries({ queryKey: QK.workspaces() });
    },
  });
}

export function useRemoveMember(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.workspaceMembers(workspaceId) }),
  });
}

export function useSeedDemo(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ force = false }: { force?: boolean } = {}) => {
      const url = force
        ? `/workspaces/${workspaceId}/seed-demo?force=true`
        : `/workspaces/${workspaceId}/seed-demo`;
      const { data } = await api.post<{ message: string; projects: number; tasks: number }>(url);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.projects(workspaceId) });
      qc.invalidateQueries({ queryKey: QK.workspaceAnalytics(workspaceId) });
      qc.invalidateQueries({ queryKey: QK.workspaceMembers(workspaceId) });
    },
  });
}

export function useUpdateMemberRole(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await api.patch(`/workspaces/${workspaceId}/members/${userId}`, { role });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.workspaceMembers(workspaceId) }),
  });
}
