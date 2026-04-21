# TeamSync — Claude Code Project Memory

You are working on **TeamSync**, a B2B team project management SaaS (Jira-style). This file is loaded automatically at the start of every session. Treat it as the source of truth for architecture, conventions, and non-negotiable rules.

Full long-form context is in `setup.txt` at the repo root — read it on first session, or any time you're uncertain about scope or intent.

---

## What we're building (one paragraph)

Multi-tenant SaaS where users create workspaces, invite members with roles (OWNER/ADMIN/MEMBER), organize work into projects and epics, and track tasks with status, priority, and assignees. Auth is email+password or Google OAuth, sessions are httpOnly cookies (no localStorage tokens). Every workspace is isolated — a user in Workspace A must never see Workspace B's data.

## Tech stack

- **Monorepo**: `server/` (backend) + `client/` (frontend, not yet started)
- **Backend**: Node 20+, Express 5, TypeScript (strict), Prisma ORM, PostgreSQL 16
- **Auth**: bcrypt + JWT access/refresh in httpOnly cookies, passport-google-oauth20
- **Validation**: zod everywhere (env, requests, responses where useful)
- **Frontend** (planned): Vite, React, TypeScript, TanStack Query, Zustand, React Hook Form, Tailwind

## Repo layout

```
teamsync/
├── CLAUDE.md                 (this file)
├── setup.txt                 (full project context)
├── .claude/
│   ├── skills/               (reusable "how-to" procedures)
│   └── rules/                (non-negotiable rules by domain)
├── server/                   (backend — see server/CLAUDE.md)
└── client/                   (frontend — planned)
```

Backend uses **module-based layout**: each feature (auth, workspaces, projects, tasks…) owns its own folder under `src/modules/` with its routes, controller, service, validators. Do NOT scatter a feature across flat `controllers/`, `routes/`, `models/` folders.

## Non-negotiable architectural rules

These are the rules that separate this project from a toy app. Never drift.

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

## How I want you to work with me

- **Before writing code for a new feature, produce a short plan** — the files you'll create/modify, the data flow, and the trickiest part. Wait for me to approve.
- **Ask before sweeping changes.** If a task implies touching 5+ files or changing a convention, stop and ask.
- **Run the code you write.** `npm run dev`, curl the endpoint, confirm it behaves as expected. Don't hand back untested code and call it done.
- **When something fails, read the error carefully and tell me what it actually means** — don't just retry with a tweak. Use `.claude/skills/debugging.md`.
- **Prefer the boring, standard solution.** We're not proving cleverness. We're building something that will survive production.
- **Small diffs are better than big rewrites.** If you're about to rewrite a working file, ask.

## What's already done (as of the last session)

- Backend scaffolded, deps installed, TypeScript configured (strict, node16 module resolution)
- Prisma schema defined — 7 models (User, Workspace, Membership, Project, Epic, Task, Invitation), 4 enums
- Initial migration applied; all tables exist in Postgres
- `src/config/env.ts` with zod validation
- `src/config/prisma.ts` shared client
- `src/app.ts` + `src/index.ts` with `/api/health` endpoint proven working end-to-end
- Global error handler + 404 handler + graceful shutdown

## What's next (dependency order — do not shuffle)

1. Auth module (signup, login, refresh, logout) — `.claude/skills/api-module.md` shows the pattern
2. `requireAuth` middleware
3. `requireRole(workspaceId, roles[])` middleware
4. Workspace module (create uses a transaction — see `.claude/rules/database.md`)
5. Invitation module
6. Project module → Epic module → Task module
7. Analytics module (aggregate queries)
8. Seed script
9. Frontend init (Vite + React) and auth integration
10. Task board, workspace switcher, analytics dashboard

## Files to read before acting

- `setup.txt` — full context
- `.claude/skills/<relevant>.md` — load the skill for the task
- `.claude/rules/<relevant>.md` — load the rules that apply
- `server/CLAUDE.md` — backend-specific conventions
- `server/prisma/schema.prisma` — the data model (source of truth)
