import { useState } from "react";
import { MOCK_TASKS, type Status, type Priority } from "../board/mockData";

const TAG_COLORS: Record<string, string> = {
  Auth:     "bg-violet-500/15 text-violet-300",
  Backend:  "bg-sky-500/15 text-sky-300",
  Frontend: "bg-teal-500/15 text-teal-300",
  DevOps:   "bg-orange-500/15 text-orange-300",
  Design:   "bg-pink-500/15 text-pink-300",
  Docs:     "bg-zinc-500/15 text-zinc-400",
  Billing:  "bg-emerald-500/15 text-emerald-300",
  DB:       "bg-amber-500/15 text-amber-300",
  QA:       "bg-rose-500/15 text-rose-300",
};
const DEFAULT_TAG = "bg-zinc-500/15 text-zinc-400";

const STATUS_BADGE: Record<Status, string> = {
  TODO:        "bg-zinc-700/60 text-zinc-400",
  IN_PROGRESS: "bg-sky-500/15 text-sky-300",
  IN_REVIEW:   "bg-amber-500/15 text-amber-300",
  DONE:        "bg-emerald-500/15 text-emerald-300",
};
const STATUS_LABEL: Record<Status, string> = {
  TODO: "To Do", IN_PROGRESS: "In Progress", IN_REVIEW: "In Review", DONE: "Done",
};

const PRIORITY_DOT: Record<Priority, string> = {
  low: "bg-zinc-400", medium: "bg-sky-400", high: "bg-amber-400", urgent: "bg-red-400",
};
const PRIORITY_COLOR: Record<Priority, string> = {
  low: "text-zinc-400", medium: "text-sky-400", high: "text-amber-400", urgent: "text-red-400",
};

const ALL = "ALL";

export function BacklogPage() {
  const [statusFilter, setStatusFilter] = useState<Status | typeof ALL>(ALL);
  const [priorityFilter, setPriorityFilter] = useState<Priority | typeof ALL>(ALL);
  const [assigneeFilter, setAssigneeFilter] = useState<string>(ALL);
  const [search, setSearch] = useState("");

  const assignees = [...new Set(MOCK_TASKS.map((t) => t.assignee))];

  const filtered = MOCK_TASKS.filter((t) => {
    if (statusFilter !== ALL && t.status !== statusFilter) return false;
    if (priorityFilter !== ALL && t.priority !== priorityFilter) return false;
    if (assigneeFilter !== ALL && t.assignee !== assigneeFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-4">
        <div>
          <h1 className="text-base font-semibold text-white">Backlog</h1>
          <p className="text-xs text-zinc-500">{MOCK_TASKS.length} tasks total</p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-teal-400 px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-teal-300"
        >
          + Add task
        </button>
      </div>

      {/* Filters */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/5 px-6 py-3">
        <input
          type="text"
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 rounded-lg border border-white/8 bg-white/5 px-3 text-xs text-white placeholder-zinc-600 focus:border-teal-500/40 focus:outline-none"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Status | typeof ALL)}
          className="h-7 rounded-lg border border-white/8 bg-zinc-900 px-2 text-xs text-zinc-300 focus:outline-none"
        >
          <option value={ALL}>All status</option>
          {(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as Status[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as Priority | typeof ALL)}
          className="h-7 rounded-lg border border-white/8 bg-zinc-900 px-2 text-xs text-zinc-300 focus:outline-none"
        >
          <option value={ALL}>All priority</option>
          {(["urgent", "high", "medium", "low"] as Priority[]).map((p) => (
            <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>

        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="h-7 rounded-lg border border-white/8 bg-zinc-900 px-2 text-xs text-zinc-300 focus:outline-none"
        >
          <option value={ALL}>All assignees</option>
          {assignees.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        {(statusFilter !== ALL || priorityFilter !== ALL || assigneeFilter !== ALL || search) && (
          <button
            type="button"
            onClick={() => { setStatusFilter(ALL); setPriorityFilter(ALL); setAssigneeFilter(ALL); setSearch(""); }}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm">
            <tr className="border-b border-white/5 text-left">
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Task</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Priority</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Tags</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Assignee</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((task) => (
              <tr
                key={task.id}
                className="group cursor-pointer border-b border-white/5 transition-colors hover:bg-white/[0.03]"
              >
                <td className="px-6 py-3.5">
                  <span className="font-medium text-zinc-200">{task.title}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_BADGE[task.status]}`}>
                    {STATUS_LABEL[task.status]}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${PRIORITY_COLOR[task.priority]}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                    <span className="capitalize">{task.priority}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {task.tags.map((tag) => (
                      <span key={tag} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TAG_COLORS[tag] ?? DEFAULT_TAG}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/20 text-[10px] font-bold text-teal-300">
                    {task.assignee}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-sm text-zinc-600">
                  No tasks match the current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
