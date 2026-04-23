import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "../../lib/api";
import { QK } from "../../lib/query-keys";
import type { Task, TaskFilters, Comment } from "../../lib/types";
import type { CreateTaskInput, UpdateTaskInput } from "./schemas";

type TasksPage = { tasks: Task[]; nextCursor: string | null };

export function useInfiniteTasks(projectId: string, filters: TaskFilters) {
  return useInfiniteQuery({
    queryKey: QK.tasks(projectId, filters),
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<TasksPage>(`/projects/${projectId}/tasks`, {
        params: { ...filters, cursor: pageParam, limit: 25 },
      });
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useBoardTasks(projectId: string) {
  return useQuery({
    queryKey: QK.boardTasks(projectId),
    queryFn: async () => {
      const { data } = await api.get<{ tasks: Task[] }>(`/projects/${projectId}/tasks`, {
        params: { limit: 200 },
      });
      return data.tasks;
    },
    staleTime: 30_000,
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: QK.task(taskId),
    queryFn: async () => {
      const { data } = await api.get<{ task: Task }>(`/tasks/${taskId}`);
      return data.task;
    },
  });
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const { data } = await api.post<{ task: Task }>(`/projects/${projectId}/tasks`, input);
      return data.task;
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ["projects", projectId, "tasks"] });
      qc.invalidateQueries({ queryKey: QK.boardTasks(projectId) });
      qc.invalidateQueries({ queryKey: QK.epics(task.projectId) });
    },
  });
}

export function useUpdateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, ...input }: UpdateTaskInput & { taskId: string }) => {
      const { data } = await api.patch<{ task: Task }>(`/tasks/${taskId}`, input);
      return data.task;
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ["projects", projectId, "tasks"] });
      qc.invalidateQueries({ queryKey: QK.boardTasks(projectId) });
      qc.setQueryData(QK.task(task.id), task);
    },
  });
}

export function useDeleteTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId, "tasks"] });
      qc.invalidateQueries({ queryKey: QK.boardTasks(projectId) });
    },
  });
}

export function useComments(taskId: string) {
  return useQuery({
    queryKey: QK.comments(taskId),
    queryFn: async () => {
      const { data } = await api.get<{ comments: Comment[] }>(`/tasks/${taskId}/comments`);
      return data.comments;
    },
    enabled: !!taskId,
  });
}

export function useCreateComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const { data } = await api.post<{ comment: Comment }>(`/tasks/${taskId}/comments`, { body });
      return data.comment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.comments(taskId) });
    },
  });
}

export function useUpdateComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, body }: { commentId: string; body: string }) => {
      const { data } = await api.patch<{ comment: Comment }>(`/tasks/${taskId}/comments/${commentId}`, { body });
      return data.comment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.comments(taskId) });
    },
  });
}

export function useDeleteComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/tasks/${taskId}/comments/${commentId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.comments(taskId) });
    },
  });
}
