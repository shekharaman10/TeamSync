import { useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQueryClient } from "@tanstack/react-query";
import { useBoardTasks, useUpdateTask } from "../tasks/api";
import { useWorkspaceMembers } from "../workspaces/api";
import { useEpics } from "../epics/api";
import { ProjectSelector, useSelectedProjectId } from "../projects/components/ProjectSelector";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { CreateTaskModal } from "../tasks/components/CreateTaskModal";
import { TaskDetailDrawer } from "../tasks/components/TaskDetailDrawer";
import { QK } from "../../lib/query-keys";
import { TaskCard, avatarColor } from "./TaskCard";
import type { Task, TaskStatus } from "../../lib/types";

// ── Column definitions ────────────────────────────────────────────────────────
const COLUMNS: { id: TaskStatus; label: string; dot: string; headerDot: string }[] = [
  { id: "BACKLOG",     label: "Backlog",     dot: "bg-zinc-500",    headerDot: "#71717a" },
  { id: "TODO",        label: "To Do",       dot: "bg-violet-400",  headerDot: "#a78bfa" },
  { id: "IN_PROGRESS", label: "In Progress", dot: "bg-amber-400",   headerDot: "#fbbf24" },
  { id: "IN_REVIEW",   label: "In Review",   dot: "bg-sky-400",     headerDot: "#38bdf8" },
  { id: "DONE",        label: "Done",        dot: "bg-emerald-400", headerDot: "#34d399" },
];

type TasksByColumn = Record<TaskStatus, Task[]>;

function groupByColumn(tasks: Task[]): TasksByColumn {
  const acc: TasksByColumn = { BACKLOG: [], TODO: [], IN_PROGRESS: [], IN_REVIEW: [], DONE: [] };
  tasks.forEach((t) => { acc[t.status].push(t); });
  return acc;
}

function findContainer(tasks: TasksByColumn, taskId: string): TaskStatus | undefined {
  return (Object.keys(tasks) as TaskStatus[]).find((col) =>
    tasks[col].some((t) => t.id === taskId),
  );
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── Sortable task card wrapper ─────────────────────────────────────────────────
function SortableTaskCard({ task, onOpen }: { task: Task; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-40 scale-[0.97]" : ""}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} onClick={() => onOpen(task.id)} />
    </div>
  );
}

// ── Droppable column zone ─────────────────────────────────────────────────────
function DroppableColumn({
  colId,
  children,
  isOver,
}: {
  colId: TaskStatus;
  children: React.ReactNode;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: colId });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-24 flex-col gap-2 rounded-xl p-1.5 transition-colors duration-150 ${
        isOver ? "bg-emerald-500/5 ring-1 ring-emerald-500/20" : ""
      }`}
    >
      {children}
    </div>
  );
}

// ── Column "..." menu (static, future-extensible) ─────────────────────────────
function ColMenu({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        title="Add task"
        onClick={onAdd}
        className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 transition-colors hover:bg-white/6 hover:text-zinc-300"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <button
        type="button"
        title="Column options"
        className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 transition-colors hover:bg-white/6 hover:text-zinc-300"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5"  cy="12" r="1.2" />
          <circle cx="12" cy="12" r="1.2" />
          <circle cx="19" cy="12" r="1.2" />
        </svg>
      </button>
    </div>
  );
}

// ── Main Board page ───────────────────────────────────────────────────────────
export function BoardPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const projectId = useSelectedProjectId(workspaceId!);
  const qc = useQueryClient();

  const { data: tasks, isError, refetch } = useBoardTasks(projectId ?? "");
  const { mutate: updateTask } = useUpdateTask(projectId ?? "");
  const { data: members } = useWorkspaceMembers(workspaceId!);
  const { data: epics } = useEpics(projectId ?? "");

  const [localTasks, setLocalTasks] = useState<TasksByColumn | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColId, setOverColId] = useState<TaskStatus | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null);

  const rawDisplay = localTasks ?? (tasks ? groupByColumn(tasks) : null);

  const displayTasks = useMemo<TasksByColumn | null>(() => {
    if (!rawDisplay) return null;
    const q = search.trim().toLowerCase();
    const filtered = {} as TasksByColumn;
    (Object.keys(rawDisplay) as TaskStatus[]).forEach((col) => {
      filtered[col] = rawDisplay[col].filter((t) => {
        if (q && !t.title.toLowerCase().includes(q)) return false;
        if (filterAssignee && t.assigneeId !== filterAssignee) return false;
        return true;
      });
    });
    return filtered;
  }, [rawDisplay, search, filterAssignee]);

  const totalVisible = useMemo(
    () => (displayTasks ? COLUMNS.reduce((s, c) => s + (displayTasks[c.id]?.length ?? 0), 0) : 0),
    [displayTasks],
  );
  const totalAll = tasks?.length ?? 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = useCallback(
    ({ active }: DragStartEvent) => {
      const id = String(active.id);
      if (!rawDisplay) return;
      const task = Object.values(rawDisplay).flat().find((t) => t.id === id) ?? null;
      setActiveTask(task);
      setLocalTasks(rawDisplay);
    },
    [rawDisplay],
  );

  const onDragOver = useCallback(
    ({ active, over }: DragOverEvent) => {
      if (!over || !localTasks) { setOverColId(null); return; }
      const overId = String(over.id);
      const isColumn = COLUMNS.some((c) => c.id === overId);
      const col = isColumn ? (overId as TaskStatus) : findContainer(localTasks, overId);
      setOverColId(col ?? null);

      const activeId = String(active.id);
      const sourceCol = findContainer(localTasks, activeId);
      if (!sourceCol || !col || sourceCol === col) return;

      setLocalTasks((prev) => {
        if (!prev) return prev;
        const task = prev[sourceCol].find((t) => t.id === activeId)!;
        const overIndex = prev[col].findIndex((t) => t.id === overId);
        const destItems = [...prev[col]];
        if (overIndex >= 0) {
          destItems.splice(overIndex, 0, task);
        } else {
          destItems.push(task);
        }
        return {
          ...prev,
          [sourceCol]: prev[sourceCol].filter((t) => t.id !== activeId),
          [col]: destItems,
        };
      });
    },
    [localTasks],
  );

  const onDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      setActiveTask(null);
      setOverColId(null);

      if (!over || !localTasks || !projectId) { setLocalTasks(null); return; }

      const activeId = String(active.id);
      const overId = String(over.id);
      const sourceCol = findContainer(localTasks, activeId);
      if (!sourceCol) { setLocalTasks(null); return; }

      const isOverCol = COLUMNS.some((c) => c.id === overId);
      const destCol = isOverCol ? (overId as TaskStatus) : findContainer(localTasks, overId);
      if (!destCol) { setLocalTasks(null); return; }

      if (sourceCol === destCol) {
        const isOverTask = localTasks[sourceCol].some((t) => t.id === overId);
        if (isOverTask && activeId !== overId) {
          setLocalTasks((prev) => {
            if (!prev) return prev;
            const items = prev[sourceCol];
            const oldIdx = items.findIndex((t) => t.id === activeId);
            const newIdx = items.findIndex((t) => t.id === overId);
            return { ...prev, [sourceCol]: arrayMove(items, oldIdx, newIdx) };
          });
        }
        return;
      }

      const snapshot = tasks ? groupByColumn(tasks) : null;
      updateTask(
        { taskId: activeId, status: destCol },
        {
          onError: () => { if (snapshot) setLocalTasks(snapshot); else setLocalTasks(null); },
          onSettled: () => {
            setLocalTasks(null);
            void qc.invalidateQueries({ queryKey: QK.boardTasks(projectId) });
          },
        },
      );
    },
    [localTasks, tasks, projectId, updateTask, qc],
  );

  function toggleAssigneeFilter(userId: string) {
    setFilterAssignee((prev) => (prev === userId ? null : userId));
  }

  const visibleMembers = members?.slice(0, 6) ?? [];
  const extraMembers   = (members?.length ?? 0) - visibleMembers.length;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0f1512]">

      {/* ── Top toolbar ── */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/5 px-5 py-2.5">

        {/* Search */}
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search board…"
            className="w-48 rounded-lg border border-white/[0.07] bg-white/[0.03] py-1.5 pl-8 pr-3 text-xs text-zinc-300 placeholder-zinc-700 transition-all focus:w-60 focus:border-emerald-500/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/15"
          />
        </div>

        {/* Project selector */}
        <ProjectSelector workspaceId={workspaceId!} />

        {/* Filters button */}
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] px-3 py-1.5 text-xs text-zinc-500 transition-all hover:border-white/15 hover:bg-white/4 hover:text-zinc-300"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filters
        </button>

        {/* Member avatar filters */}
        {members && members.length > 0 && (
          <div className="flex items-center gap-1">
            {visibleMembers.map((m) => {
              const active = filterAssignee === m.userId;
              const color  = avatarColor(m.userId);
              return (
                <button
                  key={m.userId}
                  type="button"
                  title={m.user.name}
                  onClick={() => toggleAssigneeFilter(m.userId)}
                  className={[
                    "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shadow transition-all",
                    color,
                    active
                      ? "ring-2 ring-white/60 ring-offset-1 ring-offset-[#0f1512] scale-110"
                      : "opacity-80 hover:opacity-100 hover:scale-105",
                  ].join(" ")}
                >
                  {initials(m.user.name)}
                </button>
              );
            })}
            {extraMembers > 0 && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-zinc-800 text-[10px] font-bold text-zinc-400">
                +{extraMembers}
              </span>
            )}
            {filterAssignee && (
              <button
                type="button"
                onClick={() => setFilterAssignee(null)}
                className="ml-1 rounded px-1.5 py-0.5 text-[10px] text-zinc-500 transition-colors hover:text-zinc-300"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-2">
          {/* Complete sprint */}
          <button
            type="button"
            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black transition-all hover:bg-emerald-400 active:scale-95"
          >
            Complete sprint
          </button>

          <div className="h-4 w-px bg-white/8" />

          {/* Group by */}
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] px-3 py-1.5 text-xs text-zinc-400 transition-all hover:border-white/15 hover:text-zinc-200"
          >
            Group by: <span className="font-medium text-zinc-200">Status</span>
            <svg className="h-3 w-3 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* View */}
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] px-3 py-1.5 text-xs text-zinc-400 transition-all hover:border-white/15 hover:text-zinc-200"
          >
            View: <span className="font-medium text-zinc-200">Board</span>
            <svg className="h-3 w-3 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => void refetch()}
            title="Refresh"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.07] text-zinc-600 transition-all hover:border-white/15 hover:text-zinc-300"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Board area ── */}
      <div className="flex flex-1 gap-3 overflow-x-auto px-5 pb-5 pt-4">

        {/* No project */}
        {!projectId && (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              title="No project selected"
              description="Select or create a project above to start using the board."
            />
          </div>
        )}

        {/* Error */}
        {projectId && isError && (
          <div className="flex-1">
            <ErrorBanner message="Failed to load tasks." onRetry={() => void refetch()} />
          </div>
        )}

        {/* Columns */}
        {projectId && displayTasks && (
          <DndContext
            sensors={sensors}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
          >
            {COLUMNS.map((col) => {
              const colTasks = displayTasks[col.id] ?? [];
              return (
                <div key={col.id} className="flex w-[265px] shrink-0 flex-col">

                  {/* Column header */}
                  <div className="mb-2.5 flex items-center gap-2 px-1">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${col.dot}`}
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      {col.label}
                    </span>
                    <span className="min-w-[18px] text-center text-xs font-semibold text-zinc-600">
                      {colTasks.length}
                    </span>
                    <div className="ml-auto">
                      <ColMenu onAdd={() => setShowCreate(true)} />
                    </div>
                  </div>

                  {/* Card list */}
                  <div className="flex-1 overflow-y-auto max-h-[calc(100vh-14rem)]">
                    <SortableContext
                      items={colTasks.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <DroppableColumn colId={col.id} isOver={overColId === col.id}>
                        {colTasks.map((task) => (
                          <SortableTaskCard key={task.id} task={task} onOpen={setDrawerTaskId} />
                        ))}

                        {colTasks.length === 0 && (
                          <button
                            type="button"
                            onClick={() => setShowCreate(true)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.06] py-10 text-xs text-zinc-700 transition-colors hover:border-white/10 hover:text-zinc-500"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                            Add Task
                          </button>
                        )}
                      </DroppableColumn>
                    </SortableContext>
                  </div>

                  {/* Footer add button */}
                  <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className="mt-1.5 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-zinc-700 transition-colors hover:bg-white/4 hover:text-zinc-400"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add Task
                  </button>
                </div>
              );
            })}

            <DragOverlay dropAnimation={{ duration: 120, easing: "ease" }}>
              {activeTask ? <TaskCard task={activeTask} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* ── Status bar ── */}
      {projectId && tasks && (
        <div className="flex shrink-0 items-center justify-between border-t border-white/5 px-5 py-2">
          <p className="text-[11px] text-zinc-700">
            Drag cards between columns to change status · Click expand icon to open detail
          </p>
          <p className="text-[11px] text-zinc-600">
            <span className="font-medium text-zinc-400">{totalVisible}</span>
            {" "}of{" "}
            <span className="font-medium text-zinc-400">{totalAll}</span>
            {" "}tasks shown
          </p>
        </div>
      )}

      {/* Modals */}
      {projectId && (
        <CreateTaskModal
          projectId={projectId}
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          members={members}
          epics={epics}
        />
      )}

      <TaskDetailDrawer
        taskId={drawerTaskId}
        projectId={projectId ?? ""}
        onClose={() => setDrawerTaskId(null)}
        members={members}
        epics={epics}
      />
    </div>
  );
}
