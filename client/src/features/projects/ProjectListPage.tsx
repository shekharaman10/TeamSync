import { useState } from "react";
import { useParams } from "react-router-dom";
import { SkeletonCard } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { ProjectCard } from "./components/ProjectCard";
import { CreateProjectModal } from "./components/CreateProjectModal";
import { useProjects } from "./api";

export function ProjectListPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data, isPending, isError, refetch } = useProjects(workspaceId!);
  const [showCreate, setShowCreate] = useState(false);

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
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-teal-400 px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-teal-300"
        >
          + New project
        </button>
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
        {!isPending && !isError && data?.length === 0 && (
          <EmptyState
            title="No projects yet"
            description="Create your first project to start organizing work."
            action={{ label: "Create project", onClick: () => setShowCreate(true) }}
          />
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
