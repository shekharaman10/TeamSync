import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { ChevronUp, ChevronDown, Minus } from "lucide-react";
import { useInfiniteTasks } from "../tasks/api";
import { useWorkspaceMembers } from "../workspaces/api";
import { useEpics } from "../epics/api";
import { useTaskFilters } from "../tasks/hooks/useTaskFilters";
import { CreateTaskModal } from "../tasks/components/CreateTaskModal";
import { ProjectSelector, useSelectedProjectId } from "../projects/components/ProjectSelector";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import type { Task, TaskStatus, Priority } from "../../lib/types";

type SortKey = "title" | "status" | "priority" | "assignee" | "dueDate";
type SortDir = "asc" | "desc";

const STATUS_STYLES: Record<TaskStatus, { dot: string; label: string }> = {
  BACKLOG:     { dot: "bg-zinc-500",   label: "Backlog"     },
  TODO:        { dot: "bg-violet-400", label: "To Do"       },
  IN_PROGRESS: { dot: "bg-amber-400",  label: "In Progress" },
  IN_REVIEW:   { dot: "bg-pink-400",   label: "In Review"   },
  DONE:        { dot: "bg-emerald-400", label: "Done"       },
};

const PRIORITY_STYLES: Record<Priority, { color: string; label: string }> = {
  LOW:    { color: "text-zinc-500",   label: "Low"    },
  MEDIUM: { color: "text-sky-400",    label: "Medium" },
  HIGH:   { color: "text-amber-400",  label: "High"   },
  URGENT: { color: "text-red-400",    label: "Urgent" },
};

const PRIORITY_ORDER: Record<Priority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const STATUS_ORDER:   Record<TaskStatus, number> = { TODO: 0, IN_PROGRESS: 1, IN_REVIEW: 2, BACKLOG: 3, DONE: 4 };

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <Minus size={11} className="text-zinc-700" />;
  return dir === "asc"
    ? <ChevronUp size={11} className="text-emerald-400" />
    : <ChevronDown size={11} className="text-emerald-400" />;
}

function ColHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
  className = "",
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={`whitespace-nowrap px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-600 ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 transition-colors hover:text-zinc-300"
      >
        {label}
        <SortIcon active={current === sortKey} dir={dir} />
      </button>
    </th>
  );
}

export function ListPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const projectId = useSelectedProjectId(workspaceId!);
  const { filters } = useTaskFilters();
  const [showCreate, setShowCreate] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const { data, isPending, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteTasks(projectId ?? "", filters);
  const { data: members } = useWorkspaceMembers(workspaceId!);
  const { data: epics } = useEpics(projectId ?? "");

  const tasks = useMemo(
    () => data?.pages.flatMap((p) => p.tasks) ?? [],
    [data],
  );

  const sorted = useMemo(() => {
    return [...tasks].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "title")    cmp = a.title.localeCompare(b.title);
      if (sortKey === "status")   cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (sortKey === "priority") cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (sortKey === "assignee") cmp = (a.assignee?.name ?? "").localeCompare(b.assignee?.name ?? "");
      if (sortKey === "dueDate")  cmp = (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [tasks, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-base font-semibold text-white">List</h1>
            {!isPending && (
              <p className="text-xs text-zinc-500">{tasks.length} tasks</p>
            )}
          </div>
          <ProjectSelector workspaceId={workspaceId!} />
        </div>
        {projectId && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-emerald-400"
          >
            + New task
          </button>
        )}
      </div>

      {/* Table */}
      {!projectId ? (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState title="No project selected" description="Select a project to view tasks." />
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {isPending && (
            <div className="space-y-px pt-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="mx-4 h-11 rounded-lg" />
              ))}
            </div>
          )}

          {isError && (
            <div className="px-6 pt-6 text-sm text-red-400">Failed to load tasks.</div>
          )}

          {!isPending && !isError && (
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 border-b border-white/5 bg-[#0b0f0c]">
                <tr>
                  <ColHeader label="Status"   sortKey="status"   current={sortKey} dir={sortDir} onSort={handleSort} className="w-36" />
                  <ColHeader label="Title"    sortKey="title"    current={sortKey} dir={sortDir} onSort={handleSort} />
                  <ColHeader label="Assignee" sortKey="assignee" current={sortKey} dir={sortDir} onSort={handleSort} className="w-36" />
                  <ColHeader label="Priority" sortKey="priority" current={sortKey} dir={sortDir} onSort={handleSort} className="w-28" />
                  <ColHeader label="Due"      sortKey="dueDate"  current={sortKey} dir={sortDir} onSort={handleSort} className="w-28" />
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-sm text-zinc-600">
                      No tasks yet — create one to get started.
                    </td>
                  </tr>
                )}
                {sorted.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </tbody>
            </table>
          )}

          {hasNextPage && (
            <div className="px-6 py-4">
              <button
                type="button"
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-xs text-zinc-500 transition-colors hover:text-zinc-300 disabled:opacity-50"
              >
                {isFetchingNextPage ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}

      <CreateTaskModal
        projectId={projectId ?? ""}
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        members={members}
        epics={epics}
      />
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const status  = STATUS_STYLES[task.status];
  const priority = PRIORITY_STYLES[task.priority];
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "DONE";

  const initials = task.assignee?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <tr className="group border-b border-white/4 transition-colors hover:bg-emerald-500/4">
      {/* Status */}
      <td className="px-4 py-3">
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${status.dot}`} />
          <span className="text-xs text-zinc-400">{status.label}</span>
        </span>
      </td>

      {/* Title */}
      <td className="px-4 py-3">
        <span
          className={[
            "block max-w-md truncate text-sm font-medium",
            task.status === "DONE" ? "text-zinc-500 line-through" : "text-zinc-100",
          ].join(" ")}
        >
          {task.title}
        </span>
        {task.epic && (
          <span className="mt-0.5 block text-[10px] text-zinc-600">{task.epic.title}</span>
        )}
      </td>

      {/* Assignee */}
      <td className="px-4 py-3">
        {task.assignee ? (
          <span className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[9px] font-bold text-emerald-300">
              {initials}
            </span>
            <span className="truncate text-xs text-zinc-400">{task.assignee.name}</span>
          </span>
        ) : (
          <span className="text-xs text-zinc-700">Unassigned</span>
        )}
      </td>

      {/* Priority */}
      <td className="px-4 py-3">
        <span className={`text-xs font-medium ${priority.color}`}>{priority.label}</span>
      </td>

      {/* Due date */}
      <td className="px-4 py-3">
        <span className={`text-xs ${isOverdue ? "text-red-400" : "text-zinc-500"}`}>
          {formatDate(task.dueDate)}
        </span>
      </td>
    </tr>
  );
}
