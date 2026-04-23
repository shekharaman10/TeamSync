import { useState } from "react";
import { useParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { SkeletonCard } from "../../components/ui/Skeleton";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { ProjectCard } from "./components/ProjectCard";
import { CreateProjectModal } from "./components/CreateProjectModal";
import { useProjects } from "./api";
import { useSeedDemo } from "../workspaces/api";
import { extractErrorMessage } from "../../lib/error";

export function ProjectListPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data, isPending, isError, refetch } = useProjects(workspaceId!);
  const [showCreate, setShowCreate] = useState(false);
  const { mutate: seed, isPending: seeding } = useSeedDemo(workspaceId!);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [canForce, setCanForce] = useState(false);

  function handleSeed(force = false) {
    setSeedError(null);
    setCanForce(false);
    seed({ force }, {
      onError: (err) => {
        const msg = extractErrorMessage(err);
        setSeedError(msg);
        // Show "Reset & seed fresh" only for the "already has projects" 409 error
        if (!force && msg.toLowerCase().includes("already")) setCanForce(true);
      },
    });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-4">
        <div>
          <h1 className="text-base font-semibold text-white">Projects</h1>
          {data && (
            <p className="text-xs text-zinc-500">
              {data.length} {data.length === 1 ? "project" : "projects"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSeed(true)}
            disabled={seeding}
            title="Delete all projects and reload demo data"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:border-amber-500/30 hover:text-amber-400 disabled:opacity-50"
          >
            <Sparkles size={12} />
            {seeding ? "Resetting…" : "Reset demo"}
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-emerald-400"
          >
            + New project
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isPending && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}
        {isError && (
          <ErrorBanner message="Failed to load projects." onRetry={() => void refetch()} />
        )}
        {seedError && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <svg className="h-4 w-4 shrink-0 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p className="flex-1 text-xs text-amber-300">{seedError}</p>
            {canForce && (
              <button
                type="button"
                onClick={() => handleSeed(true)}
                disabled={seeding}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black transition-all hover:bg-amber-400 disabled:opacity-60"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="23 4 23 10 17 10" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
                  <polyline points="1 20 1 14 7 14" /><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
                </svg>
                {seeding ? "Resetting…" : "Reset & seed fresh"}
              </button>
            )}
          </div>
        )}

        {!isPending && !isError && data?.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-6 pt-16 text-center">
            {/* Icon */}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/8 bg-zinc-900">
              <svg className="h-7 w-7 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </div>

            <div>
              <p className="text-sm font-semibold text-zinc-200">No projects yet</p>
              <p className="mt-1 text-xs text-zinc-500">
                Create your first project or load demo data to explore the workspace.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/5"
              >
                Create project
              </button>

              <button
                type="button"
                onClick={() => handleSeed(false)}
                disabled={seeding}
                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-black transition-all hover:bg-emerald-400 disabled:opacity-60"
              >
                <Sparkles size={13} />
                {seeding ? "Loading demo data…" : "Load demo data"}
              </button>
            </div>

            <p className="max-w-xs text-[11px] text-zinc-600">
              Demo data creates 2 projects, 6 epics, and 30 realistic tasks so every page has something to show.
            </p>
          </div>
        )}

        {data && data.length > 0 && (
          <div className="space-y-3">
            {data.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </div>

      <CreateProjectModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
