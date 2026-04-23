import { useState, useEffect, useMemo, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import { useWorkspaceAnalytics } from "./api";
import { useAuthStore } from "../auth/useAuthStore";
import { SkeletonCard } from "../../components/ui/Skeleton";
import type { AnalyticsData } from "../../lib/types";

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG = "#0B0F0C";
const SURFACE = "#151B17";
const SURFACE2 = "#1A2320";
const PRIMARY = "#22C55E";
const BORDER = "rgba(34,197,94,0.10)";
const BORDER_HOVER = "rgba(34,197,94,0.22)";

// ── useCountUp ────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1100) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const start = performance.now();
    let raf: number;
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(target * ease));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

// ── Inline SVG Sparkline ─────────────────────────────────────────────────────
function Sparkline({ data, color = PRIMARY }: { data: number[]; color?: string }) {
  const W = 72;
  const H = 28;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const xs = data.map((_, i) => 2 + (i / (data.length - 1)) * (W - 4));
  const ys = data.map((v) => 2 + (H - 4) * (1 - (v - min) / range));
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${path} L${xs[xs.length - 1].toFixed(1)},${H} L${xs[0].toFixed(1)},${H} Z`;
  const id = `spark-${color.replace("#", "")}`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── MetricCard ────────────────────────────────────────────────────────────────
type MetricCardProps = {
  label: string;
  value: number;
  unit?: string;
  delta: number;
  sparkData: number[];
  icon: React.ReactNode;
};

const MetricCard = memo(function MetricCard({ label, value, unit = "", delta, sparkData, icon }: MetricCardProps) {
  const animated = useCountUp(value);
  const up = delta >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{ background: SURFACE, borderColor: BORDER }}
      className="group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-default"
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = BORDER_HOVER; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = BORDER; }}
    >
      {/* Top shimmer line */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg,transparent,${PRIMARY}30,transparent)` }}
      />

      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: "rgba(34,197,94,0.12)" }}
        >
          {icon}
        </div>
        <Sparkline data={sparkData} />
      </div>

      <div className="mt-4">
        <p className="text-3xl font-bold tabular-nums tracking-tight text-white">
          {animated}{unit}
        </p>
        <p className="mt-0.5 text-xs font-medium text-slate-400">{label}</p>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <span
          className={`flex items-center gap-0.5 text-xs font-semibold ${up ? "text-emerald-400" : "text-red-400"}`}
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            {up
              ? <polyline points="18 15 12 9 6 15" />
              : <polyline points="6 9 12 15 18 9" />}
          </svg>
          {Math.abs(delta)}%
        </span>
        <span className="text-xs text-slate-500">vs last 7 days</span>
      </div>
    </motion.div>
  );
});

// ── Activity Area Chart ───────────────────────────────────────────────────────
const HOURS = ["10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm"];

function buildActivityData(completed: number) {
  const peak = Math.max(completed, 12);
  return HOURS.map((time, i) => ({
    time,
    tasks: Math.max(
      0,
      Math.round(
        peak * 0.25 +
          Math.sin((i / HOURS.length) * Math.PI * 1.6) * peak * 0.55 +
          (((i * 17 + 3) % 7) - 3) * peak * 0.06,
      ),
    ),
  }));
}

type TooltipPayload = { value: number };
type CustomTooltipProps = { active?: boolean; payload?: TooltipPayload[]; label?: string };

function ActivityTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-xl"
      style={{ background: SURFACE2, borderColor: BORDER_HOVER }}
    >
      <p className="text-slate-400">{label}</p>
      <p className="font-semibold text-emerald-400">Tasks Completed: {payload[0].value}</p>
    </div>
  );
}

function ActivityChartSection({ completed }: { completed: number }) {
  const data = useMemo(() => buildActivityData(completed), [completed]);
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5"
      style={{ background: SURFACE, borderColor: BORDER }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg,transparent,${PRIMARY}30,transparent)` }}
      />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Task Activity</h2>
          <p className="text-[11px] text-slate-500">Completion rate over time</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg border px-2.5 py-1 text-xs text-slate-400 transition-colors hover:text-emerald-400"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            Last 24 Hours ▾
          </button>
          <button className="text-slate-600 transition-colors hover:text-slate-400">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.2" />
              <circle cx="12" cy="12" r="1.2" />
              <circle cx="12" cy="19" r="1.2" />
            </svg>
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={188}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PRIMARY} stopOpacity="0.28" />
              <stop offset="100%" stopColor={PRIMARY} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<ActivityTooltip />} cursor={{ stroke: `${PRIMARY}40`, strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="tasks"
            stroke={PRIMARY}
            strokeWidth={2.5}
            fill="url(#actGrad)"
            dot={false}
            activeDot={{ r: 4, fill: PRIMARY, stroke: SURFACE, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
type DonutSlice = { name: string; value: number; color: string };

function DonutChartSection({ slices, total }: { slices: DonutSlice[]; total: number }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const donePct = total > 0 ? Math.round(((slices.find((s) => s.name === "Done")?.value ?? 0) / total) * 100) : 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5"
      style={{ background: SURFACE, borderColor: BORDER }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg,transparent,${PRIMARY}30,transparent)` }}
      />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Task Distribution</h2>
          <p className="text-[11px] text-slate-500">By status breakdown</p>
        </div>
        <button
          className="rounded-lg border px-2.5 py-1 text-xs text-slate-400 transition-colors hover:text-emerald-400"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          This Week ▾
        </button>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <PieChart width={148} height={148}>
            <Pie
              data={slices}
              cx="50%"
              cy="50%"
              innerRadius={46}
              outerRadius={66}
              dataKey="value"
              strokeWidth={0}
              onMouseEnter={(_, i) => setHovered(slices[i].name)}
              onMouseLeave={() => setHovered(null)}
            >
              {slices.map((s) => (
                <Cell
                  key={s.name}
                  fill={s.color}
                  style={{
                    opacity: hovered === null || hovered === s.name ? 1 : 0.35,
                    transition: "opacity 150ms ease",
                    cursor: "pointer",
                  }}
                />
              ))}
            </Pie>
          </PieChart>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xl font-bold text-white">{donePct}%</p>
            <p className="text-[10px] text-slate-500">Completed</p>
          </div>
        </div>

        <div className="flex-1 space-y-2.5">
          {slices.map((s) => (
            <div key={s.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                <span className="text-xs text-slate-400">{s.name}</span>
              </div>
              <span className="text-xs font-semibold text-white">
                {total > 0 ? Math.round((s.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Recent Tasks Table ────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, { label: string; cls: string; glow: string }> = {
  Pending:     { label: "Pending",     cls: "text-amber-400 bg-amber-500/10 border-amber-500/20",    glow: "0 0 10px rgba(245,158,11,0.3)" },
  "In Progress": { label: "In Progress", cls: "text-sky-400 bg-sky-500/10 border-sky-500/20",           glow: "0 0 10px rgba(14,165,233,0.3)" },
  Scheduled:   { label: "Scheduled",   cls: "text-violet-400 bg-violet-500/10 border-violet-500/20", glow: "0 0 10px rgba(139,92,246,0.3)" },
  Completed:   { label: "Completed",   cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", glow: "0 0 10px rgba(34,197,94,0.3)" },
};

type MockTask = {
  id: string;
  name: string;
  category: string;
  assignee: string;
  initials: string;
  status: string;
  due: string;
};

function buildMockTasks(assignees: AnalyticsData["tasksByAssignee"]): MockTask[] {
  const names = ["Redesign Login Screen", "Fix Validation Bug", "Client Meeting Prep", "Dashboard UI Review", "API Integration"];
  const categories = ["Design", "Development", "Meeting", "Design", "Development"];
  const statuses = ["Pending", "In Progress", "Scheduled", "Completed", "In Progress"];
  const dues = ["2 days", "3 days", "4 days", "Done", "5 days"];
  return names.map((name, i) => {
    const a = assignees[i % (assignees.length || 1)];
    const aName = a?.name ?? "Unassigned";
    return {
      id: `TS00${i + 1}`,
      name,
      category: categories[i],
      assignee: aName,
      initials: aName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
      status: statuses[i],
      due: statuses[i] === "Completed" ? "Done" : `Due in ${dues[i]}`,
    };
  });
}

function RecentTasksTable({ data, onViewAll }: { data: AnalyticsData; onViewAll: () => void }) {
  const tasks = useMemo(() => buildMockTasks(data.tasksByAssignee), [data]);
  return (
    <div
      className="relative overflow-hidden rounded-2xl border"
      style={{ background: SURFACE, borderColor: BORDER }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg,transparent,${PRIMARY}30,transparent)` }}
      />
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-sm font-semibold text-white">Recent Tasks</h2>
        <button className="text-slate-600 transition-colors hover:text-slate-400">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.2" />
            <circle cx="12" cy="12" r="1.2" />
            <circle cx="12" cy="19" r="1.2" />
          </svg>
        </button>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            {["Task ID", "Task Name", "Category", "Assigned To", "Status"].map((h) => (
              <th key={h} className="px-5 py-2.5 text-left font-medium text-slate-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, i) => {
            const badge = STATUS_BADGE[task.status] ?? STATUS_BADGE["Pending"];
            return (
              <motion.tr
                key={task.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.25, ease: "easeOut" }}
                className="group cursor-pointer transition-colors"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background = "rgba(34,197,94,0.04)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                }}
              >
                <td className="px-5 py-3 font-mono text-slate-500">#{task.id}</td>
                <td className="px-5 py-3 font-medium text-slate-200">{task.name}</td>
                <td className="px-5 py-3 text-slate-400">{task.category}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                      style={{ background: "rgba(34,197,94,0.2)" }}
                    >
                      {task.initials}
                    </div>
                    <span className="text-slate-300">{task.assignee}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}
                    style={{ boxShadow: badge.glow }}
                  >
                    {badge.label}
                  </span>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>

      <button
        onClick={onViewAll}
        className="w-full py-3 text-xs font-medium transition-colors hover:text-emerald-400"
        style={{ color: PRIMARY, borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        View All Tasks →
      </button>
    </div>
  );
}

// ── Top Projects ──────────────────────────────────────────────────────────────
function TopProjects({ data }: { data: AnalyticsData }) {
  const projects = useMemo(() => {
    if (data.tasksByAssignee.length === 0) {
      return [
        { name: "Website Redesign", sub: "Design System Update", pct: 78, icon: "🌐", behind: false },
        { name: "Mobile App Dashboard", sub: "UI Implementation",   pct: 60, icon: "📱", behind: false },
        { name: "Internal Tool Upgrade", sub: "Performance Improvements", pct: 45, icon: "⚙️", behind: true },
      ];
    }
    return data.tasksByAssignee.slice(0, 3).map((a, i) => {
      const pct = a.count > 0 ? Math.round((a.doneCount / a.count) * 100) : 0;
      const emojis = ["🌐", "📱", "⚙️"];
      return {
        name: `${a.name}'s Tasks`,
        sub: `${a.count} tasks · ${a.doneCount} done`,
        pct,
        icon: emojis[i % emojis.length],
        behind: pct < 40,
      };
    });
  }, [data]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5"
      style={{ background: SURFACE, borderColor: BORDER }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg,transparent,${PRIMARY}30,transparent)` }}
      />
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Top Projects</h2>
        <button
          className="rounded-lg border px-2.5 py-1 text-xs text-slate-400 transition-colors hover:text-emerald-400"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          This Week ▾
        </button>
      </div>

      <div className="space-y-4">
        {projects.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.25, ease: "easeOut" }}
            className="flex items-start gap-3"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
              style={{ background: "rgba(34,197,94,0.1)" }}
            >
              {p.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-200">{p.name}</p>
                  <p className="text-[10px] text-slate-500">{p.sub}</p>
                </div>
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${p.pct}%` }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.7, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background: p.behind
                      ? "linear-gradient(90deg,#b45309,#f59e0b)"
                      : `linear-gradient(90deg,${PRIMARY},#4ADE80)`,
                  }}
                />
              </div>
              <p className="mt-1 text-right text-[10px] text-slate-500">{p.pct}%</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Activity Feed ─────────────────────────────────────────────────────────────
const FEED_ITEMS = [
  { action: "completed", task: "API endpoint design", time: "2m ago",  verb: "completed" },
  { action: "assigned",  task: "Fix login bug",        time: "8m ago",  verb: "assigned" },
  { action: "moved",     task: "Dashboard mockup",     time: "15m ago", verb: "moved to Review" },
  { action: "created",   task: "New onboarding flow",  time: "23m ago", verb: "created" },
  { action: "completed", task: "Unit tests for auth",  time: "41m ago", verb: "completed" },
];

const VERB_COLOR: Record<string, string> = {
  completed: "text-emerald-400",
  assigned:  "text-sky-400",
  moved:     "text-amber-400",
  created:   "text-violet-400",
};

function ActivityFeed({ data }: { data: AnalyticsData }) {
  const assignees = data.tasksByAssignee.slice(0, 5);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5"
      style={{ background: SURFACE, borderColor: BORDER }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg,transparent,${PRIMARY}30,transparent)` }}
      />
      <h2 className="mb-4 text-sm font-semibold text-white">Live Activity</h2>

      <div className="relative space-y-0 pl-3">
        {/* vertical line */}
        <div
          className="absolute left-3 top-0 bottom-0 w-px"
          style={{ background: "linear-gradient(to bottom,rgba(34,197,94,0.3),transparent)" }}
        />

        {FEED_ITEMS.map((item, i) => {
          const a = assignees[i % (assignees.length || 1)];
          const name = a?.name ?? "Someone";
          const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
          const verbCls = VERB_COLOR[item.action] ?? "text-slate-400";

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, duration: 0.25, ease: "easeOut" }}
              className="relative flex items-start gap-3 py-2.5 pl-4"
            >
              {/* timeline dot */}
              <div
                className="absolute left-2.5 top-4 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
                style={{ background: PRIMARY }}
              />

              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white ring-1"
                style={{ background: "rgba(34,197,94,0.15)", outline: "1px solid rgba(34,197,94,0.2)" }}
              >
                {initials}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-300">
                  <span className="font-semibold text-slate-100">{name}</span>{" "}
                  <span className={verbCls}>{item.verb}</span>{" "}
                  <span className="text-slate-400">"{item.task}"</span>
                </p>
                <p className="mt-0.5 text-[10px] text-slate-600">{item.time}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-6" style={{ background: BG }}>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-12 gap-4 mb-4">
        <div className="col-span-7"><SkeletonCard /></div>
        <div className="col-span-5"><SkeletonCard /></div>
      </div>
    </div>
  );
}

// ── Dashboard root ────────────────────────────────────────────────────────────
function DashboardContent({ data, workspaceId }: { data: AnalyticsData; workspaceId: string }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const total = data.totalTasks;
  const completed = data.completedTasks;
  const active = data.inProgressTasks;
  const members = data.tasksByAssignee.length;
  const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Deterministic sparklines (seeded from actual values)
  const completedSpark = useMemo(() => {
    const base = Math.max(completed, 1);
    return [base * 0.5, base * 0.65, base * 0.55, base * 0.75, base * 0.7, base * 0.85, base].map(Math.round);
  }, [completed]);

  const activeSpark = useMemo(() => {
    const base = Math.max(active, 1);
    return [base * 0.7, base * 0.8, base * 1.1, base * 0.9, base * 1.0, base * 0.95, base].map(Math.round);
  }, [active]);

  const membersSpark = useMemo(() => {
    const base = Math.max(members, 1);
    return [base * 0.8, base * 0.9, base, base, base * 1.1, base * 1.0, base].map(Math.round);
  }, [members]);

  const prodSpark = useMemo(() => {
    const base = Math.max(productivity, 5);
    return [base * 0.6, base * 0.7, base * 0.75, base * 0.85, base * 0.9, base * 0.95, base].map(Math.round);
  }, [productivity]);

  const donutSlices: { name: string; value: number; color: string }[] = [
    { name: "To Do",       value: data.tasksByStatus.TODO ?? 0,        color: "#166534" },
    { name: "In Progress", value: data.tasksByStatus.IN_PROGRESS ?? 0, color: "#16A34A" },
    { name: "In Review",   value: data.tasksByStatus.IN_REVIEW ?? 0,   color: "#22C55E" },
    { name: "Done",        value: data.tasksByStatus.DONE ?? 0,        color: "#4ADE80" },
  ];

  const todayLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6" style={{ background: BG }}>
      {/* ── Page header ── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Welcome back, {user?.name?.split(" ")[0] ?? "there"}! Here's what's happening with your projects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs text-slate-400 transition-colors hover:text-slate-200"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: SURFACE }}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {todayLabel}
          </button>
          <button
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-black transition-all hover:opacity-90 active:scale-95"
            style={{ background: PRIMARY }}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Task
          </button>
          <button className="rounded-lg p-2 text-slate-600 transition-colors hover:text-slate-400" style={{ background: SURFACE }}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.2" />
              <circle cx="12" cy="12" r="1.2" />
              <circle cx="12" cy="19" r="1.2" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Metric grid ── */}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Tasks Completed"
          value={completed}
          delta={12}
          sparkData={completedSpark}
          icon={<svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="8 12 11 15 16 9" /></svg>}
        />
        <MetricCard
          label="Active Tasks"
          value={active}
          delta={8}
          sparkData={activeSpark}
          icon={<svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="3" width="7" height="10" rx="1" /></svg>}
        />
        <MetricCard
          label="Team Members"
          value={members || data.tasksByAssignee.length || 1}
          delta={2}
          sparkData={membersSpark}
          icon={<svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
        />
        <MetricCard
          label="Productivity Score"
          value={productivity}
          unit="%"
          delta={5}
          sparkData={prodSpark}
          icon={<svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>}
        />
      </div>

      {/* ── Middle row ── */}
      <div className="mb-5 grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7">
          <ActivityChartSection completed={completed} />
        </div>
        <div className="col-span-12 lg:col-span-5">
          <DonutChartSection slices={donutSlices} total={total} />
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="mb-5 grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7">
          <RecentTasksTable data={data} onViewAll={() => navigate(`/app/workspaces/${workspaceId}/list`)} />
        </div>
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
          <TopProjects data={data} />
          <ActivityFeed data={data} />
        </div>
      </div>

      {/* ── Upcoming deadlines strip ── */}
      <div
        className="rounded-2xl border p-4"
        style={{ background: SURFACE, borderColor: BORDER }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-400 mr-3">
            <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="font-medium text-slate-300">Upcoming Deadlines</span>
          </div>
          {[
            { label: "API Integration",      due: "Due in 2 days", color: "text-amber-400" },
            { label: "Client Meeting Prep",  due: "Due in 3 days", color: "text-sky-400" },
            { label: "Fix Validation Bug",   due: "Due in 5 days", color: "text-slate-400" },
          ].map((d) => (
            <div key={d.label} className="flex items-center gap-2 rounded-lg border px-3 py-1.5" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <svg className="h-3.5 w-3.5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="text-xs font-medium text-slate-300">{d.label}</span>
              <span className={`text-xs ${d.color}`}>{d.due}</span>
            </div>
          ))}
          <button
            onClick={() => navigate(`/app/workspaces/${workspaceId}/calendar`)}
            className="ml-auto rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:text-emerald-400"
            style={{ borderColor: "rgba(255,255,255,0.08)", color: PRIMARY }}
          >
            View Calendar →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data, isPending, isError, refetch } = useWorkspaceAnalytics(workspaceId!);

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ background: BG }}>
      {/* Minimal top bar */}
      <div
        className="flex shrink-0 items-center border-b px-6 py-3"
        style={{ borderColor: "rgba(34,197,94,0.08)", background: BG }}
      >
        <h1 className="text-sm font-semibold text-white">Analytics</h1>
        {data && (
          <span className="ml-2 text-xs text-slate-600">
            · {data.totalTasks} tasks
          </span>
        )}
      </div>

      {isPending && <DashboardSkeleton />}

      {isError && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <p className="text-sm text-slate-400">Failed to load analytics.</p>
          <button
            onClick={() => void refetch()}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-black"
            style={{ background: PRIMARY }}
          >
            Retry
          </button>
        </div>
      )}

      {data && <DashboardContent data={data} workspaceId={workspaceId!} />}
    </div>
  );
}
