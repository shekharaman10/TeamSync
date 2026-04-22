import { useState, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
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
import { useProjects } from "../projects/api";
import { ProjectSelector, useSelectedProjectId } from "../projects/components/ProjectSelector";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { CreateTaskModal } from "../tasks/components/CreateTaskModal";
import { useWorkspaceMembers } from "../workspaces/api";
import { useEpics } from "../epics/api";
import { QK } from "../../lib/query-keys";
import { TaskCard } from "./TaskCard";
import type { Task, TaskStatus } from "../../lib/types";

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "BACKLOG",     label: "Backlog" },
  { id: "TODO",        label: "To Do" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "IN_REVIEW",   label: "In Review" },
  { id: "DONE",        label: "Done" },
];

type TasksByColumn = Record<TaskStatus, Task[]>;

function groupByColumn(tasks: Task[]): TasksByColumn {
  return COLUMNS.reduce<TasksByColumn>((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.status === col.id);
    return acc;
  }, {} as TasksByColumn);
}

function findContainer(tasks: TasksByColumn, taskId: string): TaskStatus | undefined {
  return (Object.keys(tasks) as TaskStatus[]).find((col) =>
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
  colId: TaskStatus;
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

  const displayTasks = localTasks ?? (tasks ? groupByColumn(tasks) : null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = useCallback(({ active }: DragStartEvent) => {
    const id = String(active.id);
    if (!displayTasks) return;
    const task = Object.values(displayTasks).flat().find((t) => t.id === id) ?? null;
    setActiveTask(task);
    setLocalTasks(displayTasks);
  }, [displayTasks]);

  const onDragOver = useCallback(({ active, over }: DragOverEvent) => {
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
  }, [localTasks]);

  const onDragEnd = useCallback(({ active, over }: DragEndEvent) => {
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

    // Within-column reorder (UI-only, no API call)
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

    // Cross-column move: optimistic update already applied in onDragOver
    const snapshot = tasks ? groupByColumn(tasks) : null;

    updateTask(
      { taskId: activeId, status: destCol },
      {
        onError: () => {
          // Rollback to server truth on failure
          if (snapshot) setLocalTasks(snapshot);
          else setLocalTasks(null);
        },
        onSettled: () => {
          setLocalTasks(null);
          void qc.invalidateQueries({ queryKey: QK.boardTasks(projectId) });
        },
      },
    );
  }, [localTasks, tasks, projectId, updateTask, qc]);

  // suppress unused import warning
  void useProjects;
  void useSearchParams;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-white">Board</h1>
          <ProjectSelector workspaceId={workspaceId!} />
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-teal-400 px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-teal-300"
        >
          + Add task
        </button>
      </div>

      <div className="flex flex-1 gap-4 overflow-x-auto p-6">
        {!projectId && (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              title="No project selected"
              description="Create a project first to use the board."
            />
          </div>
        )}

        {projectId && isError && (
          <div className="flex-1">
            <ErrorBanner message="Failed to load tasks." onRetry={() => void refetch()} />
          </div>
        )}

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
                <div key={col.id} className="flex w-72 shrink-0 flex-col">
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
                      onClick={() => setShowCreate(true)}
                      className="rounded p-0.5 text-zinc-600 transition-colors hover:text-zinc-400"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  </div>

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
        )}
      </div>

      {projectId && (
        <CreateTaskModal
          projectId={projectId}
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          members={members}
          epics={epics}
        />
      )}
    </div>
  );
}
