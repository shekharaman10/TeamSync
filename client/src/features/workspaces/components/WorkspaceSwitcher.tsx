import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkspaces } from "../api";
import { useWorkspaceStore } from "../store";

export function WorkspaceSwitcher() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { setLastWorkspaceId } = useWorkspaceStore();
  const { data: workspaces } = useWorkspaces();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = workspaces?.find((w) => w.id === workspaceId);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function switchTo(id: string) {
    setLastWorkspaceId(id);
    navigate(`/app/workspaces/${id}/board`);
    setOpen(false);
  }

  const initials = current?.name.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-400 text-[9px] font-black text-black">
          {initials}
        </div>
        <span className="min-w-0 flex-1 truncate text-left text-xs font-semibold text-white">
          {current?.name ?? "Select workspace"}
        </span>
        <svg className="h-3 w-3 shrink-0 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 w-full min-w-48 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-xl shadow-black/60"
        >
          <div className="max-h-60 overflow-y-auto py-1">
            {workspaces?.map((ws) => (
              <button
                key={ws.id}
                type="button"
                role="option"
                aria-selected={ws.id === workspaceId}
                onClick={() => switchTo(ws.id)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-white/5 ${ws.id === workspaceId ? "text-teal-400" : "text-zinc-300"}`}
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-teal-400/20 text-[8px] font-black text-teal-300">
                  {ws.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="min-w-0 flex-1 truncate">{ws.name}</span>
                {ws.id === workspaceId && (
                  <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          <div className="border-t border-white/5 p-1">
            <button
              type="button"
              onClick={() => { navigate("/app/workspaces"); setOpen(false); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
