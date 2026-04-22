import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { useWorkspaceInvitations, useRevokeInvitation } from "../api";

type Props = { workspaceId: string };

function formatExpiry(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function PendingInvitesList({ workspaceId }: Props) {
  const { data, isPending, isError, refetch } = useWorkspaceInvitations(workspaceId);
  const { mutate: revoke } = useRevokeInvitation(workspaceId);

  if (isPending) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
      </div>
    );
  }

  if (isError) {
    return <ErrorBanner message="Failed to load invitations." onRetry={() => void refetch()} />;
  }

  if (!data || data.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Pending invitations ({data.length})
      </h2>
      <div className="space-y-2">
        {data.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center gap-4 rounded-xl border border-white/5 bg-zinc-800/40 px-5 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-200">{inv.email}</p>
              <p className="text-xs text-zinc-600">
                {inv.role} · Expires {formatExpiry(inv.expiresAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => revoke(inv.id)}
              className="text-xs text-zinc-600 transition-colors hover:text-red-400"
            >
              Revoke
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
