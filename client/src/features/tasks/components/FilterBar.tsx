import { useState, useEffect } from "react";
import type { TaskStatus, Priority, WorkspaceMember, Epic } from "../../../lib/types";
import type { useTaskFilters } from "../hooks/useTaskFilters";

type FilterBarProps = {
  filters: ReturnType<typeof useTaskFilters>["filters"];
  setFilter: ReturnType<typeof useTaskFilters>["setFilter"];
  clearFilters: () => void;
  hasActiveFilters: boolean;
  members?: WorkspaceMember[];
  epics?: Epic[];
};

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "BACKLOG",     label: "Backlog" },
  { value: "TODO",        label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW",   label: "In Review" },
  { value: "DONE",        label: "Done" },
];

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "URGENT", label: "Urgent" },
  { value: "HIGH",   label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW",    label: "Low" },
];

export function FilterBar({
  filters,
  setFilter,
  clearFilters,
  hasActiveFilters,
  members = [],
  epics = [],
}: FilterBarProps) {
  const [searchDraft, setSearchDraft] = useState(filters.search ?? "");

  // Debounce search: write to URL 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilter("search", searchDraft || undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchDraft, setFilter]);

  // Keep draft in sync when filter is cleared externally
  useEffect(() => {
    if (!filters.search) setSearchDraft("");
  }, [filters.search]);

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/5 px-6 py-3">
      <input
        type="text"
        placeholder="Search tasks…"
        value={searchDraft}
        onChange={(e) => setSearchDraft(e.target.value)}
        aria-label="Search tasks"
        className="h-7 rounded-lg border border-white/8 bg-white/5 px-3 text-xs text-white placeholder-zinc-600 focus:border-teal-500/40 focus:outline-none"
      />

      <select
        aria-label="Filter by status"
        value={filters.status ?? ""}
        onChange={(e) => setFilter("status", (e.target.value as TaskStatus) || undefined)}
        className="h-7 rounded-lg border border-white/8 bg-zinc-900 px-2 text-xs text-zinc-300 focus:outline-none"
      >
        <option value="">All status</option>
        {STATUSES.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      <select
        aria-label="Filter by priority"
        value={filters.priority ?? ""}
        onChange={(e) => setFilter("priority", (e.target.value as Priority) || undefined)}
        className="h-7 rounded-lg border border-white/8 bg-zinc-900 px-2 text-xs text-zinc-300 focus:outline-none"
      >
        <option value="">All priority</option>
        {PRIORITIES.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      {members.length > 0 && (
        <select
          aria-label="Filter by assignee"
          value={filters.assigneeId ?? ""}
          onChange={(e) => setFilter("assigneeId", e.target.value || undefined)}
          className="h-7 rounded-lg border border-white/8 bg-zinc-900 px-2 text-xs text-zinc-300 focus:outline-none"
        >
          <option value="">All assignees</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>{m.user.name}</option>
          ))}
        </select>
      )}

      {epics.length > 0 && (
        <select
          aria-label="Filter by epic"
          value={filters.epicId ?? ""}
          onChange={(e) => setFilter("epicId", e.target.value || undefined)}
          className="h-7 rounded-lg border border-white/8 bg-zinc-900 px-2 text-xs text-zinc-300 focus:outline-none"
        >
          <option value="">All epics</option>
          {epics.map((e) => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>
      )}

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="text-xs text-zinc-500 hover:text-zinc-300"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
