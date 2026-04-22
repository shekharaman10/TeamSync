import { useState } from "react";
import { useParams } from "react-router-dom";
import { SkeletonCard } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { EpicListItem } from "./components/EpicListItem";
import { CreateEpicModal } from "./components/CreateEpicModal";
import { useEpics } from "./api";

export function EpicsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data, isPending, isError, refetch } = useEpics(projectId!);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-3">
        <p className="text-xs text-zinc-500">
          {data ? `${data.length} ${data.length === 1 ? "epic" : "epics"}` : ""}
        </p>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-teal-400 px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-teal-300"
        >
          + New epic
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {isPending && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}
        {isError && (
          <ErrorBanner message="Failed to load epics." onRetry={() => void refetch()} />
        )}
        {!isPending && !isError && data?.length === 0 && (
          <EmptyState
            title="No epics yet"
            description="Group related tasks into epics to track larger pieces of work."
            action={{ label: "New epic", onClick: () => setShowCreate(true) }}
          />
        )}
        {data && data.length > 0 && (
          <div className="space-y-3">
            {data.map((epic) => (
              <EpicListItem key={epic.id} epic={epic} projectId={projectId!} />
            ))}
          </div>
        )}
      </div>

      <CreateEpicModal
        projectId={projectId!}
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
  );
}
