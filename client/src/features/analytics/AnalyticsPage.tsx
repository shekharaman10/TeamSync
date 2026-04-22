import { useParams } from "react-router-dom";
import { useWorkspaceAnalytics } from "./api";
import { SkeletonCard } from "../../components/ui/Skeleton";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { EmptyState } from "../../components/ui/EmptyState";
import type { TaskStatus, Priority, AnalyticsData } from "../../lib/types";

const STATUS_LABEL: Record<TaskStatus, string> = {
  BACKLOG: "Backlog", TODO: "To Do", IN_PROGRESS: "In Progress", IN_REVIEW: "In Review", DONE: "Done",
};
const STATUS_BAR: Record<TaskStatus, string> = {
  BACKLOG: "bg-zinc-600", TODO: "bg-zinc-500", IN_PROGRESS: "bg-sky-400", IN_REVIEW: "bg-amber-400", DONE: "bg-teal-400",
};
const STATUS_TEXT: Record<TaskStatus, string> = {
  BACKLOG: "text-zinc-500", TODO: "text-zinc-400", IN_PROGRESS: "text-sky-400", IN_REVIEW: "text-amber-400", DONE: "text-teal-400",
};

const PRIORITY_LABEL: Record<Priority, string> = {
  URGENT: "Urgent", HIGH: "High", MEDIUM: "Medium", LOW: "Low",
};
const PRIORITY_BAR: Record<Priority, string> = {
  URGENT: "bg-red-400", HIGH: "bg-amber-400", MEDIUM: "bg-sky-400", LOW: "bg-zinc-500",
};
const PRIORITY_TEXT: Record<Priority, string> = {
  URGENT: "text-red-400", HIGH: "text-amber-400", MEDIUM: "text-sky-400", LOW: "text-zinc-400",
};

const PROGRESS_CLS: Record<string, string> = {
  "bg-zinc-600": "[&::-webkit-progress-value]:bg-zinc-600 [&::-moz-progress-bar]:bg-zinc-600",
  "bg-zinc-500": "[&::-webkit-progress-value]:bg-zinc-500 [&::-moz-progress-bar]:bg-zinc-500",
  "bg-sky-400":  "[&::-webkit-progress-value]:bg-sky-400 [&::-moz-progress-bar]:bg-sky-400",
  "bg-amber-400":"[&::-webkit-progress-value]:bg-amber-400 [&::-moz-progress-bar]:bg-amber-400",
  "bg-teal-400": "[&::-webkit-progress-value]:bg-teal-400 [&::-moz-progress-bar]:bg-teal-400",
  "bg-red-400":  "[&::-webkit-progress-value]:bg-red-400 [&::-moz-progress-bar]:bg-red-400",
};

function StatCard({ label, value, sub, accent }: { label: string; value: number; sub: string; accent: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-zinc-800/40 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
      <p className="mt-1 text-xs text-zinc-600">{sub}</p>
    </div>
  );
}

function BarRow({ label, count, max, barClass, textClass }: {
  label: string; count: number; max: number; barClass: string; textClass: string;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-right text-xs text-zinc-400">{label}</span>
      <progress
        value={pct}
        max={100}
        aria-label={label}
        className={`h-2 flex-1 rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-zinc-800 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-500 [&::-moz-progress-bar]:rounded-full ${PROGRESS_CLS[barClass] ?? ""}`}
      />
      <span className={`w-6 text-right text-xs font-semibold ${textClass}`}>{count}</span>
    </div>
  );
}

function AnalyticsContent({ data }: { data: AnalyticsData }) {
  const total = data.totalTasks;
  const completionPct = total > 0 ? Math.round((data.completedTasks / total) * 100) : 0;

  const statusCounts = (Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => ({
    status: s,
    count: data.tasksByStatus[s] ?? 0,
  }));

  const priorityCounts = (["URGENT", "HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => ({
    priority: p,
    count: data.tasksByPriority[p] ?? 0,
  }));

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total tasks"  value={total}               sub="across all statuses"    accent="text-white" />
        <StatCard label="Completed"    value={data.completedTasks} sub={`${completionPct}% done`} accent="text-teal-400" />
        <StatCard label="In progress"  value={data.inProgressTasks} sub="currently active"       accent="text-sky-400" />
        <StatCard label="Overdue"      value={data.overdueTasks}   sub="past due date"           accent="text-red-400" />
      </div>

      <div className="mb-6 rounded-xl border border-white/5 bg-zinc-800/40 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Overall progress</h2>
          <span className="text-sm font-bold text-teal-400">{completionPct}%</span>
        </div>
        <progress
          value={completionPct}
          max={100}
          aria-label="Completion"
          className="h-2.5 w-full rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-zinc-800 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-teal-400 [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-700 [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-teal-400"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/5 bg-zinc-800/40 p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">By status</h2>
          <div className="space-y-3">
            {statusCounts.map(({ status, count }) => (
              <BarRow key={status} label={STATUS_LABEL[status]} count={count} max={total} barClass={STATUS_BAR[status]} textClass={STATUS_TEXT[status]} />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-zinc-800/40 p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">By priority</h2>
          <div className="space-y-3">
            {priorityCounts.map(({ priority, count }) => (
              <BarRow key={priority} label={PRIORITY_LABEL[priority]} count={count} max={total} barClass={PRIORITY_BAR[priority]} textClass={PRIORITY_TEXT[priority]} />
            ))}
          </div>
        </div>

        {data.tasksByAssignee.length > 0 && (
          <div className="rounded-xl border border-white/5 bg-zinc-800/40 p-5 lg:col-span-2">
            <h2 className="mb-4 text-sm font-semibold text-white">By assignee</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.tasksByAssignee.map((a) => {
                const pct = a.count > 0 ? Math.round((a.doneCount / a.count) * 100) : 0;
                const initials = a.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <div key={a.userId} className="rounded-lg border border-white/5 bg-zinc-900/60 p-4">
                    <div className="mb-3 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500/20 text-xs font-bold text-teal-300">
                        {initials}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-200">{a.name}</p>
                        <p className="text-[10px] text-zinc-600">{a.count} tasks</p>
                      </div>
                    </div>
                    <progress
                      value={pct}
                      max={100}
                      aria-label={`${a.name} completion`}
                      className="h-1.5 w-full rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-zinc-800 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-teal-400 [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-teal-400"
                    />
                    <p className="mt-1.5 text-[10px] text-zinc-500">{a.doneCount} done · {pct}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function AnalyticsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data, isPending, isError, refetch } = useWorkspaceAnalytics(workspaceId!);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center border-b border-white/5 px-6 py-4">
        <div>
          <h1 className="text-base font-semibold text-white">Analytics</h1>
          {data && <p className="text-xs text-zinc-500">{data.totalTasks} tasks total</p>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isPending && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}
        {isError && (
          <ErrorBanner message="Failed to load analytics." onRetry={() => void refetch()} />
        )}
        {data && data.totalTasks === 0 && (
          <EmptyState
            title="No data yet"
            description="Create tasks to see analytics."
          />
        )}
        {data && data.totalTasks > 0 && <AnalyticsContent data={data} />}
      </div>
    </div>
  );
}
