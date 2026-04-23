import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Search, Crown, Shield, User as UserIcon, Calendar, Users, ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useWorkspaceMembers, useRemoveMember } from "../workspaces/api";
import { useAuthStore } from "../auth/useAuthStore";
import { InviteForm } from "../invitations/components/InviteForm";
import { PendingInvitesList } from "../invitations/components/PendingInvitesList";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import type { Role } from "../../lib/types";

type SortKey = "name" | "joined" | "role";

const ROLE_CONFIG: Record<Role, {
  label: string;
  badgeCls: string;
  avatarCls: string;
  Icon: LucideIcon;
}> = {
  OWNER: {
    label: "Owner",
    badgeCls: "text-amber-300 bg-amber-400/10 border-amber-400/25",
    avatarCls: "bg-linear-to-br from-amber-500/30 to-amber-600/10 outline outline-1 outline-amber-500/25",
    Icon: Crown,
  },
  ADMIN: {
    label: "Admin",
    badgeCls: "text-emerald-300 bg-emerald-400/10 border-emerald-400/25",
    avatarCls: "bg-linear-to-br from-emerald-500/30 to-emerald-600/10 outline outline-1 outline-emerald-500/25",
    Icon: Shield,
  },
  MEMBER: {
    label: "Member",
    badgeCls: "text-zinc-400 bg-zinc-700/30 border-zinc-600/30",
    avatarCls: "bg-linear-to-br from-zinc-600/30 to-zinc-700/10 outline outline-1 outline-zinc-500/20",
    Icon: UserIcon,
  },
};

const ROLE_ORDER: Record<Role, number> = { OWNER: 0, ADMIN: 1, MEMBER: 2 };

function relativeTime(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days < 1) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function MembersPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user } = useAuthStore();
  const { data: members, isPending, isError, refetch } = useWorkspaceMembers(workspaceId!);
  const { mutate: removeMember } = useRemoveMember(workspaceId!);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<SortKey>("role");

  const currentMember = members?.find((m) => m.user.id === user?.id);
  const canManage = currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";

  const filtered = useMemo(() => {
    if (!members) return [];
    return members
      .filter((m) => {
        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          m.user.name.toLowerCase().includes(q) ||
          m.user.email.toLowerCase().includes(q);
        const matchesRole = roleFilter === "ALL" || m.role === roleFilter;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.user.name.localeCompare(b.user.name);
        if (sortBy === "joined")
          return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
        return ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
      });
  }, [members, search, roleFilter, sortBy]);

  const stats = useMemo(() => {
    if (!members) return null;
    return {
      total: members.length,
      owners: members.filter((m) => m.role === "OWNER").length,
      admins: members.filter((m) => m.role === "ADMIN").length,
    };
  }, [members]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="shrink-0 border-b border-white/5 px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-base font-semibold text-white">Members</h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              Manage who has access to this workspace
            </p>
          </div>

          {/* Stat pills */}
          {stats && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/4 px-3 py-1 text-xs text-zinc-400">
                <Users size={11} />
                {stats.total} {stats.total === 1 ? "member" : "members"}
              </span>
              {stats.owners > 0 && (
                <span className="flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/8 px-2.5 py-1 text-xs text-amber-300">
                  <Crown size={10} />
                  {stats.owners}
                </span>
              )}
              {stats.admins > 0 && (
                <span className="flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/8 px-2.5 py-1 text-xs text-emerald-300">
                  <Shield size={10} />
                  {stats.admins}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Search + filter toolbar */}
        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              placeholder="Search members…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border border-white/8 bg-white/4 pl-8 pr-3 text-xs text-zinc-300 placeholder-zinc-600 focus:border-emerald-500/30 focus:outline-none"
            />
          </div>

          <div className="relative">
            <select
              aria-label="Filter by role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as Role | "ALL")}
              className="h-8 appearance-none rounded-lg border border-white/8 bg-zinc-900 pl-3 pr-7 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="ALL">All roles</option>
              <option value="OWNER">Owners</option>
              <option value="ADMIN">Admins</option>
              <option value="MEMBER">Members</option>
            </select>
            <ChevronDown
              size={11}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500"
            />
          </div>

          <div className="relative">
            <select
              aria-label="Sort by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="h-8 appearance-none rounded-lg border border-white/8 bg-zinc-900 pl-3 pr-7 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="role">Sort: Role</option>
              <option value="name">Sort: Name</option>
              <option value="joined">Sort: Joined</option>
            </select>
            <ChevronDown
              size={11}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500"
            />
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* Invite form */}
        {canManage && (
          <div className="mb-5">
            <InviteForm workspaceId={workspaceId!} />
          </div>
        )}

        {/* Loading skeletons */}
        {isPending && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-17 rounded-xl" />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <ErrorBanner
            message="Failed to load members."
            onRetry={() => void refetch()}
          />
        )}

        {/* Member list */}
        {filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((member) => {
              const cfg = ROLE_CONFIG[member.role];
              const { Icon } = cfg;
              const initials = member.user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              const isSelf = member.user.id === user?.id;
              const isOwner = member.role === "OWNER";

              return (
                <div
                  key={member.id}
                  className="group flex items-center gap-4 rounded-xl border border-white/5 bg-zinc-900/60 px-5 py-3.5 transition-all duration-150 hover:border-emerald-500/15 hover:bg-zinc-900/80"
                >
                  {/* Avatar */}
                  <div
                    className={[
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      "text-sm font-bold text-white",
                      cfg.avatarCls,
                    ].join(" ")}
                  >
                    {initials}
                  </div>

                  {/* Name + email */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-zinc-100">
                        {member.user.name}
                      </p>
                      {isSelf && (
                        <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
                          you
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-zinc-500">{member.user.email}</p>
                  </div>

                  {/* Meta */}
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden items-center gap-1 text-xs text-zinc-600 sm:flex">
                      <Calendar size={10} />
                      {relativeTime(member.joinedAt)}
                    </span>

                    <span
                      className={[
                        "flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        cfg.badgeCls,
                      ].join(" ")}
                    >
                      <Icon size={10} />
                      {cfg.label}
                    </span>

                    {/* Remove button — only visible on hover */}
                    {canManage && !isOwner && !isSelf && (
                      <button
                        type="button"
                        title="Remove member"
                        onClick={() => removeMember(member.user.id)}
                        className="rounded-lg p-1.5 text-zinc-700 opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty search state */}
        {members && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Search size={28} className="mb-3 text-zinc-700" />
            <p className="text-sm font-medium text-zinc-400">No members match your search</p>
            <p className="mt-1 text-xs text-zinc-600">Try adjusting your filters</p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setRoleFilter("ALL");
              }}
              className="mt-3 text-xs text-emerald-400 hover:text-emerald-300"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Pending invites */}
        {canManage && (
          <div className="mt-6">
            <PendingInvitesList workspaceId={workspaceId!} />
          </div>
        )}
      </div>
    </div>
  );
}
