import type { Task } from "../../lib/types";

type Props = { task: Task; onClick?: () => void };

// ── Epic palette (deterministic per epic ID) ──────────────────────────────────
const EPIC_PALETTES = [
  { bg: "bg-emerald-500/12", text: "text-emerald-300", border: "border-emerald-500/20" },
  { bg: "bg-blue-500/12",    text: "text-blue-300",    border: "border-blue-500/20"    },
  { bg: "bg-violet-500/12",  text: "text-violet-300",  border: "border-violet-500/20"  },
  { bg: "bg-amber-500/12",   text: "text-amber-300",   border: "border-amber-500/20"   },
  { bg: "bg-pink-500/12",    text: "text-pink-300",    border: "border-pink-500/20"    },
  { bg: "bg-cyan-500/12",    text: "text-cyan-300",    border: "border-cyan-500/20"    },
  { bg: "bg-orange-500/12",  text: "text-orange-300",  border: "border-orange-500/20"  },
  { bg: "bg-teal-500/12",    text: "text-teal-300",    border: "border-teal-500/20"    },
];

function epicPalette(epicId: string) {
  let h = 0;
  for (let i = 0; i < epicId.length; i++) h = (h * 31 + epicId.charCodeAt(i)) & 0x7fffffff;
  return EPIC_PALETTES[h % EPIC_PALETTES.length];
}

// ── Priority config ───────────────────────────────────────────────────────────
const PRIORITY_CONFIG: Record<string, { dot: string; label: string }> = {
  LOW:    { dot: "bg-zinc-500",  label: "Low"    },
  MEDIUM: { dot: "bg-sky-500",   label: "Medium" },
  HIGH:   { dot: "bg-amber-500", label: "High"   },
  URGENT: { dot: "bg-red-500",   label: "Urgent" },
};

function formatDue(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function isOverdue(iso: string): boolean {
  return new Date(iso) < new Date();
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── Vivid avatar colors (deterministic per user ID) ───────────────────────────
const AVATAR_COLORS = [
  "bg-emerald-500", "bg-blue-500",   "bg-orange-500",
  "bg-violet-500",  "bg-rose-500",   "bg-cyan-500",
  "bg-amber-500",   "bg-pink-500",   "bg-teal-500",
  "bg-indigo-500",
];

export function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0x7fffffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// ── TaskCard ──────────────────────────────────────────────────────────────────
export function TaskCard({ task, onClick }: Props) {
  const displayId = `${task.project.key}-${task.id.slice(-4).toUpperCase()}`;
  const overdue   = task.dueDate && isOverdue(task.dueDate) && task.status !== "DONE";
  const pConfig   = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.MEDIUM;

  return (
    <div className="group relative cursor-default rounded-xl border border-white/[0.07] bg-[#1a211d] p-3.5 transition-all duration-200 hover:border-white/[0.13] hover:bg-[#1e2721] hover:shadow-xl hover:shadow-black/40 active:scale-[0.99]">

      {/* Epic badge */}
      {task.epic && (() => {
        const p = epicPalette(task.epic.id);
        return (
          <div className="mb-2.5">
            <span
              className={`inline-flex max-w-full items-center gap-1 truncate rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${p.bg} ${p.text} ${p.border}`}
            >
              {task.epic.title}
            </span>
          </div>
        );
      })()}

      {/* Title */}
      <p className="mb-3.5 text-[13px] font-medium leading-snug text-zinc-100 group-hover:text-white">
        {task.title}
      </p>

      {/* Bottom row */}
      <div className="flex items-center justify-between gap-2">

        {/* Left: task ID + due + comments */}
        <div className="flex min-w-0 items-center gap-2">
          {/* Priority dot */}
          <span
            title={pConfig.label}
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${pConfig.dot}`}
          />

          {/* Bookmark icon + task ID */}
          <div className="flex items-center gap-1 text-zinc-600">
            <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span className="font-mono text-[10px]">{displayId}</span>
          </div>

          {/* Due date */}
          {task.dueDate && (
            <span className={`flex items-center gap-0.5 text-[10px] ${overdue ? "text-red-400" : "text-zinc-700"}`}>
              <svg className="h-2.5 w-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              {formatDue(task.dueDate)}
            </span>
          )}

          {/* Comment count */}
          {task._count.comments > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-zinc-700">
              <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {task._count.comments}
            </span>
          )}
        </div>

        {/* Right: expand + assignee */}
        <div className="flex shrink-0 items-center gap-1.5">
          {onClick && (
            <button
              type="button"
              title="Open task detail"
              aria-label="Open task detail"
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className="flex h-5 w-5 items-center justify-center rounded text-zinc-700 opacity-0 transition-all hover:text-emerald-400 group-hover:opacity-100"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            </button>
          )}

          {task.assignee ? (
            <div
              title={task.assignee.name}
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white ring-1 ring-black/50 ${avatarColor(task.assignee.id)}`}
            >
              {initials(task.assignee.name)}
            </div>
          ) : (
            <div
              title="Unassigned"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-zinc-700"
            >
              <svg className="h-3 w-3 text-zinc-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
