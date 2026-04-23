import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Settings,
  Bell,
  Shield,
  Users,
  Trash2,
  ChevronRight,
  Check,
  Globe,
  Palette,
  Download,
  Copy,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useWorkspace, useUpdateWorkspace, useWorkspaceMembers } from "../workspaces/api";
import { UpdateWorkspaceSchema, generateSlug } from "../workspaces/schemas";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { extractErrorMessage } from "../../lib/error";
import type { UpdateWorkspaceInput } from "../workspaces/schemas";

// ── Design tokens ─────────────────────────────────────────────────────────────
const SURFACE   = "#111814";
const BORDER    = "rgba(34,197,94,0.08)";

// ── Sidebar nav items ─────────────────────────────────────────────────────────
type Section = "general" | "notifications" | "members" | "security" | "danger";

const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "general",       label: "General",       icon: <Settings    size={15} />, desc: "Workspace name & slug" },
  { id: "notifications", label: "Notifications", icon: <Bell        size={15} />, desc: "Alerts & email settings" },
  { id: "members",       label: "Members",       icon: <Users       size={15} />, desc: "Team access & roles" },
  { id: "security",      label: "Security",      icon: <Shield      size={15} />, desc: "Auth & permissions" },
  { id: "danger",        label: "Danger Zone",   icon: <Trash2      size={15} />, desc: "Destructive actions", },
];

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-emerald-500" : "bg-zinc-700"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ── Setting row ───────────────────────────────────────────────────────────────
function SettingRow({
  label,
  description,
  action,
}: {
  label: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function SectionCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border"
      style={{ background: SURFACE, borderColor: BORDER }}
    >
      {/* Top shimmer */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg,transparent,rgba(34,197,94,0.2),transparent)" }}
      />
      <div className="border-b px-6 py-4" style={{ borderColor: BORDER }}>
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-emerald-400"
              style={{ background: "rgba(34,197,94,0.1)" }}
            >
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-sm font-semibold text-white">{title}</h2>
            {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="px-6">{children}</div>
    </div>
  );
}

// ── GENERAL section ───────────────────────────────────────────────────────────
function GeneralSection({ workspaceId }: { workspaceId: string }) {
  const { data: workspace } = useWorkspace(workspaceId);
  const { mutate: updateWorkspace, isPending } = useUpdateWorkspace(workspaceId);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<UpdateWorkspaceInput>({
    resolver: zodResolver(UpdateWorkspaceSchema),
    defaultValues: { name: "", slug: "" },
  });

  const nameValue = watch("name", "");
  const slugValue = watch("slug", "");

  useEffect(() => {
    if (workspace) reset({ name: workspace.name, slug: workspace.slug });
  }, [workspace, reset]);

  useEffect(() => {
    if (!slugManuallyEdited && nameValue && workspace && nameValue !== workspace.name) {
      setValue("slug", generateSlug(nameValue));
    }
  }, [nameValue, slugManuallyEdited, workspace, setValue]);

  function onSubmit(data: UpdateWorkspaceInput) {
    updateWorkspace(data, {
      onSuccess: () => {
        setSaved(true);
        setSlugManuallyEdited(false);
        setTimeout(() => setSaved(false), 2500);
      },
      onError: (err) => setError("root", { message: extractErrorMessage(err) }),
    });
  }

  function copySlug() {
    void navigator.clipboard.writeText(`teamsync.app/${slugValue}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const inputCls =
    "w-full rounded-xl border bg-zinc-900/60 px-4 py-2.5 text-sm text-white placeholder-zinc-600 transition-all focus:outline-none focus:ring-1 focus:ring-emerald-500/30";
  const inputBorder = "border-white/8 focus:border-emerald-500/30";

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SectionCard
        title="Workspace"
        subtitle="Update your workspace name and URL slug"
        icon={<Globe size={16} />}
      >
        {errors.root && <ErrorBanner message={errors.root.message ?? ""} className="mt-4" />}

        <div className="space-y-5 py-5">
          {/* Name field */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400" htmlFor="ws-name">
              Workspace name
            </label>
            <input
              id="ws-name"
              type="text"
              placeholder="My Workspace"
              {...register("name")}
              className={`${inputCls} ${inputBorder}`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* Slug field */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400" htmlFor="ws-slug">
              URL slug
            </label>
            <div
              className="flex items-center overflow-hidden rounded-xl border transition-all focus-within:border-emerald-500/30 focus-within:ring-1 focus-within:ring-emerald-500/20"
              style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(24,28,26,0.6)" }}
            >
              <span className="border-r px-3 py-2.5 text-xs font-medium text-zinc-600" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                teamsync.app/
              </span>
              <input
                id="ws-slug"
                type="text"
                {...register("slug", { onChange: () => setSlugManuallyEdited(true) })}
                className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={copySlug}
                title="Copy URL"
                className="mr-2 flex h-7 w-7 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:text-zinc-300"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
            </div>
            {errors.slug && (
              <p className="mt-1 text-xs text-red-400">{errors.slug.message}</p>
            )}
          </div>

          {/* Workspace ID (read-only) */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Workspace ID
            </label>
            <div
              className="flex items-center rounded-xl border px-4 py-2.5"
              style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
            >
              <span className="flex-1 font-mono text-xs text-zinc-600">{workspaceId}</span>
              <button
                type="button"
                onClick={() => { void navigator.clipboard.writeText(workspaceId); }}
                className="text-zinc-700 transition-colors hover:text-zinc-400"
              >
                <Copy size={12} />
              </button>
            </div>
          </div>

          {/* Save row */}
          <div className="flex items-center justify-between pt-1">
            {saved ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 size={13} />
                Changes saved
              </span>
            ) : (
              <span className="text-xs text-zinc-700">
                {isDirty ? "You have unsaved changes" : ""}
              </span>
            )}
            <button
              type="submit"
              disabled={isPending || !isDirty}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-semibold text-black transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPending ? (
                <>
                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Appearance placeholder */}
      <div className="mt-5">
        <SectionCard
          title="Appearance"
          subtitle="Customize your workspace branding"
          icon={<Palette size={16} />}
        >
          <div className="py-5">
            <SettingRow
              label="Workspace color"
              description="Choose the accent color used across your workspace"
              action={
                <div className="flex items-center gap-2">
                  {["#22c55e", "#6366f1", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`h-6 w-6 rounded-full ring-offset-[#111814] transition-all hover:ring-2 hover:ring-white/30 hover:ring-offset-2 ${c === "#22c55e" ? "ring-2 ring-white/40 ring-offset-2" : ""}`}
                      style={{ background: c }}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                </div>
              }
            />
            <div className="border-t" style={{ borderColor: BORDER }} />
            <SettingRow
              label="Workspace icon"
              description="Upload a logo or icon for your workspace"
              action={
                <button
                  type="button"
                  className="rounded-xl border px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-emerald-500/30 hover:text-zinc-200"
                  style={{ borderColor: "rgba(255,255,255,0.08)" }}
                >
                  Upload
                </button>
              }
            />
          </div>
        </SectionCard>
      </div>
    </form>
  );
}

// ── NOTIFICATIONS section ─────────────────────────────────────────────────────
type NotifKey =
  | "task_assigned"
  | "task_mentioned"
  | "status_changed"
  | "comment_added"
  | "member_joined"
  | "due_soon"
  | "overdue"
  | "daily_digest";

const NOTIF_GROUPS: {
  group: string;
  items: { key: NotifKey; label: string; description: string; defaultOn: boolean }[];
}[] = [
  {
    group: "Tasks",
    items: [
      { key: "task_assigned",  label: "Assigned to me",     description: "When a task is assigned to you",            defaultOn: true  },
      { key: "task_mentioned", label: "Mentions",            description: "When someone @mentions you in a comment",   defaultOn: true  },
      { key: "status_changed", label: "Status changes",      description: "When a task you own changes status",        defaultOn: false },
      { key: "comment_added",  label: "New comments",        description: "When someone comments on your task",        defaultOn: true  },
    ],
  },
  {
    group: "Workspace",
    items: [
      { key: "member_joined",  label: "New member",          description: "When someone joins the workspace",          defaultOn: false },
      { key: "due_soon",       label: "Due date reminder",   description: "24 hours before a task is due",            defaultOn: true  },
      { key: "overdue",        label: "Overdue alerts",      description: "When tasks become overdue",                defaultOn: true  },
    ],
  },
  {
    group: "Digest",
    items: [
      { key: "daily_digest",   label: "Daily summary",       description: "Morning digest of pending and overdue tasks", defaultOn: false },
    ],
  },
];

function NotificationsSection() {
  const [state, setState] = useState<Record<NotifKey, boolean>>(() => {
    const init: Partial<Record<NotifKey, boolean>> = {};
    NOTIF_GROUPS.forEach((g) => g.items.forEach((i) => { init[i.key] = i.defaultOn; }));
    return init as Record<NotifKey, boolean>;
  });

  function toggle(key: NotifKey) {
    setState((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <SectionCard
      title="Notifications"
      subtitle="Control which alerts you receive"
      icon={<Bell size={16} />}
    >
      <div className="pb-4">
        {NOTIF_GROUPS.map((g, gi) => (
          <div key={g.group}>
            {gi > 0 && <div className="border-t" style={{ borderColor: BORDER }} />}
            <p className="pt-5 pb-1 text-[11px] font-bold uppercase tracking-widest text-zinc-600">
              {g.group}
            </p>
            {g.items.map((item) => (
              <SettingRow
                key={item.key}
                label={item.label}
                description={item.description}
                action={
                  <Toggle
                    id={item.key}
                    checked={state[item.key]}
                    onChange={() => toggle(item.key)}
                  />
                }
              />
            ))}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ── MEMBERS section ───────────────────────────────────────────────────────────
const ROLE_BADGE: Record<string, string> = {
  OWNER:  "bg-amber-500/10 text-amber-300 border-amber-500/20",
  ADMIN:  "bg-violet-500/10 text-violet-300 border-violet-500/20",
  MEMBER: "bg-zinc-700/50 text-zinc-400 border-zinc-600/20",
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-emerald-700", "bg-violet-700", "bg-sky-700",
  "bg-amber-700",   "bg-pink-700",   "bg-teal-700",
];

function avatarBg(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0x7fffffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function MembersSection({ workspaceId }: { workspaceId: string }) {
  const { data: members } = useWorkspaceMembers(workspaceId);

  return (
    <SectionCard
      title="Members"
      subtitle="Everyone with access to this workspace"
      icon={<Users size={16} />}
    >
      <div className="pb-4">
        {/* Invite strip */}
        <div
          className="my-4 flex items-center gap-3 rounded-xl border p-3"
          style={{ borderColor: "rgba(34,197,94,0.12)", background: "rgba(34,197,94,0.04)" }}
        >
          <div className="flex-1">
            <p className="text-xs font-medium text-zinc-300">Invite team members</p>
            <p className="text-[11px] text-zinc-600">Share a link or send email invitations</p>
          </div>
          <button
            type="button"
            className="rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-black transition-all hover:bg-emerald-400"
          >
            Invite
          </button>
        </div>

        {/* Member list */}
        <div className="border-t" style={{ borderColor: BORDER }} />
        {!members || members.length === 0 ? (
          <p className="py-6 text-center text-xs text-zinc-600">No members yet.</p>
        ) : (
          <div className="divide-y" style={{ "--tw-divide-opacity": 1, borderColor: BORDER } as React.CSSProperties}>
            {members.map((m) => (
              <div key={m.userId} className="flex items-center gap-3 py-3.5">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ring-1 ring-black/30 ${avatarBg(m.userId)}`}
                >
                  {initials(m.user.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-200">{m.user.name}</p>
                  <p className="text-xs text-zinc-600">{m.user.email}</p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${ROLE_BADGE[m.role] ?? ROLE_BADGE.MEMBER}`}
                >
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ── SECURITY section ──────────────────────────────────────────────────────────
function SecuritySection() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [auditLogs, setAuditLogs] = useState(true);

  return (
    <SectionCard
      title="Security"
      subtitle="Authentication and access control"
      icon={<Shield size={16} />}
    >
      <div className="pb-4">
        <SettingRow
          label="Two-factor authentication"
          description="Require 2FA for all workspace members"
          action={<Toggle id="mfa" checked={mfaEnabled} onChange={setMfaEnabled} />}
        />
        <div className="border-t" style={{ borderColor: BORDER }} />
        <SettingRow
          label="Single sign-on (SSO)"
          description="Allow members to sign in via your identity provider"
          action={<Toggle id="sso" checked={ssoEnabled} onChange={setSsoEnabled} />}
        />
        <div className="border-t" style={{ borderColor: BORDER }} />
        <SettingRow
          label="Audit log"
          description="Track member activity and changes in the workspace"
          action={<Toggle id="audit" checked={auditLogs} onChange={setAuditLogs} />}
        />
        <div className="border-t" style={{ borderColor: BORDER }} />
        <SettingRow
          label="Session timeout"
          description="Automatically sign out inactive members after"
          action={
            <select
              className="rounded-xl border bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 focus:outline-none"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
              defaultValue="7d"
            >
              <option value="1d">1 day</option>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="never">Never</option>
            </select>
          }
        />
        <div className="border-t" style={{ borderColor: BORDER }} />
        <SettingRow
          label="Export data"
          description="Download all workspace data as a JSON archive"
          action={
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-emerald-500/30 hover:text-zinc-200"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <Download size={12} />
              Export
            </button>
          }
        />
      </div>
    </SectionCard>
  );
}

// ── DANGER ZONE section ───────────────────────────────────────────────────────
function DangerSection() {
  const [confirmText, setConfirmText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border"
      style={{ borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.03)" }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg,transparent,rgba(239,68,68,0.3),transparent)" }}
      />
      <div className="border-b px-6 py-4" style={{ borderColor: "rgba(239,68,68,0.1)" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl text-red-400" style={{ background: "rgba(239,68,68,0.1)" }}>
            <AlertTriangle size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
            <p className="text-xs text-zinc-500">Actions here are permanent and cannot be undone</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-5">
        <div className="space-y-4">
          {/* Reset tasks */}
          <div
            className="flex items-center justify-between rounded-xl border p-4"
            style={{ borderColor: "rgba(239,68,68,0.1)", background: "rgba(239,68,68,0.03)" }}
          >
            <div>
              <p className="text-sm font-medium text-zinc-200">Clear all tasks</p>
              <p className="text-xs text-zinc-500">Permanently delete all tasks in this workspace</p>
            </div>
            <button
              type="button"
              className="rounded-xl border border-red-500/25 px-4 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
            >
              Clear tasks
            </button>
          </div>

          {/* Delete workspace */}
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: "rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.04)" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-200">Delete workspace</p>
                <p className="text-xs text-zinc-500">
                  Permanently delete this workspace and all its data. This action cannot be undone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="ml-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
              >
                Delete workspace
              </button>
            </div>

            {showConfirm && (
              <div
                className="mt-3 rounded-xl border p-4"
                style={{ borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)" }}
              >
                <p className="mb-3 text-xs text-zinc-400">
                  Type <span className="font-semibold text-white">delete workspace</span> to confirm:
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="delete workspace"
                    className="flex-1 rounded-xl border border-red-500/20 bg-zinc-900 px-4 py-2 text-sm text-white placeholder-zinc-700 focus:border-red-500/40 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={confirmText !== "delete workspace"}
                    className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Confirm delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function SettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [active, setActive] = useState<Section>("general");

  const renderSection = () => {
    switch (active) {
      case "general":       return <GeneralSection workspaceId={workspaceId!} />;
      case "notifications": return <NotificationsSection />;
      case "members":       return <MembersSection workspaceId={workspaceId!} />;
      case "security":      return <SecuritySection />;
      case "danger":        return <DangerSection />;
    }
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#0b0f0c" }}>
      {/* ── Sidebar ── */}
      <div
        className="hidden w-56 shrink-0 flex-col border-r md:flex"
        style={{ background: SURFACE, borderColor: BORDER }}
      >
        <div className="border-b px-4 py-4" style={{ borderColor: BORDER }}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-600">Settings</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id;
            const isDanger = item.id === "danger";
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item.id)}
                className={[
                  "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all",
                  isActive
                    ? isDanger
                      ? "bg-red-500/8 text-red-400"
                      : "bg-emerald-500/8 text-emerald-300"
                    : isDanger
                    ? "text-red-500/60 hover:bg-red-500/5 hover:text-red-400"
                    : "text-zinc-500 hover:bg-white/4 hover:text-zinc-300",
                ].join(" ")}
              >
                <span className={isActive ? "" : "opacity-60 group-hover:opacity-100"}>
                  {item.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{item.label}</p>
                </div>
                {isActive && (
                  <ChevronRight
                    size={12}
                    className={isDanger ? "text-red-400/50" : "text-emerald-500/60"}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t p-4" style={{ borderColor: BORDER }}>
          <p className="text-[10px] text-zinc-700">TeamSync · Workspace settings</p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile tab nav */}
        <div
          className="flex shrink-0 gap-1 overflow-x-auto border-b p-2 md:hidden"
          style={{ borderColor: BORDER, background: SURFACE }}
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              className={[
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                active === item.id
                  ? item.id === "danger"
                    ? "bg-red-500/10 text-red-400"
                    : "bg-emerald-500/10 text-emerald-300"
                  : "text-zinc-500 hover:text-zinc-300",
              ].join(" ")}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* Section header */}
        <div className="shrink-0 border-b px-6 py-4" style={{ borderColor: BORDER }}>
          {(() => {
            const nav = NAV_ITEMS.find((n) => n.id === active)!;
            return (
              <div>
                <h1 className="text-base font-semibold text-white">{nav.label}</h1>
                <p className="text-xs text-zinc-500">{nav.desc}</p>
              </div>
            );
          })()}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-2xl">{renderSection()}</div>
        </div>
      </div>
    </div>
  );
}
