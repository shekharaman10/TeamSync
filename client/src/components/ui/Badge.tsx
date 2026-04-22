import type { TaskStatus, Priority, Role } from "../../lib/types";

const STATUS_MAP: Record<TaskStatus, { label: string; cls: string }> = {
  BACKLOG:     { label: "Backlog",     cls: "bg-zinc-700/60 text-zinc-400" },
  TODO:        { label: "To Do",       cls: "bg-zinc-700/60 text-zinc-400" },
  IN_PROGRESS: { label: "In Progress", cls: "bg-sky-500/15 text-sky-300" },
  IN_REVIEW:   { label: "In Review",   cls: "bg-amber-500/15 text-amber-300" },
  DONE:        { label: "Done",        cls: "bg-emerald-500/15 text-emerald-300" },
};

const PRIORITY_MAP: Record<Priority, { label: string; dot: string; text: string }> = {
  LOW:    { label: "Low",    dot: "bg-zinc-400",  text: "text-zinc-400" },
  MEDIUM: { label: "Medium", dot: "bg-sky-400",   text: "text-sky-400" },
  HIGH:   { label: "High",   dot: "bg-amber-400", text: "text-amber-400" },
  URGENT: { label: "Urgent", dot: "bg-red-400",   text: "text-red-400" },
};

const ROLE_MAP: Record<Role, string> = {
  OWNER:  "bg-teal-500/15 text-teal-300 ring-1 ring-teal-500/30",
  ADMIN:  "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
  MEMBER: "bg-zinc-700/60 text-zinc-400",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const { label, cls } = STATUS_MAP[status];
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}
      aria-label={`Status: ${label}`}
    >
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { label, dot, text } = PRIORITY_MAP[priority];
  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${text}`} aria-label={`Priority: ${label}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </div>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${ROLE_MAP[role]}`}>
      {role}
    </span>
  );
}
