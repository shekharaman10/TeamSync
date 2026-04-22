import { COLUMNS, MOCK_TASKS } from "./mockData";
import { TaskCard } from "./TaskCard";

export function BoardPage() {
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
        {COLUMNS.map((col) => {
          const tasks = MOCK_TASKS.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="flex w-72 shrink-0 flex-col gap-3">
              {/* Column header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {col.label}
                  </span>
                  <span className="rounded-full bg-zinc-700/60 px-1.5 py-0.5 text-[10px] font-bold text-zinc-400">
                    {tasks.length}
                  </span>
                </div>
                <button
                  type="button"
                  className="rounded p-0.5 text-zinc-600 transition-colors hover:text-zinc-400"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2.5">
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {tasks.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/5 py-8 text-center text-xs text-zinc-600">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
