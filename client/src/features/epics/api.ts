import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { QK } from "../../lib/query-keys";
import type { Epic } from "../../lib/types";
import type { CreateEpicInput } from "./schemas";

type EpicsResponse = { epics: Epic[] };

export function useEpics(projectId: string) {
  return useQuery({
    queryKey: QK.epics(projectId),
    queryFn: async () => {
      const { data } = await api.get<EpicsResponse>(`/projects/${projectId}/epics`);
      return data.epics;
    },
  });
}

export function useCreateEpic(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateEpicInput) => {
      const { data } = await api.post<{ epic: Epic }>(`/projects/${projectId}/epics`, input);
      return data.epic;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.epics(projectId) }),
  });
}

export function useDeleteEpic(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (epicId: string) => {
      await api.delete(`/epics/${epicId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.epics(projectId) }),
  });
}
