import { useSearchParams } from "react-router-dom";
import type { TaskFilters, TaskStatus, Priority } from "../../../lib/types";

const VALID_STATUSES = new Set(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]);
const VALID_PRIORITIES = new Set(["LOW", "MEDIUM", "HIGH", "URGENT"]);

function normalizeFilters(params: URLSearchParams): TaskFilters {
  const status = params.get("status");
  const priority = params.get("priority");
  return {
    status: status && VALID_STATUSES.has(status) ? (status as TaskStatus) : undefined,
    priority: priority && VALID_PRIORITIES.has(priority) ? (priority as Priority) : undefined,
    assigneeId: params.get("assigneeId") ?? undefined,
    epicId: params.get("epicId") ?? undefined,
    search: params.get("search") ?? undefined,
  };
}

export function useTaskFilters() {
  const [params, setParams] = useSearchParams();
  const filters = normalizeFilters(params);

  function setFilter<K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, String(value));
      } else {
        next.delete(key);
      }
      return next;
    });
  }

  function clearFilters() {
    setParams({});
  }

  const hasActiveFilters =
    !!filters.status ||
    !!filters.priority ||
    !!filters.assigneeId ||
    !!filters.epicId ||
    !!filters.search;

  return { filters, setFilter, clearFilters, hasActiveFilters };
}
