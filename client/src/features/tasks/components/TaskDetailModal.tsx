import { Modal } from "../../../components/ui/Modal";
import { StatusBadge, PriorityBadge } from "../../../components/ui/Badge";
import { EpicBadge } from "../../epics/components/EpicBadge";
import { useDeleteTask } from "../api";
import type { Task } from "../../../lib/types";

type Props = {
  task: Task;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
};

export function TaskDetailModal({ task, projectId, isOpen, onClose }: Props) {
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask(projectId);

  function handleDelete() {
    deleteTask(task.id, { onSuccess: onClose });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task.title} maxWidth="max-w-lg">
      <div className="space-y-4">
        {task.description && (
          <p className="text-sm leading-relaxed text-zinc-400">{task.description}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          {task.epic && <EpicBadge title={task.epic.title} />}
        </div>

        <dl className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-zinc-500">Assignee</dt>
            <dd className="mt-0.5 font-medium text-zinc-300">
              {task.assignee?.name ?? "Unassigned"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Due date</dt>
            <dd className="mt-0.5 font-medium text-zinc-300">
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "None"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Created by</dt>
            <dd className="mt-0.5 font-medium text-zinc-300">{task.createdBy.name}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Created</dt>
            <dd className="mt-0.5 font-medium text-zinc-300">
              {new Date(task.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </dd>
          </div>
        </dl>

        <div className="flex justify-end border-t border-white/5 pt-4">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
          >
            {isDeleting ? "Deleting…" : "Delete task"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
