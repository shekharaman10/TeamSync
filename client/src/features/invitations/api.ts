import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { QK } from "../../lib/query-keys";
import type { Invitation } from "../../lib/types";
import type { InviteInput } from "./schemas";

type InvitationsResponse = { invitations: Invitation[] };

export function useWorkspaceInvitations(workspaceId: string) {
  return useQuery({
    queryKey: QK.workspaceInvitations(workspaceId),
    queryFn: async () => {
      const { data } = await api.get<InvitationsResponse>(
        `/workspaces/${workspaceId}/invitations`
      );
      return data.invitations;
    },
  });
}

export function useInviteUser(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: InviteInput) => {
      const { data } = await api.post<{ invitation: Invitation }>(
        `/workspaces/${workspaceId}/invitations`,
        input
      );
      return data.invitation;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.workspaceInvitations(workspaceId) }),
  });
}

export function useRevokeInvitation(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invitationId: string) => {
      await api.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.workspaceInvitations(workspaceId) }),
  });
}

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await api.post<{ workspace: { id: string; name: string } }>(
        "/invitations/accept",
        { token }
      );
      return data.workspace;
    },
  });
}
