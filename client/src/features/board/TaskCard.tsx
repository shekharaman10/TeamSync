import type { Task, Priority } from "./mockData";

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  low:    { label: "Low",    color: "text-zinc-400",  dot: "bg-zinc-400" },
  medium: { label: "Medium", color: "text-sky-400",   dot: "bg-sky-400" },
  high:   { label: "High",   color: "text-amber-400", dot: "bg-amber-400" },
  urgent: { label: "Urgent", color: "text-red-400",   dot: "bg-red-400" },
};

const TAG_COLORS: Record<string, string> = {
  Auth:     "bg-violet-500/15 text-violet-300",
  Backend:  "bg-sky-500/15 text-sky-300",
  Frontend: "bg-teal-500/15 text-teal-300",
  DevOps:   "bg-orange-500/15 text-orange-300",
  Design:   "bg-pink-500/15 text-pink-300",
  Docs:     "bg-zinc-500/15 text-zinc-400",
  Billing:  "bg-emerald-500/15 text-emerald-300",
  DB:       "bg-amber-500/15 text-amber-300",
  QA:       "bg-rose-500/15 text-rose-300",
};
const DEFAULT_TAG = "bg-zinc-500/15 text-zinc-400";

type Props = { task: Task };

export function TaskCard({ task }: Props) {
  const { label, color, dot } = PRIORITY_CONFIG[task.priority];

  return (
    <div className="cursor-pointer rounded-xl border border-white/5 bg-zinc-800/60 p-4 transition-colors hover:border-white/10 hover:bg-zinc-800">
      <p className="text-sm font-medium leading-snug text-zinc-100">{task.title}</p>

      {task.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TAG_COLORS[tag] ?? DEFAULT_TAG}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className={`flex items-center gap-1.5 text-xs font-medium ${color}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          {label}
        </div>
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/20 text-[10px] font-bold text-teal-300"
          title={task.assignee}
        >
          {task.assignee}
        </div>
      </div>
    </div>
  );
}
