import { useEffect } from "react";
import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import { useAuthStore } from "../auth/useAuthStore";
import { useAcceptInvitation } from "./api";
import { useWorkspaceStore } from "../workspaces/store";
import { extractErrorMessage } from "../../lib/error";

export function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const status = useAuthStore((s) => s.status);
  const { setLastWorkspaceId } = useWorkspaceStore();
  const { mutate, isPending, isError, error, isSuccess } = useAcceptInvitation();

  // If not authenticated, redirect to login preserving the invite URL
  if (status === "unauthenticated") {
    return (
      <Navigate
        to={`/login?next=/invitations/accept/${token ?? ""}`}
        replace
      />
    );
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!token || status !== "authenticated") return;
    mutate(token, {
      onSuccess: (workspace) => {
        setLastWorkspaceId(workspace.id);
        navigate(`/app/workspaces/${workspace.id}/board`, { replace: true });
      },
    });
  // Accept fires once on mount when authenticated
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, status]);

  if (status === "idle" || status === "loading" || isPending) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-teal-400" />
        <p className="text-sm text-zinc-500">Processing invitation…</p>
      </div>
    );
  }

  if (isSuccess) return null;

  if (isError) {
    const message = extractErrorMessage(error);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
          <svg className="h-6 w-6 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <p className="text-sm font-medium text-zinc-300">Invitation failed</p>
        <p className="max-w-xs text-xs text-zinc-600">{message}</p>
        <Link
          to="/app"
          className="mt-2 rounded-lg bg-teal-400 px-4 py-2 text-xs font-semibold text-black hover:bg-teal-300"
        >
          Go to app
        </Link>
      </div>
    );
  }

  return null;
}
