import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "../../components/ui/Modal";
import { useAuthStore } from "../auth/useAuthStore";
import { getInitials, COLUMNS } from "./mockData";
import type { Task, Status, Priority } from "./mockData";

type FormValues = {
  title: string;
  status: Status;
  priority: Priority;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  defaultStatus: Status;
  onAdd: (task: Task) => void;
};

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low",    label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high",   label: "High" },
  { value: "urgent", label: "Urgent" },
];

const selectClass =
  "w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-500/40 focus:outline-none";

export function CreateTaskModal({ isOpen, onClose, defaultStatus, onAdd }: Props) {
  const { user } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { title: "", status: defaultStatus, priority: "medium" },
  });

  useEffect(() => {
    if (!isOpen) {
      reset({ title: "", status: defaultStatus, priority: "medium" });
    }
  }, [isOpen, defaultStatus, reset]);

  function onSubmit(data: FormValues) {
    const assignee = user ? getInitials(user.name) : "?";
    const task: Task = {
      id: crypto.randomUUID(),
      title: data.title.trim(),
      status: data.status,
      priority: data.priority,
      tags: [],
      assignee,
    };
    onAdd(task);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New task">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400" htmlFor="task-title">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            id="task-title"
            type="text"
            autoFocus
            placeholder="What needs to be done?"
            {...register("title", { required: "Title is required" })}
            className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-teal-500/40 focus:outline-none"
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400" htmlFor="task-status">
            Status
          </label>
          <select id="task-status" {...register("status")} className={selectClass}>
            {COLUMNS.map((col) => (
              <option key={col.id} value={col.id}>
                {col.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400" htmlFor="task-priority">
            Priority
          </label>
          <select id="task-priority" {...register("priority")} className={selectClass}>
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-teal-400 px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-teal-300"
          >
            Create task
          </button>
        </div>
      </form>
    </Modal>
  );
}
