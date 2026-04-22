import { useSearchParams } from "react-router-dom";
import { useProjects } from "../api";

type Props = { workspaceId: string };

export function ProjectSelector({ workspaceId }: Props) {
  const [params, setParams] = useSearchParams();
  const { data: projects, isPending } = useProjects(workspaceId);
  const projectId = params.get("projectId");

  function handleChange(id: string) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("projectId", id);
      return next;
    });
  }

  if (isPending || !projects?.length) return null;

  return (
    <select
      aria-label="Select project"
      value={projectId ?? projects[0]?.id ?? ""}
      onChange={(e) => handleChange(e.target.value)}
      className="h-7 rounded-lg border border-white/8 bg-zinc-900 px-2 text-xs text-zinc-300 focus:outline-none"
    >
      {projects.map((p) => (
        <option key={p.id} value={p.id}>
          [{p.key}] {p.name}
        </option>
      ))}
    </select>
  );
}

/** Returns the currently selected projectId from URL, falling back to the first project. */
export function useSelectedProjectId(workspaceId: string): string | null {
  const [params] = useSearchParams();
  const { data: projects } = useProjects(workspaceId);
  return params.get("projectId") ?? projects?.[0]?.id ?? null;
}
