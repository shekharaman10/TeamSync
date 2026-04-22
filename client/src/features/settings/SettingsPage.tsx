import { useState } from "react";

export function SettingsPage() {
  const [workspaceName, setWorkspaceName] = useState("TeamSync");
  const [description, setDescription] = useState("Our main project workspace");
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center border-b border-white/5 px-6 py-4">
        <div>
          <h1 className="text-base font-semibold text-white">Settings</h1>
          <p className="text-xs text-zinc-500">Manage your workspace preferences</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-xl space-y-6">

          {/* General */}
          <section className="rounded-xl border border-white/8 bg-zinc-800/40 p-6">
            <h2 className="mb-4 text-sm font-semibold text-white">General</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400" htmlFor="ws-name">
                  Workspace name
                </label>
                <input
                  id="ws-name"
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full rounded-lg border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-teal-500/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400" htmlFor="ws-desc">
                  Description
                </label>
                <textarea
                  id="ws-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full resize-none rounded-lg border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-teal-500/40 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="rounded-lg bg-teal-400 px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-teal-300"
                >
                  Save changes
                </button>
                {saved && <span className="text-xs text-teal-400">Saved!</span>}
              </div>
            </form>
          </section>

          {/* Notifications */}
          <section className="rounded-xl border border-white/8 bg-zinc-800/40 p-6">
            <h2 className="mb-4 text-sm font-semibold text-white">Notifications</h2>
            <div className="space-y-3">
              {[
                { id: "notif-assign",  label: "Task assigned to me",   defaultOn: true },
                { id: "notif-mention", label: "Mentions",              defaultOn: true },
                { id: "notif-status",  label: "Task status changes",   defaultOn: false },
                { id: "notif-invite",  label: "New member joins",      defaultOn: false },
              ].map(({ id, label, defaultOn }) => (
                <Toggle key={id} id={id} label={label} defaultChecked={defaultOn} />
              ))}
            </div>
          </section>

          {/* Danger zone */}
          <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
            <h2 className="mb-1 text-sm font-semibold text-red-400">Danger zone</h2>
            <p className="mb-4 text-xs text-zinc-500">These actions are permanent and cannot be undone.</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-300">Archive workspace</p>
                  <p className="text-xs text-zinc-600">Hides the workspace from all members.</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
                >
                  Archive
                </button>
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-300">Delete workspace</p>
                  <p className="text-xs text-zinc-600">Permanently deletes all data.</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function Toggle({ id, label, defaultChecked }: { id: string; label: string; defaultChecked: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="cursor-pointer text-sm text-zinc-300">{label}</label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => setChecked((v) => !v)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? "bg-teal-400" : "bg-zinc-700"}`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 translate-x-0.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`}
        />
      </button>
    </div>
  );
}
