import { MOCK_TASKS, MOCK_MEMBERS, type Status, type Priority } from "../board/mockData";

const STATUS_LABEL: Record<Status, string> = {
  TODO: "To Do", IN_PROGRESS: "In Progress", IN_REVIEW: "In Review", DONE: "Done",
};
const STATUS_BAR: Record<Status, string> = {
  TODO: "bg-zinc-500", IN_PROGRESS: "bg-sky-400", IN_REVIEW: "bg-amber-400", DONE: "bg-teal-400",
};
const STATUS_TEXT: Record<Status, string> = {
  TODO: "text-zinc-400", IN_PROGRESS: "text-sky-400", IN_REVIEW: "text-amber-400", DONE: "text-teal-400",
};

const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: "Urgent", high: "High", medium: "Medium", low: "Low",
};
const PRIORITY_BAR: Record<Priority, string> = {
  urgent: "bg-red-400", high: "bg-amber-400", medium: "bg-sky-400", low: "bg-zinc-500",
};
const PRIORITY_TEXT: Record<Priority, string> = {
  urgent: "text-red-400", high: "text-amber-400", medium: "text-sky-400", low: "text-zinc-400",
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
      <div className="flex-1 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`w-6 text-right text-xs font-semibold ${textClass}`}>{count}</span>
    </div>
  );
}

export function AnalyticsPage() {
  const total = MOCK_TASKS.length;
  const done = MOCK_TASKS.filter((t) => t.status === "DONE").length;
  const inProgress = MOCK_TASKS.filter((t) => t.status === "IN_PROGRESS").length;
  const inReview = MOCK_TASKS.filter((t) => t.status === "IN_REVIEW").length;
  const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;

  const statusCounts = (["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as Status[]).map((s) => ({
    status: s,
    count: MOCK_TASKS.filter((t) => t.status === s).length,
  }));

  const priorityCounts = (["urgent", "high", "medium", "low"] as Priority[]).map((p) => ({
    priority: p,
    count: MOCK_TASKS.filter((t) => t.priority === p).length,
  }));

  const assigneeCounts = MOCK_MEMBERS.map((m) => ({
    member: m,
    total: MOCK_TASKS.filter((t) => t.assignee === m.initials).length,
    done: MOCK_TASKS.filter((t) => t.assignee === m.initials && t.status === "DONE").length,
  }));

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-4">
        <div>
          <h1 className="text-base font-semibold text-white">Analytics</h1>
          <p className="text-xs text-zinc-500">Sprint 1 · {total} tasks</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Stat cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total tasks"  value={total}      sub="across all columns"      accent="text-white" />
          <StatCard label="Completed"    value={done}       sub={`${completionPct}% of sprint`} accent="text-teal-400" />
          <StatCard label="In progress"  value={inProgress} sub="currently active"         accent="text-sky-400" />
          <StatCard label="In review"    value={inReview}   sub="awaiting sign-off"        accent="text-amber-400" />
        </div>

        {/* Sprint progress */}
        <div className="mb-6 rounded-xl border border-white/5 bg-zinc-800/40 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Sprint progress</h2>
            <span className="text-sm font-bold text-teal-400">{completionPct}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-teal-400 transition-all duration-700"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <div className="mt-3 flex gap-4">
            {statusCounts.map(({ status, count }) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_BAR[status]}`} />
                <span className={`text-xs ${STATUS_TEXT[status]}`}>{STATUS_LABEL[status]} ({count})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* By status */}
          <div className="rounded-xl border border-white/5 bg-zinc-800/40 p-5">
            <h2 className="mb-4 text-sm font-semibold text-white">By status</h2>
            <div className="space-y-3">
              {statusCounts.map(({ status, count }) => (
                <BarRow
                  key={status}
                  label={STATUS_LABEL[status]}
                  count={count}
                  max={total}
                  barClass={STATUS_BAR[status]}
                  textClass={STATUS_TEXT[status]}
                />
              ))}
            </div>
          </div>

          {/* By priority */}
          <div className="rounded-xl border border-white/5 bg-zinc-800/40 p-5">
            <h2 className="mb-4 text-sm font-semibold text-white">By priority</h2>
            <div className="space-y-3">
              {priorityCounts.map(({ priority, count }) => (
                <BarRow
                  key={priority}
                  label={PRIORITY_LABEL[priority]}
                  count={count}
                  max={total}
                  barClass={PRIORITY_BAR[priority]}
                  textClass={PRIORITY_TEXT[priority]}
                />
              ))}
            </div>
          </div>

          {/* By assignee */}
          <div className="rounded-xl border border-white/5 bg-zinc-800/40 p-5 lg:col-span-2">
            <h2 className="mb-4 text-sm font-semibold text-white">By assignee</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {assigneeCounts.map(({ member, total: t, done: d }) => {
                const pct = t > 0 ? Math.round((d / t) * 100) : 0;
                return (
                  <div key={member.id} className="rounded-lg border border-white/5 bg-zinc-900/60 p-4">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${member.color}`}>
                        {member.initials}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-200">{member.name}</p>
                        <p className="text-[10px] text-zinc-600">{t} tasks</p>
                      </div>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div className="h-full rounded-full bg-teal-400 transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1.5 text-[10px] text-zinc-500">{d} done · {pct}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
