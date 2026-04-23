import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { X, Calendar, Flag, User, Tag, CheckCircle2 } from "lucide-react";
import { useTask, useUpdateTask } from "../api";
import { TaskDetailComments } from "./TaskDetailComments";
import type { Task, TaskStatus, Priority, WorkspaceMember, Epic } from "../../../lib/types";
import type { UpdateTaskInput } from "../schemas";

const STATUS_OPTIONS: { value: TaskStatus; label: string; dot: string }[] = [
  { value: "BACKLOG",     label: "Backlog",     dot: "bg-zinc-500"   },
  { value: "TODO",        label: "To Do",       dot: "bg-violet-400" },
  { value: "IN_PROGRESS", label: "In Progress", dot: "bg-amber-400"  },
  { value: "IN_REVIEW",   label: "In Review",   dot: "bg-pink-400"   },
  { value: "DONE",        label: "Done",        dot: "bg-emerald-400"},
];

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: "LOW",    label: "Low",    color: "text-zinc-500"  },
  { value: "MEDIUM", label: "Medium", color: "text-sky-400"   },
  { value: "HIGH",   label: "High",   color: "text-amber-400" },
  { value: "URGENT", label: "Urgent", color: "text-red-400"   },
];

function FieldRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex w-28 shrink-0 items-center gap-2 text-xs text-zinc-600">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

type Props = {
  taskId: string | null;
  projectId: string;
  onClose: () => void;
  members?: WorkspaceMember[];
  epics?: Epic[];
};

export function TaskDetailDrawer({ taskId, projectId, onClose, members, epics }: Props) {
  const { data: task, isPending } = useTask(taskId ?? "");
  const { mutate: updateTask } = useUpdateTask(projectId);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  // Sync drafts when task loads
  useEffect(() => {
    if (task) {
      setTitleDraft(task.title);
      setDescDraft(task.description ?? "");
    }
  }, [task]);

  useEffect(() => {
    if (editingTitle) titleRef.current?.select();
  }, [editingTitle]);

  useEffect(() => {
    if (editingDesc) descRef.current?.focus();
  }, [editingDesc]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function patch(data: UpdateTaskInput) {
    if (!task) return;
    updateTask({ taskId: task.id, ...data });
  }

  function saveTitle() {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== task?.title) patch({ title: trimmed });
    setEditingTitle(false);
  }

  function saveDesc() {
    const trimmed = descDraft.trim() || null;
    if (trimmed !== (task?.description ?? null)) patch({ description: trimmed ?? undefined });
    setEditingDesc(false);
  }

  const isOpen = !!taskId;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={[
          "fixed right-0 top-0 z-50 flex h-full w-[520px] max-w-[95vw] flex-col border-l border-white/8 bg-[#0c1210] shadow-2xl shadow-black/60 transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        aria-label="Task detail"
      >
        {!taskId ? null : isPending ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : task ? (
          <DrawerContent
            task={task}
            onClose={onClose}
            editingTitle={editingTitle}
            titleDraft={titleDraft}
            titleRef={titleRef}
            setEditingTitle={setEditingTitle}
            setTitleDraft={setTitleDraft}
            saveTitle={saveTitle}
            editingDesc={editingDesc}
            descDraft={descDraft}
            descRef={descRef}
            setEditingDesc={setEditingDesc}
            setDescDraft={setDescDraft}
            saveDesc={saveDesc}
            patch={patch}
            members={members}
            epics={epics}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-600">
            Task not found.
          </div>
        )}
      </aside>
    </>
  );
}

type ContentProps = {
  task: Task;
  onClose: () => void;
  editingTitle: boolean;
  titleDraft: string;
  titleRef: RefObject<HTMLInputElement>;
  setEditingTitle: (v: boolean) => void;
  setTitleDraft: (v: string) => void;
  saveTitle: () => void;
  editingDesc: boolean;
  descDraft: string;
  descRef: RefObject<HTMLTextAreaElement>;
  setEditingDesc: (v: boolean) => void;
  setDescDraft: (v: string) => void;
  saveDesc: () => void;
  patch: (data: UpdateTaskInput) => void;
  members?: WorkspaceMember[];
  epics?: Epic[];
};

function DrawerContent({
  task,
  onClose,
  editingTitle,
  titleDraft,
  titleRef,
  setEditingTitle,
  setTitleDraft,
  saveTitle,
  editingDesc,
  descDraft,
  descRef,
  setEditingDesc,
  setDescDraft,
  saveDesc,
  patch,
  members,
  epics,
}: ContentProps) {
  const status = STATUS_OPTIONS.find((s) => s.value === task.status)!;
  const priority = PRIORITY_OPTIONS.find((p) => p.value === task.priority)!;

  return (
    <>
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span className="font-mono text-[10px] text-zinc-600">
            {task.createdAt.slice(0, 10)}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          title="Close"
          aria-label="Close task detail"
          className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-white/5 hover:text-zinc-300"
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-4">
        {/* Title */}
        {editingTitle ? (
          <input
            ref={titleRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveTitle();
              if (e.key === "Escape") setEditingTitle(false);
            }}
            aria-label="Task title"
            className="w-full rounded-lg border border-emerald-500/30 bg-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-100 focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            className="text-left text-base font-semibold leading-snug text-zinc-100 transition-colors hover:text-white"
          >
            {task.title}
          </button>
        )}

        {/* Field rows */}
        <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-zinc-900/40 p-4">
          {/* Status */}
          <FieldRow icon={<div className={`h-2 w-2 rounded-full ${status.dot}`} />} label="Status">
            <select
              value={task.status}
              onChange={(e) => patch({ status: e.target.value as TaskStatus })}
              aria-label="Status"
              className="rounded-md border border-white/8 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:outline-none"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </FieldRow>

          {/* Priority */}
          <FieldRow icon={<Flag size={12} />} label="Priority">
            <select
              value={task.priority}
              onChange={(e) => patch({ priority: e.target.value as Priority })}
              aria-label="Priority"
              className={`rounded-md border border-white/8 bg-zinc-800 px-2 py-1 text-xs font-medium focus:outline-none ${priority.color}`}
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </FieldRow>

          {/* Assignee */}
          <FieldRow icon={<User size={12} />} label="Assignee">
            <select
              value={task.assigneeId ?? ""}
              onChange={(e) => patch({ assigneeId: e.target.value || null })}
              aria-label="Assignee"
              className="rounded-md border border-white/8 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="">Unassigned</option>
              {members?.map((m) => (
                <option key={m.userId} value={m.userId}>{m.user.name}</option>
              ))}
            </select>
          </FieldRow>

          {/* Due date */}
          <FieldRow icon={<Calendar size={12} />} label="Due date">
            <input
              type="date"
              aria-label="Due date"
              value={task.dueDate ? task.dueDate.slice(0, 10) : ""}
              onChange={(e) =>
                patch({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })
              }
              className="rounded-md border border-white/8 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:outline-none"
            />
          </FieldRow>

          {/* Epic */}
          {epics && epics.length > 0 && (
            <FieldRow icon={<Tag size={12} />} label="Epic">
              <select
                value={task.epicId ?? ""}
                onChange={(e) => patch({ epicId: e.target.value || null })}
                aria-label="Epic"
                className="rounded-md border border-white/8 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="">No epic</option>
                {epics.map((ep) => (
                  <option key={ep.id} value={ep.id}>{ep.title}</option>
                ))}
              </select>
            </FieldRow>
          )}
        </div>

        {/* Description */}
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600">Description</p>
          {editingDesc ? (
            <textarea
              ref={descRef}
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              onBlur={saveDesc}
              rows={5}
              aria-label="Task description"
              placeholder="Add a description…"
              className="w-full resize-none rounded-lg border border-emerald-500/30 bg-zinc-800/60 px-3 py-2 text-xs leading-relaxed text-zinc-300 placeholder-zinc-700 focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingDesc(true)}
              className="block min-h-10 w-full rounded-lg border border-white/5 px-3 py-2 text-left text-xs leading-relaxed text-zinc-500 transition-colors hover:border-white/10 hover:text-zinc-400"
            >
              {task.description ?? "Click to add a description…"}
            </button>
          )}
        </div>

        {/* Comments */}
        <div className="border-t border-white/5 pt-4">
          <TaskDetailComments taskId={task.id} />
        </div>
      </div>
    </>
  );
}
