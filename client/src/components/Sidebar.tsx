import { NavLink, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { logoutRequest } from "../features/auth/auth.api";
import { useAuthStore } from "../features/auth/useAuthStore";
import { queryClient } from "../lib/query-client";

type NavItem = { to: string; label: string; icon: React.ReactNode };

function BoardIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="18" rx="1" />
      <rect x="14" y="3" width="7" height="10" rx="1" />
      <rect x="14" y="17" width="7" height="4" rx="1" />
    </svg>
  );
}

function BacklogIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="3" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="3" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="3" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MembersIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { to: "/app/board",     label: "Board",     icon: <BoardIcon /> },
  { to: "/app/backlog",   label: "Backlog",   icon: <BacklogIcon /> },
  { to: "/app/members",   label: "Members",   icon: <MembersIcon /> },
  { to: "/app/analytics", label: "Analytics", icon: <AnalyticsIcon /> },
  { to: "/app/settings",  label: "Settings",  icon: <SettingsIcon /> },
];

export function Sidebar() {
  const { user, clear } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logoutRequest().catch((err: unknown) => {
      if (!isAxiosError(err)) console.error("Logout error:", err);
    });
    queryClient.clear();
    clear();
    navigate("/login", { replace: true });
  }

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-white/5 bg-zinc-950">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-white/5 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-400 text-[11px] font-black text-black">
          TS
        </div>
        <span className="text-sm font-semibold text-white">TeamSync</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-teal-400/10 font-medium text-teal-400"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`
            }
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + sign-out */}
      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-[11px] font-bold text-teal-300">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-zinc-300">{user?.name ?? "—"}</p>
            <p className="truncate text-[10px] text-zinc-600">{user?.email ?? ""}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            className="shrink-0 text-zinc-600 transition-colors hover:text-zinc-300"
          >
            <SignOutIcon />
          </button>
        </div>
      </div>
    </aside>
  );
}
