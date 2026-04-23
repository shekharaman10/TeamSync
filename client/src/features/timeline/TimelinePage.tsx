import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useInfiniteTasks } from "../tasks/api";
import { useTaskFilters } from "../tasks/hooks/useTaskFilters";
import { ProjectSelector, useSelectedProjectId } from "../projects/components/ProjectSelector";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import type { Task, TaskStatus } from "../../lib/types";

const STATUS_BAR: Record<TaskStatus, string> = {
  BACKLOG:     "bg-zinc-700",
  TODO:        "bg-violet-500",
  IN_PROGRESS: "bg-amber-500",
  IN_REVIEW:   "bg-pink-500",
  DONE:        "bg-emerald-500",
};

const DAY_PX = 28; // pixels per day cell

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  r.setDate(r.getDate() - r.getDay());
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function formatMonth(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function formatDay(d: Date): string {
  return d.toLocaleDateString(undefined, { day: "numeric" });
}

const TOTAL_DAYS = 42; // 6 weeks visible at a time

export function TimelinePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const projectId = useSelectedProjectId(workspaceId!);
  const { filters } = useTaskFilters();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [windowStart, setWindowStart] = useState(() => startOfWeek(today));

  const windowEnd = useMemo(() => addDays(windowStart, TOTAL_DAYS - 1), [windowStart]);

  const { data, isPending, isError } = useInfiniteTasks(projectId ?? "", filters);

  const tasks = useMemo(
    () => data?.pages.flatMap((p) => p.tasks) ?? [],
    [data],
  );

  const tasksWithDates = useMemo(
    () => tasks.filter((t): t is Task & { dueDate: string } => !!t.dueDate),
    [tasks],
  );

  const days = useMemo(
    () => Array.from({ length: TOTAL_DAYS }, (_, i) => addDays(windowStart, i)),
    [windowStart],
  );

  function prevWindow() { setWindowStart((d) => addDays(d, -TOTAL_DAYS)); }
  function nextWindow() { setWindowStart((d) => addDays(d, TOTAL_DAYS)); }
  function goToday()    { setWindowStart(startOfWeek(today)); }

  const todayOffset = daysBetween(windowStart, today);
  const todayInView = todayOffset >= 0 && todayOffset < TOTAL_DAYS;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-white/5 px-6 py-4">
        <div>
          <h1 className="text-base font-semibold text-white">Timeline</h1>
          <p className="text-xs text-zinc-500">
            {formatMonth(windowStart)} — {formatMonth(windowEnd)}
          </p>
        </div>
        <ProjectSelector workspaceId={workspaceId!} />
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={goToday}
            className="rounded-lg border border-white/8 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-emerald-500/30 hover:text-zinc-200"
          >
            Today
          </button>
          <button type="button" onClick={prevWindow}
            className="rounded-lg border border-white/8 p-1.5 text-zinc-400 transition-colors hover:text-zinc-200"
          >
            <ChevronLeft size={14} />
          </button>
          <button type="button" onClick={nextWindow}
            className="rounded-lg border border-white/8 p-1.5 text-zinc-400 transition-colors hover:text-zinc-200"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {!projectId ? (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState title="No project selected" description="Select a project to view its timeline." />
        </div>
      ) : (
        <div className="flex flex-1 overflow-auto">
          {/* Task name column */}
          <div className="sticky left-0 z-20 flex w-52 shrink-0 flex-col border-r border-white/5 bg-[#0b0f0c]">
            {/* Header spacer */}
            <div className="h-10 border-b border-white/5" />
            {isPending && (
              <div className="space-y-1 p-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 rounded" />)}
              </div>
            )}
            {!isPending && tasksWithDates.map((task) => (
              <div
                key={task.id}
                className="flex h-9 items-center border-b border-white/4 px-4"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_BAR[task.status]}`} />
                  <span className="truncate text-xs text-zinc-300">{task.title}</span>
                </span>
              </div>
            ))}
            {!isPending && tasksWithDates.length === 0 && (
              <div className="flex flex-1 items-center justify-center px-4 py-8 text-center">
                <p className="text-xs text-zinc-600">No tasks with due dates</p>
              </div>
            )}
          </div>

          {/* Scrollable grid */}
          <div className="relative flex-1 overflow-x-auto">
            {/* Day header */}
            <div
              className="sticky top-0 z-10 flex h-10 border-b border-white/5 bg-[#0b0f0c]"
              style={{ minWidth: TOTAL_DAYS * DAY_PX }}
            >
              {days.map((d, i) => {
                const isToday = d.toDateString() === today.toDateString();
                const isSun = d.getDay() === 0;
                return (
                  <div
                    key={i}
                    style={{ width: DAY_PX }}
                    className={[
                      "flex shrink-0 flex-col items-center justify-center border-r border-white/4 text-center",
                      isSun ? "border-l border-white/8" : "",
                    ].join(" ")}
                  >
                    {(i === 0 || isSun) && (
                      <span className="text-[8px] font-semibold text-zinc-600">
                        {d.toLocaleDateString(undefined, { month: "short" })}
                      </span>
                    )}
                    <span
                      className={[
                        "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium",
                        isToday ? "bg-emerald-500 text-black" : "text-zinc-600",
                      ].join(" ")}
                    >
                      {formatDay(d)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Task bars */}
            <div style={{ minWidth: TOTAL_DAYS * DAY_PX }}>
              {tasksWithDates.map((task) => {
                const dueDay = new Date(task.dueDate);
                dueDay.setHours(0, 0, 0, 0);
                const offset = daysBetween(windowStart, dueDay);
                const inView = offset >= 0 && offset < TOTAL_DAYS;

                return (
                  <div
                    key={task.id}
                    className="relative flex h-9 items-center border-b border-white/4"
                  >
                    {/* Weekend shading */}
                    {days.map((d, i) =>
                      d.getDay() === 0 || d.getDay() === 6 ? (
                        <div
                          key={i}
                          className="absolute top-0 h-full bg-white/1"
                          style={{ left: i * DAY_PX, width: DAY_PX }}
                        />
                      ) : null,
                    )}

                    {/* Today line */}
                    {todayInView && (
                      <div
                        className="absolute top-0 z-10 h-full w-px bg-emerald-500/50"
                        style={{ left: todayOffset * DAY_PX + DAY_PX / 2 }}
                      />
                    )}

                    {/* Task bar — spans from start of window to due date */}
                    {inView && (
                      <div
                        title={task.title}
                        className={[
                          "absolute top-1.5 flex h-6 min-w-4 cursor-pointer items-center rounded-md px-2 text-[10px] font-medium text-white/90 transition-opacity hover:opacity-80",
                          STATUS_BAR[task.status],
                        ].join(" ")}
                        style={{
                          left: Math.max(0, offset - 6) * DAY_PX,
                          width: Math.min(7, offset + 1) * DAY_PX,
                        }}
                      >
                        <span className="truncate">{task.title}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {isError && (
              <p className="px-4 py-4 text-sm text-red-400">Failed to load tasks.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
