import { useState } from "react";
import { StatusBadge, PriorityBadge } from "../../../components/ui/Badge";
import { EpicBadge } from "../../epics/components/EpicBadge";
import { TaskDetailModal } from "./TaskDetailModal";
import type { Task } from "../../../lib/types";

type Props = { task: Task; projectId: string };

function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/20 text-[10px] font-bold text-teal-300"
      title={name}
    >
      {initials}
    </div>
  );
}

export function TaskRow({ task, projectId }: Props) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <tr
        className="group cursor-pointer border-b border-white/5 transition-colors hover:bg-white/[0.03]"
        onClick={() => setShowDetail(true)}
      >
        <td className="px-6 py-3.5">
          <span className="font-medium text-zinc-200">{task.title}</span>
          {task.epic && (
            <span className="ml-2">
              <EpicBadge title={task.epic.title} />
            </span>
          )}
        </td>
        <td className="px-4 py-3.5">
          <StatusBadge status={task.status} />
        </td>
        <td className="px-4 py-3.5">
          <PriorityBadge priority={task.priority} />
        </td>
        <td className="px-4 py-3.5">
          {task.assignee ? (
            <AvatarInitials name={task.assignee.name} />
          ) : (
            <div className="h-6 w-6 rounded-full border border-dashed border-zinc-700" />
          )}
        </td>
        <td className="hidden px-4 py-3.5 text-xs text-zinc-600 lg:table-cell">
          {task.dueDate
            ? new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
            : "—"}
        </td>
      </tr>

      <TaskDetailModal
        task={task}
        projectId={projectId}
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
      />
    </>
  );
}
