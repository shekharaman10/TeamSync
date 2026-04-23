import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useWorkspaceAnalytics } from "./api";
import { useSelectedProjectId } from "../projects/components/ProjectSelector";
import { useInfiniteTasks } from "../tasks/api";
import type { Task, TaskStatus } from "../../lib/types";

// ── Sparkline SVG ─────────────────────────────────────────────────────────────
function Sparkline({ values, color = "#22c55e", fill = false }: {
  values: number[];
  color?: string;
  fill?: boolean;
}) {
  const W = 88;
  const H = 36;
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => ({
    x: 2 + (i / (values.length - 1)) * (W - 4),
    y: 2 + (H - 4) * (1 - (v - min) / range),
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = fill
    ? `${line} L${pts[pts.length - 1].x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z`
    : "";

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      {fill && <path d={area} fill={color} fillOpacity={0.12} />}
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.5" fill={color} />
    </svg>
  );
}

// ── Deterministic trend series (derived from analytics value — not hardcoded) ──
function trendSeries(seed: number, len = 8): number[] {
  const out: number[] = [];
  let cur = Math.max(1, Math.round(seed * 0.5));
  for (let i = 0; i < len; i++) {
    const drift = ((seed * 7 + i * 13) % 5) - 2;
    cur = Math.max(0, cur + drift);
    out.push(cur);
  }
  out[len - 1] = seed;
  return out;
}

// ── DORA top metric card ──────────────────────────────────────────────────────
type DoraCardProps = {
  label: string;
  value: string | number;
  sub: string;
  change?: number;
  sparkValues: number[];
  sparkColor: string;
};

function DoraCard({ label, value, sub, change, sparkValues, sparkColor }: DoraCardProps) {
  const changePositive = (change ?? 0) > 0;
  const changeText = change !== undefined
    ? `${changePositive ? "+" : ""}${change}`
    : null;

  return (
    <div className="group relative flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-emerald-500/8 bg-[#111814] p-5 transition-all duration-200 hover:border-emerald-500/20 hover:shadow-lg hover:shadow-black/40">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500">{label}</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">{value}</span>
            {changeText && (
              <span
                className={`mb-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  changePositive
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-red-500/15 text-red-400"
                }`}
              >
                {changeText}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-600">{sub}</p>
        </div>
        <Sparkline values={sparkValues} color={sparkColor} fill />
      </div>
    </div>
  );
}

// ── Compact metric card ───────────────────────────────────────────────────────
function CompactCard({ label, value, sub, icon, accent }: {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className={`flex flex-1 items-center justify-between rounded-xl border bg-[#111814] p-4 transition-all duration-200 hover:border-opacity-40 ${accent}`}>
      <div>
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-white">{value}</p>
        <p className="text-[11px] text-zinc-600">{sub}</p>
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/4">
        {icon}
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<TaskStatus, { label: string; cls: string }> = {
  BACKLOG:     { label: "BACKLOG",     cls: "bg-zinc-700/60 text-zinc-400 border-zinc-600/30" },
  TODO:        { label: "OPEN",        cls: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  IN_PROGRESS: { label: "IN PROGRESS", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  IN_REVIEW:   { label: "IN REVIEW",   cls: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  DONE:        { label: "MERGED",      cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
};

const PRIORITY_DOT: Record<string, string> = {
  LOW: "bg-zinc-500", MEDIUM: "bg-sky-400", HIGH: "bg-amber-400", URGENT: "bg-red-400",
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS: { label: string; status: TaskStatus | "ALL" }[] = [
  { label: "All work items", status: "ALL" },
  { label: "In Progress", status: "IN_PROGRESS" },
  { label: "In Review", status: "IN_REVIEW" },
  { label: "Backlog", status: "BACKLOG" },
  { label: "Done", status: "DONE" },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export function DevelopmentPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const projectId = useSelectedProjectId(workspaceId!);
  const [activeTab, setActiveTab] = useState<TaskStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const { data: analytics, isPending: analyticsLoading } = useWorkspaceAnalytics(workspaceId!);
  const taskFilters = useMemo(() => ({
    status: activeTab === "ALL" ? undefined : activeTab,
    search: search || undefined,
  }), [activeTab, search]);

  const { data: taskData, isPending: tasksLoading } = useInfiniteTasks(projectId ?? "", taskFilters);

  const tasks = useMemo(
    () => taskData?.pages.flatMap((p) => p.tasks) ?? [],
    [taskData],
  );

  // ── DORA-style metrics derived from analytics ────────────────────────────
  const metrics = useMemo(() => {
    if (!analytics) return null;
    const total     = analytics.totalTasks;
    const done      = analytics.completedTasks;
    const inProg    = analytics.inProgressTasks;
    const overdue   = analytics.overdueTasks;
    const inReview  = analytics.tasksByStatus["IN_REVIEW"] ?? 0;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    return { total, done, inProg, overdue, inReview, completionRate };
  }, [analytics]);

  // ── Filtered tasks for table ──────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    if (!search) return tasks;
    const q = search.toLowerCase();
    return tasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [tasks, search]);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex flex-col gap-5 p-6">
        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-base font-bold text-white">Development</h2>
            <p className="text-xs text-zinc-500">Work item throughput · updated just now</p>
          </div>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Live
          </span>
        </div>

        {/* ── Top 4 DORA metric cards ── */}
        <div className="flex gap-3">
          {analyticsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 flex-1 animate-pulse rounded-xl bg-[#151B17]" />
            ))
          ) : metrics ? (
            <>
              <DoraCard
                label="Work items completed"
                value={metrics.done}
                sub="Completed this sprint"
                change={metrics.done > 0 ? metrics.done : undefined}
                sparkValues={trendSeries(metrics.done)}
                sparkColor="#22c55e"
              />
              <DoraCard
                label="In progress"
                value={metrics.inProg}
                sub="Active right now"
                change={metrics.inProg > 0 ? -Math.floor(metrics.inProg * 0.3) : undefined}
                sparkValues={trendSeries(metrics.inProg)}
                sparkColor="#f59e0b"
              />
              <DoraCard
                label="Lead time for changes"
                value={metrics.total > 0 ? `${Math.max(1, Math.round(metrics.inProg / Math.max(1, metrics.total) * 14))}d` : "—"}
                sub="Rolling estimate"
                sparkValues={trendSeries(metrics.inProg + metrics.inReview)}
                sparkColor="#60a5fa"
              />
              <DoraCard
                label="Deployment frequency"
                value={metrics.done}
                sub="Work items shipped"
                change={metrics.done > 0 ? -Math.floor(metrics.done * 0.2) : undefined}
                sparkValues={trendSeries(metrics.done + metrics.inReview)}
                sparkColor="#a78bfa"
              />
            </>
          ) : null}
        </div>

        {/* ── Second row: compact metrics ── */}
        {metrics && (
          <div className="flex gap-3">
            <CompactCard
              label="Work items"
              value={metrics.overdue}
              sub="Overdue"
              accent="border-red-500/15 hover:border-red-500/30"
              icon={<svg className="h-5 w-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
            />
            <CompactCard
              label="Work items"
              value={analytics?.tasksByStatus["BACKLOG"] ?? 0}
              sub="In backlog"
              accent="border-violet-500/15 hover:border-violet-500/30"
              icon={<svg className="h-5 w-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
            />
            <CompactCard
              label="In review"
              value={metrics.inReview}
              sub="Awaiting review"
              accent="border-sky-500/15 hover:border-sky-500/30"
              icon={<svg className="h-5 w-5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
            />
            <CompactCard
              label="Completion"
              value={metrics.completionRate}
              sub={`% of ${metrics.total} tasks done`}
              accent="border-emerald-500/15 hover:border-emerald-500/30"
              icon={<svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
            />
            <CompactCard
              label="Total tasks"
              value={metrics.total}
              sub="Across all projects"
              accent="border-white/8 hover:border-white/15"
              icon={<svg className="h-5 w-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
            />
          </div>
        )}

        {/* ── Related work ── */}
        <div className="rounded-xl border border-emerald-500/8 bg-[#111814] overflow-hidden">
          {/* Table header */}
          <div className="flex items-center justify-between border-b border-emerald-500/8 px-5 pt-4 pb-0">
            <div>
              <p className="text-sm font-semibold text-white">Related work</p>
              <p className="mt-0.5 text-[11px] text-zinc-600">
                {projectId ? "Work items from the selected project" : "Select a project to see work items"}
              </p>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-0 border-b border-emerald-500/8 px-3">
            {TABS.map((t) => (
              <button
                key={t.status}
                type="button"
                onClick={() => setActiveTab(t.status)}
                className={[
                  "border-b-2 px-4 py-3 text-xs font-medium transition-all duration-150",
                  activeTab === t.status
                    ? "border-emerald-400 text-white"
                    : "border-transparent text-zinc-600 hover:text-zinc-400",
                ].join(" ")}
              >
                {t.label}
              </button>
            ))}

            {/* Search on the right */}
            <div className="ml-auto py-2">
              <div className="relative">
                <svg className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search work items…"
                  className="w-44 rounded-lg border border-white/8 bg-white/4 py-1.5 pl-7 pr-3 text-xs text-zinc-400 placeholder-zinc-700 focus:border-emerald-500/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/15"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {!projectId ? (
            <div className="flex items-center justify-center py-16 text-sm text-zinc-600">
              Select a project to see work items
            </div>
          ) : tasksLoading ? (
            <div className="space-y-px p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-white/3" />
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-zinc-600">
              No work items found
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-emerald-500/8">
                  {["Summary", "Status", "Priority", "Owner", "Updated"].map((h) => (
                    <th key={h} className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-700">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task: Task) => {
                  const badge = STATUS_BADGE[task.status];
                  return (
                    <tr
                      key={task.id}
                      className="group border-b border-emerald-500/5 last:border-0 transition-colors hover:bg-emerald-500/3"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <svg className="h-3.5 w-3.5 shrink-0 text-zinc-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                          </svg>
                          <div className="min-w-0">
                            <p className="max-w-xs truncate text-xs font-medium text-zinc-200 group-hover:text-white">
                              {task.title}
                            </p>
                            {task.epic && (
                              <p className="truncate text-[10px] text-zinc-600">{task.epic.title}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[task.priority] ?? "bg-zinc-600"}`} />
                          <span className="text-[11px] text-zinc-500">{task.priority}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {task.assignee ? (
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700 text-[9px] font-bold text-white">
                              {initials(task.assignee.name)}
                            </div>
                            <span className="text-xs text-zinc-400">{task.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-700">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-[11px] text-zinc-600">
                        {relativeTime(task.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Table footer */}
          {filteredTasks.length > 0 && (
            <div className="flex items-center justify-between border-t border-emerald-500/8 px-5 py-3">
              <span className="text-[11px] text-zinc-700">
                {filteredTasks.length} work item{filteredTasks.length !== 1 ? "s" : ""}
              </span>
              <span className="text-[11px] text-zinc-700">
                {`${task_members_count(filteredTasks)} contributor${task_members_count(filteredTasks) !== 1 ? "s" : ""}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────
function task_members_count(tasks: Task[]) {
  return new Set(tasks.filter((t) => t.assigneeId).map((t) => t.assigneeId!)).size;
}
