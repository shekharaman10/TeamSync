import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, UserX } from "lucide-react";
import { useInfiniteTasks } from "../tasks/api";
import { useWorkspaceMembers } from "../workspaces/api";
import { useEpics } from "../epics/api";
import { useTaskFilters } from "../tasks/hooks/useTaskFilters";
import { FilterBar } from "../tasks/components/FilterBar";
import { TaskTable } from "../tasks/components/TaskTable";
import { CreateTaskModal } from "../tasks/components/CreateTaskModal";
import { ProjectSelector, useSelectedProjectId } from "../projects/components/ProjectSelector";
import { EmptyState } from "../../components/ui/EmptyState";
import type { Priority, TaskStatus } from "../../lib/types";

const PRIORITY_CHIPS: { id: Priority; label: string; dotCls: string; chipCls: string }[] = [
  { id: "URGENT", label: "Urgent", dotCls: "bg-red-400",   chipCls: "border-red-400/20 bg-red-400/8 text-red-300"       },
  { id: "HIGH",   label: "High",   dotCls: "bg-amber-400", chipCls: "border-amber-400/20 bg-amber-400/8 text-amber-300" },
  { id: "MEDIUM", label: "Medium", dotCls: "bg-sky-400",   chipCls: "border-sky-400/20 bg-sky-400/8 text-sky-300"       },
  { id: "LOW",    label: "Low",    dotCls: "bg-zinc-500",  chipCls: "border-zinc-600/30 bg-zinc-700/30 text-zinc-400"   },
];

const STATUS_CHIPS: { id: TaskStatus; label: string; chipCls: string }[] = [
  { id: "TODO",        label: "To Do",       chipCls: "border-violet-400/20 bg-violet-400/8 text-violet-300"   },
  { id: "IN_PROGRESS", label: "In Progress", chipCls: "border-amber-400/20 bg-amber-400/8 text-amber-300"     },
  { id: "IN_REVIEW",   label: "In Review",   chipCls: "border-pink-400/20 bg-pink-400/8 text-pink-300"        },
  { id: "DONE",        label: "Done",        chipCls: "border-emerald-400/20 bg-emerald-400/8 text-emerald-300" },
  { id: "BACKLOG",     label: "Backlog",     chipCls: "border-zinc-600/30 bg-zinc-700/30 text-zinc-400"       },
];

export function BacklogPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const projectId = useSelectedProjectId(workspaceId!);
  const { filters, setFilter, clearFilters, hasActiveFilters } = useTaskFilters();
  const [showCreate, setShowCreate] = useState(false);

  const {
    data,
    isPending,
    isError,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteTasks(projectId ?? "", filters);

  const { data: members } = useWorkspaceMembers(workspaceId!);
  const { data: epics } = useEpics(projectId ?? "");

  const { tasks, insights } = useMemo(() => {
    const allTasks = data?.pages.flatMap((p) => p.tasks) ?? [];
    if (!allTasks.length) return { tasks: allTasks, insights: null };

    const now = Date.now();
    return {
      tasks: allTasks,
      insights: {
        overdue: allTasks.filter(
          (t) => t.dueDate && new Date(t.dueDate).getTime() < now && t.status !== "DONE"
        ).length,
        unassigned: allTasks.filter((t) => !t.assigneeId).length,
        byPriority: Object.fromEntries(
          PRIORITY_CHIPS.map(({ id }) => [id, allTasks.filter((t) => t.priority === id).length])
        ) as Record<Priority, number>,
        byStatus: Object.fromEntries(
          STATUS_CHIPS.map(({ id }) => [id, allTasks.filter((t) => t.status === id).length])
        ) as Record<TaskStatus, number>,
      },
    };
  }, [data]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="shrink-0 border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-base font-semibold text-white">Backlog</h1>
              {projectId && !isPending && (
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

        {/* ── Insights strip ── */}
        {insights && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {PRIORITY_CHIPS.map(({ id, label, dotCls, chipCls }) => {
              const count = insights.byPriority[id];
              if (!count) return null;
              return (
                <span
                  key={id}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${chipCls}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${dotCls}`} />
                  {count} {label}
                </span>
              );
            })}

            <span className="mx-0.5 h-3 w-px bg-white/10" />

            {STATUS_CHIPS.map(({ id, label, chipCls }) => {
              const count = insights.byStatus[id];
              if (!count) return null;
              return (
                <span
                  key={id}
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${chipCls}`}
                >
                  {count} {label}
                </span>
              );
            })}

            {(insights.overdue > 0 || insights.unassigned > 0) && (
              <span className="mx-0.5 h-3 w-px bg-white/10" />
            )}

            {insights.overdue > 0 && (
              <span className="flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/8 px-2.5 py-0.5 text-xs text-red-400">
                <AlertCircle size={10} />
                {insights.overdue} overdue
              </span>
            )}

            {insights.unassigned > 0 && (
              <span className="flex items-center gap-1 rounded-full border border-zinc-600/30 bg-zinc-700/20 px-2.5 py-0.5 text-xs text-zinc-500">
                <UserX size={10} />
                {insights.unassigned} unassigned
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      {!projectId ? (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            title="No project selected"
            description="Select a project to view its backlog."
          />
        </div>
      ) : (
        <>
          <FilterBar
            filters={filters}
            setFilter={setFilter}
            clearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            members={members}
            epics={epics}
          />
          <TaskTable
            tasks={tasks}
            projectId={projectId}
            isPending={isPending}
            isError={isError}
            onRetry={() => void refetch()}
            hasNextPage={!!hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={() => void fetchNextPage()}
            hasActiveFilters={hasActiveFilters}
            onCreateTask={() => setShowCreate(true)}
          />
          <CreateTaskModal
            projectId={projectId}
            isOpen={showCreate}
            onClose={() => setShowCreate(false)}
            members={members}
            epics={epics}
          />
        </>
      )}
    </div>
  );
}
