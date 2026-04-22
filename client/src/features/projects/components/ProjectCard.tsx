import { useNavigate, useParams } from "react-router-dom";
import type { Project } from "../../../lib/types";

type Props = { project: Project };

export function ProjectCard({ project }: Props) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/app/workspaces/${workspaceId}/projects/${project.id}/epics`)}
      className="flex w-full items-start gap-4 rounded-xl border border-white/5 bg-zinc-800/40 px-5 py-4 text-left transition-colors hover:border-white/10 hover:bg-zinc-800/60"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-400/10 font-mono text-xs font-bold text-teal-300">
        {project.key}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-100">{project.name}</p>
        {project.description && (
          <p className="mt-0.5 truncate text-xs text-zinc-600">{project.description}</p>
        )}
      </div>
      {project.taskCount !== undefined && (
        <span className="shrink-0 text-xs text-zinc-600">
          {project.taskCount} {project.taskCount === 1 ? "task" : "tasks"}
        </span>
      )}
    </button>
  );
}
