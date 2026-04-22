import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
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
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { COLUMNS, MOCK_TASKS, resolveTasks, getInitials, type Task, type Status } from "./mockData";
import { useAuthStore } from "../auth/useAuthStore";
import { TaskCard } from "./TaskCard";

type TasksByColumn = Record<Status, Task[]>;

function groupByColumn(tasks: Task[]): TasksByColumn {
  return COLUMNS.reduce<TasksByColumn>((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.status === col.id);
    return acc;
  }, {} as TasksByColumn);
}

function findContainer(tasks: TasksByColumn, taskId: string): Status | undefined {
  return (Object.keys(tasks) as Status[]).find((col) =>
    tasks[col].some((t) => t.id === taskId),
  );
}

function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-40" : ""}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} />
    </div>
  );
}

function DroppableColumn({
  colId,
  children,
  isOver,
}: {
  colId: Status;
  children: React.ReactNode;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: colId });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-20 flex-col gap-2.5 rounded-lg p-1 transition-colors ${isOver ? "bg-teal-500/5 ring-1 ring-teal-500/20" : ""}`}
    >
      {children}
    </div>
  );
}

export function BoardPage() {
  const { user } = useAuthStore();
  const selfInitials = user ? getInitials(user.name) : "?";
  const [tasks, setTasks] = useState<TasksByColumn>(() =>
    groupByColumn(resolveTasks(MOCK_TASKS, selfInitials)),
  );
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColId, setOverColId] = useState<Status | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function onDragStart({ active }: DragStartEvent) {
    const id = String(active.id);
    const task = Object.values(tasks).flat().find((t) => t.id === id) ?? null;
    setActiveTask(task);
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) { setOverColId(null); return; }
    const overId = String(over.id);
    const isColumn = COLUMNS.some((c) => c.id === overId);
    const col = isColumn ? (overId as Status) : findContainer(tasks, overId);
    setOverColId(col ?? null);

    const activeId = String(active.id);
    const sourceCol = findContainer(tasks, activeId);
    if (!sourceCol || !col || sourceCol === col) return;

    // Live move between columns while hovering
    setTasks((prev) => {
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
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null);
    setOverColId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const sourceCol = findContainer(tasks, activeId);
    if (!sourceCol) return;

    // At this point the task is already in the target column (moved in onDragOver).
    // Only handle same-column reordering here.
    const isOverTask = tasks[sourceCol].some((t) => t.id === overId);
    if (!isOverTask) return;

    setTasks((prev) => {
      const items = prev[sourceCol];
      const oldIdx = items.findIndex((t) => t.id === activeId);
      const newIdx = items.findIndex((t) => t.id === overId);
      if (oldIdx === newIdx) return prev;
      return { ...prev, [sourceCol]: arrayMove(items, oldIdx, newIdx) };
    });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-4">
        <div>
          <h1 className="text-base font-semibold text-white">Board</h1>
          <p className="text-xs text-zinc-500">TeamSync · Sprint 1</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/10"
          >
            Filters
          </button>
          <button
            type="button"
            className="rounded-lg bg-teal-400 px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-teal-300"
          >
            + Add task
          </button>
        </div>
      </div>

      {/* Columns */}
      <div className="flex flex-1 gap-4 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          {COLUMNS.map((col) => {
            const colTasks = tasks[col.id] ?? [];
            return (
              <div key={col.id} className="flex w-72 shrink-0 flex-col">
                {/* Column header */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      {col.label}
                    </span>
                    <span className="rounded-full bg-zinc-700/60 px-1.5 py-0.5 text-[10px] font-bold text-zinc-400">
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    title={`Add task to ${col.label}`}
                    className="rounded p-0.5 text-zinc-600 transition-colors hover:text-zinc-400"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>

                {/* Scrollable card list */}
                <div className="max-h-[calc(100vh-13rem)] flex-1 overflow-y-auto pr-0.5">
                  <SortableContext
                    items={colTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <DroppableColumn colId={col.id} isOver={overColId === col.id}>
                      {colTasks.map((task) => (
                        <SortableTaskCard key={task.id} task={task} />
                      ))}
                      {colTasks.length === 0 && (
                        <div className="rounded-xl border border-dashed border-white/5 py-10 text-center text-xs text-zinc-700">
                          Drop here
                        </div>
                      )}
                    </DroppableColumn>
                  </SortableContext>
                </div>
              </div>
            );
          })}

          <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
            {activeTask ? <TaskCard task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
