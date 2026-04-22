import { useEffect } from "react";
import { Outlet, NavLink, useParams, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { useProject } from "./api";

export function ProjectDetailShell() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const navigate = useNavigate();
  const { data, isError, error, isPending } = useProject(projectId!);

  useEffect(() => {
    if (!isError) return;
    const status = isAxiosError(error) ? (error.response?.status ?? 0) : 0;
    if (status === 403 || status === 404) {
      navigate(`/app/workspaces/${workspaceId}/projects`, { replace: true });
    }
  }, [isError, error, workspaceId, navigate]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Project header */}
      <div className="shrink-0 border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          {data && (
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-400/10 font-mono text-xs font-bold text-teal-300">
              {data.key}
            </div>
          )}
          <h1 className="text-base font-semibold text-white">
            {isPending ? "Loading…" : (data?.name ?? "Project")}
          </h1>
        </div>
        {/* Sub-nav tabs */}
        <div className="mt-3 flex gap-1">
          <NavLink
            to="epics"
            className={({ isActive }) =>
              `rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-teal-400/10 text-teal-400"
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
              }`
            }
          >
            Epics
          </NavLink>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
