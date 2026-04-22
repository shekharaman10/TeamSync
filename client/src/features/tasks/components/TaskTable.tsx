import { SkeletonRow } from "../../../components/ui/Skeleton";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { EmptyState } from "../../../components/ui/EmptyState";
import { TaskRow } from "./TaskRow";
import type { Task } from "../../../lib/types";

type Props = {
  tasks: Task[];
  projectId: string;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  hasActiveFilters: boolean;
  onCreateTask: () => void;
};

export function TaskTable({
  tasks,
  projectId,
  isPending,
  isError,
  onRetry,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  hasActiveFilters,
  onCreateTask,
}: Props) {
  if (isError) {
    return (
      <div className="px-6 pt-6">
        <ErrorBanner message="Failed to load tasks." onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full border-collapse text-sm" role="table">
        <thead className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm">
          <tr className="border-b border-white/5 text-left">
            <th scope="col" className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Task</th>
            <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
            <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Priority</th>
            <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Assignee</th>
            <th scope="col" className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 lg:table-cell">Due</th>
          </tr>
        </thead>
        <tbody>
          {isPending && (
            Array.from({ length: 5 }, (_, i) => <SkeletonRow key={i} />)
          )}
          {!isPending && tasks.map((task) => (
            <TaskRow key={task.id} task={task} projectId={projectId} />
          ))}
          {!isPending && tasks.length === 0 && (
            <tr>
              <td colSpan={5}>
                {hasActiveFilters ? (
                  <div className="px-6 py-16 text-center text-sm text-zinc-600">
                    No tasks match your filters
                  </div>
                ) : (
                  <EmptyState
                    title="No tasks yet"
                    description="Add the first task to get started."
                    action={{ label: "Add task", onClick: onCreateTask }}
                  />
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {hasNextPage && (
        <div className="flex justify-center py-4">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-400 transition-colors hover:bg-white/5 disabled:opacity-50"
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
