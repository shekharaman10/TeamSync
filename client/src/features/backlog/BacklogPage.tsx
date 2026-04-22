import { useState } from "react";
import { useParams } from "react-router-dom";
import { useInfiniteTasks } from "../tasks/api";
import { useWorkspaceMembers } from "../workspaces/api";
import { useEpics } from "../epics/api";
import { useTaskFilters } from "../tasks/hooks/useTaskFilters";
import { FilterBar } from "../tasks/components/FilterBar";
import { TaskTable } from "../tasks/components/TaskTable";
import { CreateTaskModal } from "../tasks/components/CreateTaskModal";
import { ProjectSelector, useSelectedProjectId } from "../projects/components/ProjectSelector";
import { EmptyState } from "../../components/ui/EmptyState";

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

  const tasks = data?.pages.flatMap((p) => p.tasks) ?? [];
  const total = data?.pages[0] ? tasks.length : 0;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-base font-semibold text-white">Backlog</h1>
            {projectId && !isPending && (
              <p className="text-xs text-zinc-500">{total} tasks</p>
            )}
          </div>
          <ProjectSelector workspaceId={workspaceId!} />
        </div>
        {projectId && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-teal-400 px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-teal-300"
          >
            + Add task
          </button>
        )}
      </div>

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
