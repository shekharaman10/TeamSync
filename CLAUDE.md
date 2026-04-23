# TeamSync — Claude Code Instructions

This file contains behavioral instructions for Claude Code only. For project context, tech stack, data model, and roadmap see [`architecture.md`](architecture.md). For full long-form context see `setup.txt`.

---

## How to work with me

- **Before writing code for a new feature, produce a short plan** — the files you'll create/modify, the data flow, and the trickiest part. Wait for approval.
- **Ask before sweeping changes.** If a task implies touching 5+ files or changing a convention, stop and ask.
- **Run the code you write.** `npm run dev`, curl the endpoint, confirm it behaves as expected. Don't hand back untested code and call it done.
- **When something fails, read the error carefully and explain what it actually means** — don't just retry with a tweak. Use `.claude/skills/debugging.md`.
- **Prefer the boring, standard solution.** Not proving cleverness — building something that survives production.
- **Small diffs are better than big rewrites.** If you're about to rewrite a working file, ask first.

## Non-negotiable architectural rules

1. **RBAC lives in the database, not in tokens.** Look up Membership per request. Role changes must take effect without re-login. Never put role on the JWT.
2. **Auth cookies: httpOnly, Secure (in prod), SameSite=strict.** Never expose tokens to JS. No localStorage for auth.
3. **Multi-table writes use Prisma transactions (`prisma.$transaction`).** Creating a workspace must create the owner Membership atomically. Accepting an invitation must create the Membership and mark the invitation accepted atomically.
4. **Validate at the boundary with zod.** Every controller parses `req.body`, `req.params`, `req.query` through a zod schema before doing anything else. Never trust raw input.
5. **Index filter columns.** When adding a new filter, add a composite index in `schema.prisma`.
6. **Cursor pagination, not offset.** Use the last-seen id + createdAt. Offset pagination breaks at scale.
7. **Controllers are thin; services hold logic.** Controllers parse and respond. Services do the work and own Prisma calls. Business logic must be testable without an HTTP request.
8. **Env validated at startup.** If a required env var is missing, exit loudly. Already implemented in `server/src/config/env.ts`.
9. **No swallowed errors.** Let errors propagate to the global error handler. Log them there.
10. **Multi-tenant isolation is a security requirement.** Every query that touches workspace-scoped data MUST filter by workspaceId derived from an authenticated Membership. Do not trust a workspaceId from the request body alone — verify the user has access.

## Files to read before acting

- `architecture.md` — stack, repo layout, data model, project status
- `setup.txt` — full context
- `.claude/skills/<relevant>.md` — load the skill for the task
- `.claude/rules/<relevant>.md` — load the rules that apply
- `server/CLAUDE.md` — backend-specific conventions
- `server/prisma/schema.prisma` — data model (source of truth)
