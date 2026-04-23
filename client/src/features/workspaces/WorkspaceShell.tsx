import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  LayoutGrid,
  GitBranch,
  AlignLeft,
  Kanban,
  List,
  CalendarDays,
  Target,
  Users,
  Settings,
  Plus,
  BarChart2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "../../components/AppShell";
import { useWorkspace, useWorkspaceMembers } from "./api";
import { useWorkspaceStore } from "./store";
import { useSelectedProjectId } from "../projects/components/ProjectSelector";
import { useProjects } from "../projects/api";
import { useEpics } from "../epics/api";
import { CreateTaskModal } from "../tasks/components/CreateTaskModal";

type Tab = { label: string; path: string; Icon: LucideIcon };

const TABS: Tab[] = [
  { label: "Summary",     path: "dashboard",   Icon: LayoutGrid   },
  { label: "Timeline",    path: "timeline",    Icon: GitBranch    },
  { label: "Backlog",     path: "backlog",     Icon: AlignLeft    },
  { label: "Board",       path: "board",       Icon: Kanban       },
  { label: "List",        path: "list",        Icon: List         },
  { label: "Calendar",    path: "calendar",    Icon: CalendarDays },
  { label: "Goals",       path: "goals",       Icon: Target       },
  { label: "Development", path: "development", Icon: BarChart2    },
  { label: "Members",     path: "members",     Icon: Users        },
  { label: "Settings",    path: "settings",    Icon: Settings     },
];

export function WorkspaceShell() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { setLastWorkspaceId } = useWorkspaceStore();
  const { isError, error, isSuccess, data: workspace } = useWorkspace(workspaceId!);
  const [showCreate, setShowCreate] = useState(false);

  const projectId = useSelectedProjectId(workspaceId!);
  const { data: members = [] } = useWorkspaceMembers(workspaceId!);
  const { data: projects } = useProjects(workspaceId!);
  const { data: epics } = useEpics(projectId ?? "");

  useEffect(() => {
    if (!isError) return;
    const status = isAxiosError(error) ? (error.response?.status ?? 0) : 0;
    if (status === 403 || status === 404) navigate("/app/workspaces", { replace: true });
  }, [isError, error, navigate]);

  useEffect(() => {
    if (isSuccess && workspace) setLastWorkspaceId(workspace.id);
  }, [isSuccess, workspace, setLastWorkspaceId]);

  function handleNewTask() {
    if (projectId) {
      setShowCreate(true);
    } else if (projects && projects.length === 0) {
      navigate(`/app/workspaces/${workspaceId}/projects`);
    } else {
      // projects still loading — optimistically open; modal renders once projectId resolves
      setShowCreate(true);
    }
  }

  return (
    <AppShell>
      {projectId && showCreate && (
        <CreateTaskModal
          projectId={projectId}
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          members={members}
          epics={epics}
        />
      )}

      {/* ── Workspace header ── */}
      <div className="shrink-0 border-b border-white/5">
        {/* Title row */}
        <div className="flex items-center justify-between px-6 pb-3 pt-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600">
              Workspace
            </p>
            <h1 className="text-xl font-bold tracking-tight text-white">
              {workspace?.name ?? "…"}
            </h1>
          </div>

          {/* Actions */}
          <button
            type="button"
            onClick={handleNewTask}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-emerald-400"
          >
            <Plus size={13} />
            New Task
          </button>
        </div>

        {/* ── Tab navigation ── */}
        <div className="tab-nav flex overflow-x-auto px-4">
          {TABS.map(({ label, path, Icon }) => (
            <NavLink key={path} to={path} end={path === "dashboard"}>
              {({ isActive }) => (
                <div
                  className={[
                    "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-all duration-150",
                    isActive
                      ? "border-emerald-400 text-white"
                      : "border-transparent text-zinc-500 hover:border-zinc-700 hover:text-zinc-300",
                  ].join(" ")}
                >
                  <Icon
                    size={13}
                    className={isActive ? "text-emerald-400" : ""}
                  />
                  {label}
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* ── Page content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </AppShell>
  );
}
