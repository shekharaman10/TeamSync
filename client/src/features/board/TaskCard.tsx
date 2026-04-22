import { PriorityBadge } from "../../components/ui/Badge";
import { EpicBadge } from "../epics/components/EpicBadge";
import type { Task } from "../../lib/types";

type Props = { task: Task };

export function TaskCard({ task }: Props) {
  const initials = task.assignee?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="cursor-pointer rounded-xl border border-white/5 bg-zinc-800/60 p-4 transition-colors hover:border-white/10 hover:bg-zinc-800">
      <p className="text-sm font-medium leading-snug text-zinc-100">{task.title}</p>

      {task.epic && (
        <div className="mt-2.5">
          <EpicBadge title={task.epic.title} />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <PriorityBadge priority={task.priority} />
        {task.assignee ? (
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/20 text-[10px] font-bold text-teal-300"
            title={task.assignee.name}
          >
            {initials}
          </div>
        ) : (
          <div className="h-6 w-6 rounded-full border border-dashed border-zinc-700" title="Unassigned" />
        )}
      </div>
    </div>
  );
}
