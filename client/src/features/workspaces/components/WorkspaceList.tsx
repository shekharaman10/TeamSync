import { useNavigate } from "react-router-dom";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { useWorkspaces } from "../api";
import { useWorkspaceStore } from "../store";
import type { Workspace } from "../../../lib/types";

function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  const navigate = useNavigate();
  const { setLastWorkspaceId } = useWorkspaceStore();
  const initials = workspace.name.slice(0, 2).toUpperCase();

  function handleClick() {
    setLastWorkspaceId(workspace.id);
    navigate(`/app/workspaces/${workspace.id}/board`);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center gap-4 rounded-xl border border-white/5 bg-zinc-800/40 px-5 py-4 text-left transition-colors hover:border-white/10 hover:bg-zinc-800/60"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-400 text-sm font-black text-black">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-100">{workspace.name}</p>
        <p className="text-xs text-zinc-600">{workspace.slug}</p>
      </div>
      {workspace.memberCount !== undefined && (
        <span className="shrink-0 text-xs text-zinc-600">
          {workspace.memberCount} {workspace.memberCount === 1 ? "member" : "members"}
        </span>
      )}
    </button>
  );
}

type Props = { onCreateClick: () => void };

export function WorkspaceList({ onCreateClick }: Props) {
  const { data, isPending, isError, refetch } = useWorkspaces();

  if (isPending) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorBanner
        message="Failed to load workspaces."
        onRetry={() => void refetch()}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800">
          <svg className="h-7 w-7 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <p className="text-sm font-medium text-zinc-300">No workspaces yet</p>
        <p className="mt-1 text-xs text-zinc-600">Create one to get started</p>
        <button
          type="button"
          onClick={onCreateClick}
          className="mt-5 rounded-lg bg-teal-400 px-5 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-teal-300"
        >
          Create workspace
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((ws) => (
        <WorkspaceCard key={ws.id} workspace={ws} />
      ))}
    </div>
  );
}
