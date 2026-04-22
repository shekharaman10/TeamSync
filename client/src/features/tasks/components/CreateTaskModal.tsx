import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "../../../components/ui/Modal";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { CreateTaskSchema } from "../schemas";
import { useCreateTask } from "../api";
import { extractErrorMessage } from "../../../lib/error";
import type { CreateTaskInput } from "../schemas";
import type { WorkspaceMember, Epic } from "../../../lib/types";

type Props = {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  members?: WorkspaceMember[];
  epics?: Epic[];
};

export function CreateTaskModal({ projectId, isOpen, onClose, members = [], epics = [] }: Props) {
  const { mutate, isPending } = useCreateTask(projectId);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(CreateTaskSchema),
    defaultValues: { status: "TODO", priority: "MEDIUM" },
  });

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  function onSubmit(data: CreateTaskInput) {
    mutate(data, {
      onSuccess: () => { reset(); onClose(); },
      onError: (err) => setError("root", { message: extractErrorMessage(err) }),
    });
  }

  const inputCls =
    "w-full rounded-lg border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-teal-500/40 focus:outline-none";
  const selectCls =
    "w-full rounded-lg border border-white/8 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-300 focus:outline-none";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create task" maxWidth="max-w-lg">
      {errors.root && <ErrorBanner message={errors.root.message ?? ""} className="mb-4" />}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400" htmlFor="task-title">
            Title
          </label>
          <input id="task-title" type="text" placeholder="Task title" {...register("title")} className={inputCls} />
          {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400" htmlFor="task-desc">
            Description <span className="text-zinc-600">(optional)</span>
          </label>
          <textarea
            id="task-desc"
            rows={3}
            {...register("description")}
            className="w-full resize-none rounded-lg border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-teal-500/40 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Status</label>
            <select {...register("status")} className={selectCls}>
              <option value="BACKLOG">Backlog</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Priority</label>
            <select {...register("priority")} className={selectCls}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        {members.length > 0 && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Assignee</label>
            <select {...register("assigneeId")} className={selectCls}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>{m.user.name}</option>
              ))}
            </select>
          </div>
        )}

        {epics.length > 0 && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Epic</label>
            <select {...register("epicId")} className={selectCls}>
              <option value="">No epic</option>
              {epics.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400" htmlFor="task-due">
            Due date <span className="text-zinc-600">(optional)</span>
          </label>
          <input id="task-due" type="date" {...register("dueDate")} className={inputCls} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-teal-400 px-4 py-2 text-xs font-semibold text-black hover:bg-teal-300 disabled:opacity-50"
          >
            {isPending ? "Creating…" : "Create task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
