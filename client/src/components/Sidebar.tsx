import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  LayoutDashboard,
  Kanban,
  AlignLeft,
  FolderOpen,
  BarChart2,
  Settings,
  LogOut,
  Plus,
  Users,
  HelpCircle,
  ChevronDown,
  UserPlus,
} from "lucide-react";
import type { ReactNode } from "react";
import { logoutRequest } from "../features/auth/auth.api";
import { useAuthStore } from "../features/auth/useAuthStore";
import { useWorkspaces } from "../features/workspaces/api";
import { queryClient } from "../lib/query-client";

// Deterministic color palette for team avatars
const TEAM_COLORS = [
  "bg-emerald-500 text-black",
  "bg-violet-500 text-white",
  "bg-amber-500 text-black",
  "bg-blue-500 text-white",
  "bg-rose-500 text-white",
  "bg-cyan-500 text-black",
  "bg-purple-500 text-white",
  "bg-orange-500 text-black",
];

// ── NavLink item ──────────────────────────────────────────────────────────────
function SidebarLink({
  to,
  icon,
  label,
  badge,
  end,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  badge?: number;
  end?: boolean;
}) {
  return (
    <NavLink to={to} end={end}>
      {({ isActive }) => (
        <div
          className={[
            "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-all duration-150",
            isActive
              ? "bg-emerald-500/10 text-white"
              : "text-zinc-500 hover:bg-white/4 hover:text-zinc-300",
          ].join(" ")}
        >
          <span
            className={[
              "shrink-0 transition-colors duration-150",
              isActive ? "text-emerald-400" : "",
            ].join(" ")}
          >
            {icon}
          </span>
          <span className="flex-1 truncate">{label}</span>
          {badge !== undefined && badge > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-black">
              {badge}
            </span>
          )}
        </div>
      )}
    </NavLink>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({
  children,
  action,
}: {
  children: string;
  action?: { icon: ReactNode; onClick: () => void; title: string };
}) {
  return (
    <div className="flex items-center px-2.5 pb-1 pt-3">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-900/70">
        {children}
      </span>
      {action && (
        <button
          type="button"
          title={action.title}
          onClick={action.onClick}
          className="ml-auto text-zinc-600 transition-colors hover:text-zinc-300"
        >
          {action.icon}
        </button>
      )}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export function Sidebar() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user, clear } = useAuthStore();
  const { data: workspaces } = useWorkspaces();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const base = workspaceId ? `/app/workspaces/${workspaceId}` : "/app/workspaces";

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleLogout() {
    logoutRequest().catch((err: unknown) => {
      if (!isAxiosError(err)) console.error("Logout error:", err);
    });
    queryClient.clear();
    clear();
    navigate("/login", { replace: true });
  }

  const initials =
    user?.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?";

  return (
    <aside
      aria-label="Main navigation"
      className="sidebar-bg relative flex h-full w-[220px] shrink-0 flex-col overflow-hidden"
    >
      {/* ── Logo ── */}
      <div className="sidebar-divider shrink-0 border-b px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="sidebar-logo flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black text-black">
            TS
          </div>
          <span className="text-sm font-bold text-white">TeamSync</span>
          <ChevronDown size={12} className="ml-auto text-zinc-600" />
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex flex-1 flex-col overflow-y-auto px-2 py-3 gap-0.5">
        {/* Primary global links */}
        <SidebarLink
          to={`${base}/dashboard`}
          icon={<LayoutDashboard size={15} />}
          label="Dashboard"
          end
        />
        <SidebarLink
          to={`${base}/board`}
          icon={<Kanban size={15} />}
          label="Board"
        />
        <SidebarLink
          to={`${base}/backlog`}
          icon={<AlignLeft size={15} />}
          label="Backlog"
        />
        <SidebarLink
          to={`${base}/projects`}
          icon={<FolderOpen size={15} />}
          label="Projects"
        />
        <SidebarLink
          to={`${base}/analytics`}
          icon={<BarChart2 size={15} />}
          label="Analytics"
        />

        {/* ── Teams section ── */}
        <SectionLabel
          action={{
            icon: <Plus size={12} />,
            title: "Create team",
            onClick: () => navigate("/app/workspaces"),
          }}
        >
          Teams
        </SectionLabel>

        {workspaces?.map((ws, i) => {
          const colorCls = TEAM_COLORS[i % TEAM_COLORS.length];
          const isActive = ws.id === workspaceId;
          const abbr = ws.name.slice(0, 2).toUpperCase();

          return (
            <button
              key={ws.id}
              type="button"
              onClick={() => navigate(`/app/workspaces/${ws.id}/dashboard`)}
              className={[
                "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all duration-150",
                isActive
                  ? "bg-emerald-500/10 text-white"
                  : "text-zinc-400 hover:bg-white/4 hover:text-zinc-200",
              ].join(" ")}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[8px] font-black ${colorCls}`}
              >
                {abbr}
              </div>
              <span className="min-w-0 flex-1 truncate text-left text-xs font-medium">
                {ws.name}
              </span>
              {isActive && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => navigate("/app/workspaces")}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 transition-colors hover:text-zinc-400"
        >
          <Plus size={12} />
          Create new team
        </button>
        <button
          type="button"
          onClick={() =>
            workspaceId
              ? navigate(`/app/workspaces/${workspaceId}/members`)
              : navigate("/app/workspaces")
          }
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 transition-colors hover:text-zinc-400"
        >
          <UserPlus size={12} />
          Invite people
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* ── System ── */}
        <SectionLabel>System</SectionLabel>
        <SidebarLink
          to={`${base}/settings`}
          icon={<Settings size={15} />}
          label="Settings"
        />
        <button type="button" className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-zinc-500 transition-all duration-150 hover:bg-white/4 hover:text-zinc-300">
          <HelpCircle size={15} className="shrink-0" />
          Help & Support
        </button>

        {/* ── Members ── */}
        <SidebarLink
          to={`${base}/members`}
          icon={<Users size={15} />}
          label="Members"
        />
      </nav>

      {/* ── User profile ── */}
      <div ref={userMenuRef} className="sidebar-divider relative shrink-0 border-t px-2 py-2">
        <button
          type="button"
          onClick={() => setShowUserMenu((v) => !v)}
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-emerald-500/5"
        >
          <div className="sidebar-avatar flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-emerald-300">
            {initials}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-xs font-medium text-zinc-300">{user?.name ?? "—"}</p>
            <p className="truncate text-[10px] text-zinc-600">{user?.email ?? ""}</p>
          </div>
          <ChevronDown size={11} className="shrink-0 text-zinc-700" />
        </button>

        {showUserMenu && (
          <div className="absolute bottom-full left-2 right-2 mb-1 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-xl shadow-black/60">
            <div className="px-3 py-2.5">
              <p className="text-xs font-semibold text-zinc-300">{user?.name}</p>
              <p className="text-[10px] text-zinc-600">{user?.email}</p>
            </div>
            <div className="border-t border-white/5 p-1">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/10"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
