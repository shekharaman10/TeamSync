import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Target, CheckCircle2, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { useWorkspaceAnalytics } from "../analytics/api";
import { useProjects } from "../projects/api";
import { useWorkspaceMembers } from "../workspaces/api";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorBanner } from "../../components/ui/ErrorBanner";

type GoalStatus = "on-track" | "at-risk" | "completed";

function getGoalStatus(pct: number): GoalStatus {
  if (pct >= 100) return "completed";
  if (pct >= 40)  return "on-track";
  return "at-risk";
}

const GOAL_STATUS_STYLES: Record<GoalStatus, { label: string; dot: string; badge: string }> = {
  "completed": { label: "Completed", dot: "bg-emerald-400", badge: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20" },
  "on-track":  { label: "On Track",  dot: "bg-sky-400",     badge: "text-sky-300 bg-sky-400/10 border-sky-400/20"           },
  "at-risk":   { label: "At Risk",   dot: "bg-amber-400",   badge: "text-amber-300 bg-amber-400/10 border-amber-400/20"     },
};

function ProgressBar({ pct, status }: { pct: number; status: GoalStatus }) {
  const barColor =
    status === "completed" ? "bg-emerald-500" :
    status === "on-track"  ? "bg-sky-500" :
    "bg-amber-500";
  const clampedPct = Math.min(100, Math.max(0, pct));

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
      <div
        className={`h-full rounded-full transition-all duration-700 ${barColor}`}
        style={{ width: `${clampedPct}%` }}
      />
    </div>
  );
}

export function GoalsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data: analytics, isPending: aLoading, isError: aError, refetch } = useWorkspaceAnalytics(workspaceId!);
  const { data: projects, isPending: pLoading }  = useProjects(workspaceId!);
  const { data: members } = useWorkspaceMembers(workspaceId!);

  const isPending = aLoading || pLoading;

  // Workspace-level derived goals
  const workspaceGoals = useMemo(() => {
    if (!analytics) return [];
    const total     = analytics.totalTasks;
    const done      = analytics.completedTasks;
    const inProg    = analytics.inProgressTasks;
    const overdue   = analytics.overdueTasks;
    const donePct   = total > 0 ? Math.round((done / total) * 100) : 0;
    const activePct = total > 0 ? Math.round(((done + inProg) / total) * 100) : 0;
    const overduePct = total > 0 ? Math.max(0, 100 - Math.round((overdue / total) * 100)) : 100;

    return [
      {
        id: "completion",
        title: "Workspace Completion",
        description: `Complete all ${total} tasks across projects`,
        pct: donePct,
        meta: `${done} of ${total} tasks done`,
      },
      {
        id: "active",
        title: "Active Progress",
        description: "Keep work actively moving through the pipeline",
        pct: activePct,
        meta: `${done + inProg} tasks started or complete`,
      },
      {
        id: "overdue",
        title: "On-Time Delivery",
        description: "Minimize overdue tasks across the workspace",
        pct: overduePct,
        meta: overdue === 0 ? "No overdue tasks 🎉" : `${overdue} task${overdue === 1 ? "" : "s"} overdue`,
      },
    ];
  }, [analytics]);

  // Per-project goals (using taskCount)
  const projectGoals = useMemo(() => {
    if (!projects) return [];
    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      key: p.key,
      taskCount: p.taskCount ?? 0,
      // We don't have per-project done count — show task volume as a proxy goal
      pct: p.taskCount ? Math.min(100, Math.round(((p.taskCount ?? 0) / 20) * 100)) : 0,
    }));
  }, [projects]);

  const statCards = useMemo(() => {
    if (!analytics) return null;
    const total   = analytics.totalTasks;
    const done    = analytics.completedTasks;
    const overdue = analytics.overdueTasks;
    const members_count = members?.length ?? 0;
    return { total, done, overdue, members_count };
  }, [analytics, members]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-white/5 px-6 py-4">
        <h1 className="text-base font-semibold text-white">Goals</h1>
        <p className="mt-0.5 text-xs text-zinc-500">
          Track progress toward workspace objectives
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {aError && (
          <ErrorBanner message="Failed to load analytics." onRetry={() => void refetch()} />
        )}

        {/* Stat cards */}
        {statCards && (
          <div className="mb-6 grid grid-cols-4 gap-3">
            {[
              { label: "Total Tasks",    value: statCards.total,          icon: <Target size={16} className="text-emerald-400" />,        bg: "bg-emerald-400/8 border-emerald-400/15" },
              { label: "Completed",      value: statCards.done,           icon: <CheckCircle2 size={16} className="text-sky-400" />,       bg: "bg-sky-400/8 border-sky-400/15"         },
              { label: "In Progress",    value: analytics?.inProgressTasks ?? 0, icon: <TrendingUp size={16} className="text-violet-400" />, bg: "bg-violet-400/8 border-violet-400/15" },
              { label: "Overdue",        value: statCards.overdue,        icon: <AlertTriangle size={16} className="text-amber-400" />,    bg: "bg-amber-400/8 border-amber-400/15"     },
            ].map(({ label, value, icon, bg }) => (
              <div key={label} className={`rounded-xl border p-4 ${bg}`}>
                <div className="flex items-center justify-between">
                  {icon}
                  <span className="text-2xl font-bold text-white">{value}</span>
                </div>
                <p className="mt-2 text-xs text-zinc-500">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Workspace goals */}
        <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
          <Target size={12} />
          Workspace Goals
        </h2>

        {isPending ? (
          <div className="mb-6 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : (
          <div className="mb-6 space-y-3">
            {workspaceGoals.map((goal) => {
              const status = getGoalStatus(goal.pct);
              const styles = GOAL_STATUS_STYLES[status];
              return (
                <div
                  key={goal.id}
                  className="rounded-xl border border-white/5 bg-zinc-900/60 p-4 transition-colors hover:border-emerald-500/15"
                >
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${styles.dot}`} />
                        <p className="truncate text-sm font-medium text-zinc-100">{goal.title}</p>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500">{goal.description}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles.badge}`}>
                      {styles.label}
                    </span>
                  </div>
                  <ProgressBar pct={goal.pct} status={status} />
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-600">{goal.meta}</span>
                    <span className="text-xs font-semibold text-zinc-300">{goal.pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Per-project goals */}
        {projectGoals.length > 0 && (
          <>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <Clock size={12} />
              Project Progress
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {projectGoals.map((p) => {
                const status = getGoalStatus(p.pct);
                const styles = GOAL_STATUS_STYLES[status];
                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-white/5 bg-zinc-900/60 p-4 transition-colors hover:border-emerald-500/15"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-zinc-100">{p.name}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5 font-mono">{p.key}</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${styles.badge}`}>
                        {styles.label}
                      </span>
                    </div>
                    <ProgressBar pct={p.pct} status={status} />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-600">
                        {p.taskCount} task{p.taskCount !== 1 ? "s" : ""}
                      </span>
                      <span className="text-xs font-semibold text-zinc-400">{p.pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
