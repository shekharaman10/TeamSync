import { Navigate } from "react-router-dom";
import { useWorkspaceStore } from "../features/workspaces/store";
import { useWorkspaces } from "../features/workspaces/api";

export function AppRedirect() {
  const { lastWorkspaceId } = useWorkspaceStore();
  const { data: workspaces, isPending } = useWorkspaces();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950" role="status" aria-label="Loading">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-teal-400" />
      </div>
    );
  }

  // Try last workspace first (if it's still in the user's workspace list)
  if (lastWorkspaceId && workspaces?.some((w) => w.id === lastWorkspaceId)) {
    return <Navigate to={`/app/workspaces/${lastWorkspaceId}/board`} replace />;
  }

  // Fall back to first workspace
  if (workspaces && workspaces.length > 0) {
    return <Navigate to={`/app/workspaces/${workspaces[0].id}/board`} replace />;
  }

  // No workspaces — send to selection page
  return <Navigate to="/app/workspaces" replace />;
}
