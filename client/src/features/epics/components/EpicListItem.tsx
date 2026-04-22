import type { Epic } from "../../../lib/types";
import { useDeleteEpic } from "../api";

type Props = { epic: Epic; projectId: string };

export function EpicListItem({ epic, projectId }: Props) {
  const { mutate: deleteEpic } = useDeleteEpic(projectId);
  const pct = epic.taskCount > 0 ? Math.round((epic.doneCount / epic.taskCount) * 100) : 0;

  return (
    <div className="rounded-xl border border-white/5 bg-zinc-800/40 px-5 py-4 transition-colors hover:bg-zinc-800/60">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-100">{epic.title}</p>
          {epic.description && (
            <p className="mt-0.5 text-xs text-zinc-600">{epic.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span>{epic.doneCount}/{epic.taskCount} tasks</span>
          <button
            type="button"
            onClick={() => deleteEpic(epic.id)}
            aria-label={`Delete epic ${epic.title}`}
            className="rounded p-1 text-zinc-600 transition-colors hover:text-red-400"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </button>
        </div>
      </div>

      {epic.taskCount > 0 && (
        <div className="mt-3">
          <progress
            value={pct}
            max={100}
            aria-label={`${epic.title} progress`}
            className="h-1.5 w-full rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-zinc-800 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-teal-400 [&::-webkit-progress-value]:transition-all [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-teal-400"
          />
          <p className="mt-1 text-[10px] text-zinc-600">{pct}% complete</p>
        </div>
      )}
    </div>
  );
}
