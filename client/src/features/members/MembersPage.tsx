import { useParams } from "react-router-dom";
import { useWorkspaceMembers, useRemoveMember } from "../workspaces/api";
import { useAuthStore } from "../auth/useAuthStore";
import { InviteForm } from "../invitations/components/InviteForm";
import { PendingInvitesList } from "../invitations/components/PendingInvitesList";
import { RoleBadge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorBanner } from "../../components/ui/ErrorBanner";

export function MembersPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user } = useAuthStore();
  const { data: members, isPending, isError, refetch } = useWorkspaceMembers(workspaceId!);
  const { mutate: removeMember } = useRemoveMember(workspaceId!);

  const currentMember = members?.find((m) => m.user.id === user?.id);
  const canManage = currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-4">
        <div>
          <h1 className="text-base font-semibold text-white">Members</h1>
          {members && (
            <p className="text-xs text-zinc-500">
              {members.length} {members.length === 1 ? "member" : "members"}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {canManage && (
          <div className="mb-6">
            <InviteForm workspaceId={workspaceId!} />
          </div>
        )}

        {isPending && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        )}

        {isError && (
          <ErrorBanner message="Failed to load members." onRetry={() => void refetch()} />
        )}

        {members && (
          <div className="space-y-2">
            {members.map((member) => {
              const initials = member.user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              const isSelf = member.user.id === user?.id;
              const isOwner = member.role === "OWNER";

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-4 rounded-xl border border-white/5 bg-zinc-800/40 px-5 py-4 transition-colors hover:bg-zinc-800/60"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-sm font-bold text-teal-300">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-100">
                      {member.user.name}
                      {isSelf && <span className="ml-2 text-xs text-zinc-600">(you)</span>}
                    </p>
                    <p className="text-xs text-zinc-500">{member.user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-600">
                      {new Date(member.joinedAt).toLocaleDateString(undefined, {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <RoleBadge role={member.role} />
                    {canManage && !isOwner && !isSelf && (
                      <button
                        type="button"
                        title="Remove member"
                        onClick={() => removeMember(member.user.id)}
                        className="rounded p-1 text-zinc-600 transition-colors hover:text-red-400"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {canManage && (
          <div className="mt-8">
            <PendingInvitesList workspaceId={workspaceId!} />
          </div>
        )}
      </div>
    </div>
  );
}
