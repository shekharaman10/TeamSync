import { useState } from "react";
import { WorkspaceList } from "./components/WorkspaceList";
import { CreateWorkspaceModal } from "./components/CreateWorkspaceModal";

export function WorkspaceSelectPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <header className="flex h-14 items-center border-b border-white/5 px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-400 text-[11px] font-black text-black">
            TS
          </div>
          <span className="text-sm font-semibold text-white">TeamSync</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Your workspaces</h1>
            <p className="text-xs text-zinc-500">Select a workspace to continue</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-teal-400 px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-teal-300"
          >
            + New workspace
          </button>
        </div>

        <WorkspaceList onCreateClick={() => setShowCreate(true)} />
      </main>

      <CreateWorkspaceModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
