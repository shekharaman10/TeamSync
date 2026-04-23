import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import type { EventDropArg, EventClickArg } from "@fullcalendar/core";
import { GripVertical, CalendarDays } from "lucide-react";
import { useBoardTasks, useUpdateTask } from "../tasks/api";
import { ProjectSelector, useSelectedProjectId } from "../projects/components/ProjectSelector";
import { EmptyState } from "../../components/ui/EmptyState";
import { TaskDetailDrawer } from "../tasks/components/TaskDetailDrawer";
import type { Task, TaskStatus, Priority } from "../../lib/types";

// ── Status / priority config ──────────────────────────────────────────────────
const STATUS_COLOR: Record<TaskStatus, string> = {
  BACKLOG:     "#52525b",
  TODO:        "#8b5cf6",
  IN_PROGRESS: "#f59e0b",
  IN_REVIEW:   "#0ea5e9",
  DONE:        "#10b981",
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  BACKLOG:     "Backlog",
  TODO:        "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW:   "In Review",
  DONE:        "Done",
};

// Tailwind equivalents for use inside React JSX
const PRIORITY_DOT_CLS: Record<Priority, string> = {
  LOW:    "bg-zinc-600",
  MEDIUM: "bg-sky-500",
  HIGH:   "bg-amber-500",
  URGENT: "bg-red-500",
};

const STATUS_BADGE: Record<TaskStatus, { bg: string; text: string }> = {
  BACKLOG:     { bg: "bg-zinc-600/20",    text: "text-zinc-400"   },
  TODO:        { bg: "bg-violet-500/20",  text: "text-violet-400" },
  IN_PROGRESS: { bg: "bg-amber-500/20",   text: "text-amber-400"  },
  IN_REVIEW:   { bg: "bg-sky-500/20",     text: "text-sky-400"    },
  DONE:        { bg: "bg-emerald-500/20", text: "text-emerald-400"},
};

// ── Avatar helpers ────────────────────────────────────────────────────────────
const AVATAR_PALETTE_CLS = [
  "bg-emerald-900", "bg-violet-900", "bg-sky-900",
  "bg-amber-900",   "bg-pink-900",   "bg-teal-900",
];
function avatarCls(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0x7fffffff;
  return AVATAR_PALETTE_CLS[h % AVATAR_PALETTE_CLS.length];
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── FullCalendar dark-theme CSS overrides ─────────────────────────────────────
const FC_STYLES = `
  .fc-teamsync {
    --fc-border-color: rgba(255,255,255,0.06);
    --fc-page-bg-color: transparent;
    --fc-neutral-bg-color: rgba(255,255,255,0.02);
    --fc-neutral-text-color: #a1a1aa;
    --fc-today-bg-color: rgba(16,185,129,0.05);
    --fc-now-indicator-color: #10b981;
    --fc-event-border-color: transparent;
    --fc-list-event-hover-bg-color: rgba(255,255,255,0.04);
    color: #e4e4e7;
    font-family: inherit;
  }
  .fc-teamsync .fc-toolbar-title { font-size: 0.875rem; font-weight: 700; color: #fff; }
  .fc-teamsync .fc-button {
    background: rgba(255,255,255,0.04) !important;
    border: 1px solid rgba(255,255,255,0.08) !important;
    color: #a1a1aa !important;
    font-size: 0.75rem !important;
    padding: 0.25rem 0.625rem !important;
    border-radius: 0.5rem !important;
    box-shadow: none !important;
    text-transform: capitalize !important;
  }
  .fc-teamsync .fc-button:hover {
    background: rgba(255,255,255,0.08) !important;
    color: #e4e4e7 !important;
  }
  .fc-teamsync .fc-button-active,
  .fc-teamsync .fc-button-primary:not(:disabled).fc-button-active {
    background: rgba(16,185,129,0.15) !important;
    border-color: rgba(16,185,129,0.3) !important;
    color: #6ee7b7 !important;
  }
  .fc-teamsync .fc-col-header-cell {
    background: rgba(255,255,255,0.02);
    border-color: rgba(255,255,255,0.06) !important;
    padding: 0.375rem 0;
  }
  .fc-teamsync .fc-col-header-cell-cushion {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #71717a;
    text-decoration: none !important;
  }
  .fc-teamsync .fc-daygrid-day-number {
    font-size: 0.6875rem;
    font-weight: 600;
    color: #71717a;
    text-decoration: none !important;
    padding: 4px 6px;
  }
  .fc-teamsync .fc-day-today .fc-daygrid-day-number {
    background: #10b981;
    color: #000;
    border-radius: 50%;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 3px;
    padding: 0;
  }
  .fc-teamsync .fc-daygrid-day.fc-day-other { background: rgba(0,0,0,0.2); }
  .fc-teamsync .fc-daygrid-day.fc-day-today { background: rgba(16,185,129,0.04) !important; }
  .fc-teamsync .fc-event {
    border-radius: 4px !important;
    border: none !important;
    font-size: 0.6875rem !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    padding: 1px 5px !important;
  }
  .fc-teamsync .fc-event-title { font-weight: 500; }
  .fc-teamsync .fc-daygrid-more-link {
    font-size: 0.625rem;
    color: #52525b;
    font-weight: 600;
  }
  .fc-teamsync .fc-list-day-cushion {
    background: rgba(255,255,255,0.02) !important;
    font-size: 0.75rem;
    color: #a1a1aa;
  }
  .fc-teamsync .fc-list-event-title a { color: #e4e4e7 !important; text-decoration: none !important; }
  .fc-teamsync .fc-list-event td { border-color: rgba(255,255,255,0.04) !important; }
  .fc-teamsync .fc-timegrid-slot { border-color: rgba(255,255,255,0.04) !important; }
  .fc-teamsync .fc-timegrid-slot-label { font-size: 0.625rem; color: #52525b; }
  .fc-teamsync table { border-color: rgba(255,255,255,0.06) !important; }
  .fc-teamsync .fc-scrollgrid { border-color: rgba(255,255,255,0.06) !important; }
  .fc-teamsync .fc-scrollgrid td, .fc-teamsync .fc-scrollgrid th {
    border-color: rgba(255,255,255,0.06) !important;
  }
  .fc-teamsync .fc-toolbar.fc-header-toolbar { display: none; }
  /* External drag ghost */
  .fc-event-mirror { opacity: 0.7 !important; }
`;

// ── Unscheduled item ──────────────────────────────────────────────────────────
function UnscheduledItem({ task }: { task: Task }) {
  const color  = STATUS_COLOR[task.status];
  const badge  = STATUS_BADGE[task.status];
  const dotCls = PRIORITY_DOT_CLS[task.priority];

  return (
    <div
      className="fc-external-event group flex cursor-grab items-center gap-2 rounded-lg border border-white/6 bg-white/2 px-3 py-2 transition-colors hover:border-white/10 hover:bg-white/4 active:cursor-grabbing"
      data-task-id={task.id}
      data-event={JSON.stringify({
        title: task.title,
        backgroundColor: color,
        borderColor: "transparent",
        textColor: "#fff",
        extendedProps: { taskId: task.id },
      })}
    >
      <GripVertical size={12} className="shrink-0 text-zinc-700 group-hover:text-zinc-600" />
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotCls}`} />
      <span className="flex-1 truncate text-[11px] font-medium text-zinc-300">{task.title}</span>
      {task.assignee && (
        <div
          title={task.assignee.name}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white ${avatarCls(task.assignee.id)}`}
        >
          {initials(task.assignee.name)}
        </div>
      )}
      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${badge.bg} ${badge.text}`}>
        {STATUS_LABEL[task.status]}
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function CalendarPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const projectId = useSelectedProjectId(workspaceId!);

  const calendarRef   = useRef<FullCalendar>(null);
  const panelRef      = useRef<HTMLDivElement>(null);
  const draggableRef  = useRef<Draggable | null>(null);

  const [view, setView]           = useState<"dayGridMonth" | "timeGridWeek" | "listWeek">("dayGridMonth");
  const [titleLabel, setTitleLabel] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "ALL">("ALL");

  const { data: tasks = [], isPending } = useBoardTasks(projectId ?? "");
  const updateTask = useUpdateTask(projectId ?? "");

  // Split tasks: scheduled vs unscheduled
  const { scheduled, unscheduled } = useMemo(() => {
    const filtered = filterStatus === "ALL" ? tasks : tasks.filter((t) => t.status === filterStatus);
    const scheduled: Task[]   = [];
    const unscheduled: Task[] = [];
    for (const t of filtered) {
      if (t.dueDate) scheduled.push(t);
      else unscheduled.push(t);
    }
    return { scheduled, unscheduled };
  }, [tasks, filterStatus]);

  // Convert tasks → FullCalendar event objects
  const events = useMemo(
    () =>
      scheduled.map((t) => {
        const color = STATUS_COLOR[t.status];
        // end is exclusive in FullCalendar — add 1 day so it renders on the correct cell
        const start = t.dueDate!.slice(0, 10);
        const end   = (() => {
          const d = new Date(start);
          d.setDate(d.getDate() + 1);
          return d.toISOString().slice(0, 10);
        })();
        return {
          id:              t.id,
          title:           t.title,
          start,
          end,
          backgroundColor: color,
          borderColor:     "transparent",
          textColor:       "#fff",
          extendedProps:   { taskId: t.id, status: t.status, priority: t.priority },
        };
      }),
    [scheduled],
  );

  // Init external draggable on unscheduled panel
  useEffect(() => {
    if (!panelRef.current) return;
    draggableRef.current?.destroy();
    draggableRef.current = new Draggable(panelRef.current, {
      itemSelector:  ".fc-external-event",
      eventData(el) {
        const raw = el.getAttribute("data-event");
        return raw ? JSON.parse(raw) : {};
      },
    });
    return () => { draggableRef.current?.destroy(); };
  }, [projectId]);

  // Sync title label after navigation
  function syncTitle() {
    const api = calendarRef.current?.getApi();
    if (api) setTitleLabel(api.view.title);
  }

  function switchView(v: typeof view) {
    setView(v);
    calendarRef.current?.getApi().changeView(v);
    setTimeout(syncTitle, 0);
  }
  function prev()  { calendarRef.current?.getApi().prev();  syncTitle(); }
  function next()  { calendarRef.current?.getApi().next();  syncTitle(); }
  function today() { calendarRef.current?.getApi().today(); syncTitle(); }

  // Drop from unscheduled panel
  function handleExternalDrop(info: { dateStr: string; draggedEl: HTMLElement }) {
    const taskId = info.draggedEl.getAttribute("data-task-id");
    if (!taskId || !projectId) return;
    updateTask.mutate({ taskId, dueDate: new Date(info.dateStr).toISOString() });
  }

  // Drag existing event to new date
  function handleEventDrop(info: EventDropArg) {
    const taskId = info.event.extendedProps.taskId as string;
    if (!taskId || !projectId) return;
    updateTask.mutate({ taskId, dueDate: new Date(info.event.startStr.slice(0, 10)).toISOString() });
  }

  // Click event → open detail drawer
  function handleEventClick(info: EventClickArg) {
    const taskId = info.event.extendedProps.taskId as string;
    if (taskId) setSelectedTaskId(taskId);
  }

  const VIEW_LABELS: Record<typeof view, string> = {
    dayGridMonth: "Month",
    timeGridWeek: "Week",
    listWeek:     "Agenda",
  };

  return (
    <>
      <style>{FC_STYLES}</style>

      <div className="flex h-full flex-col overflow-hidden bg-[#0b0f0c]">
        {/* ── Header ── */}
        <div className="flex shrink-0 items-center gap-3 border-b border-white/5 px-6 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <CalendarDays size={15} className="shrink-0 text-emerald-500" />
            <h1 className="truncate text-sm font-bold text-white">{titleLabel || "Calendar"}</h1>
          </div>

          <ProjectSelector workspaceId={workspaceId!} />

          {/* Status filter */}
          <select
            aria-label="Filter by status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TaskStatus | "ALL")}
            className="rounded-lg border border-white/8 bg-transparent px-2 py-1.5 text-xs text-zinc-400 outline-none focus:border-emerald-500/40"
          >
            <option value="ALL">All statuses</option>
            {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>

          {/* View switcher */}
          <div className="flex items-center gap-0.5 rounded-xl border border-white/7 bg-white/2 p-1">
            {(["dayGridMonth", "timeGridWeek", "listWeek"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => switchView(v)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                  view === v
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "text-zinc-600 hover:text-zinc-300"
                }`}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>

          {/* Nav */}
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={today}
              className="rounded-lg border border-white/8 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all hover:border-emerald-500/30 hover:text-zinc-200"
            >
              Today
            </button>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous"
              className="rounded-lg border border-white/8 p-1.5 text-zinc-500 transition-all hover:border-white/15 hover:text-zinc-300"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next"
              className="rounded-lg border border-white/8 p-1.5 text-zinc-500 transition-all hover:border-white/15 hover:text-zinc-300"
            >
              ›
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        {!projectId ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              title="No project selected"
              description="Select a project to view the calendar."
            />
          </div>
        ) : (
          <div className="flex flex-1 min-h-0 gap-0">
            {/* Calendar */}
            <div className="fc-teamsync flex-1 min-w-0 overflow-hidden p-4">
              {isPending ? (
                <div className="flex h-full items-center justify-center">
                  <span className="text-xs text-zinc-600">Loading…</span>
                </div>
              ) : (
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={false}
                  height="100%"
                  editable
                  droppable
                  dayMaxEvents={3}
                  events={events}
                  eventDrop={handleEventDrop}
                  drop={handleExternalDrop}
                  eventClick={handleEventClick}
                  datesSet={syncTitle}
                  eventContent={(arg) => (
                    <div className="flex items-center gap-1 px-1 overflow-hidden w-full">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT_CLS[arg.event.extendedProps.priority as Priority] ?? "bg-sky-500"}`}
                      />
                      <span className="truncate text-[11px] font-medium leading-tight">
                        {arg.event.title}
                      </span>
                    </div>
                  )}
                />
              )}
            </div>

            {/* Unscheduled panel */}
            <div className="flex w-72 shrink-0 flex-col border-l border-white/5">
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-white">Unscheduled work</p>
                  <p className="text-[10px] text-zinc-600">
                    Drag onto the calendar to set a due date.
                  </p>
                </div>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
                  {unscheduled.length}
                </span>
              </div>

              {/* Search placeholder */}
              <div className="border-b border-white/5 px-3 py-2">
                <input
                  type="text"
                  placeholder="Search unscheduled items"
                  className="w-full rounded-lg border border-white/6 bg-white/[0.03] px-3 py-1.5 text-[11px] text-zinc-400 outline-none placeholder:text-zinc-700 focus:border-emerald-500/30"
                  readOnly
                />
              </div>

              {/* Items */}
              <div ref={panelRef} className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {unscheduled.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <CalendarDays size={20} className="text-zinc-800" />
                    <p className="text-[11px] text-zinc-600">All tasks have due dates</p>
                  </div>
                ) : (
                  unscheduled.map((t) => <UnscheduledItem key={t.id} task={t} />)
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task detail drawer */}
      {selectedTaskId && (
        <TaskDetailDrawer
          taskId={selectedTaskId}
          projectId={projectId ?? ""}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </>
  );
}
