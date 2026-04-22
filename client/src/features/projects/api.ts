import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { QK } from "../../lib/query-keys";
import type { Project } from "../../lib/types";
import type { CreateProjectInput, UpdateProjectInput } from "./schemas";

type ProjectsResponse = { projects: Project[] };
type ProjectResponse = { project: Project };

export function useProjects(workspaceId: string) {
  return useQuery({
    queryKey: QK.projects(workspaceId),
    queryFn: async () => {
      const { data } = await api.get<ProjectsResponse>(
        `/workspaces/${workspaceId}/projects`
      );
      return data.projects;
    },
    staleTime: 30_000,
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: QK.project(projectId),
    queryFn: async () => {
      const { data } = await api.get<ProjectResponse>(`/projects/${projectId}`);
      return data.project;
    },
    staleTime: 60_000,
  });
}

export function useCreateProject(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const { data } = await api.post<ProjectResponse>(
        `/workspaces/${workspaceId}/projects`,
        input
      );
      return data.project;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.projects(workspaceId) }),
  });
}

export function useUpdateProject(workspaceId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateProjectInput) => {
      const { data } = await api.patch<ProjectResponse>(`/projects/${projectId}`, input);
      return data.project;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.project(projectId) });
      qc.invalidateQueries({ queryKey: QK.projects(workspaceId) });
    },
  });
}

export function useDeleteProject(workspaceId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/projects/${projectId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.projects(workspaceId) }),
  });
}
