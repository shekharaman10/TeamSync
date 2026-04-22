import { useState } from "react";
import { MOCK_MEMBERS, type Role } from "../board/mockData";

const ROLE_BADGE: Record<Role, string> = {
  OWNER:  "bg-teal-500/15 text-teal-300 ring-1 ring-teal-500/30",
  ADMIN:  "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
  MEMBER: "bg-zinc-700/60 text-zinc-400",
};

export function MembersPage() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteSent(true);
    setInviteEmail("");
    setTimeout(() => setInviteSent(false), 3000);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-4">
        <div>
          <h1 className="text-base font-semibold text-white">Members</h1>
          <p className="text-xs text-zinc-500">{MOCK_MEMBERS.length} members in this workspace</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Invite card */}
        <div className="mb-6 rounded-xl border border-white/8 bg-zinc-800/40 p-5">
          <h2 className="mb-1 text-sm font-semibold text-white">Invite a team member</h2>
          <p className="mb-4 text-xs text-zinc-500">They'll receive an email with a link to join this workspace.</p>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 rounded-lg border border-white/8 bg-white/5 px-4 py-2 text-sm text-white placeholder-zinc-600 focus:border-teal-500/40 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-teal-400 px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-teal-300"
            >
              Send invite
            </button>
          </form>
          {inviteSent && (
            <p className="mt-2 text-xs text-teal-400">Invitation sent!</p>
          )}
        </div>

        {/* Member list */}
        <div className="space-y-2">
          {MOCK_MEMBERS.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-4 rounded-xl border border-white/5 bg-zinc-800/40 px-5 py-4 transition-colors hover:bg-zinc-800/60"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${member.color}`}>
                {member.initials}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-100">{member.name}</p>
                <p className="text-xs text-zinc-500">{member.email}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-600">Since {member.joinedAt}</span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${ROLE_BADGE[member.role]}`}>
                  {member.role}
                </span>
                {member.role !== "OWNER" && (
                  <button
                    type="button"
                    title="Remove member"
                    className="rounded p-1 text-zinc-600 transition-colors hover:text-red-400"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
