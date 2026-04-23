# TeamSync Backend — Claude Code Conventions

You are working in the **backend** of TeamSync (`server/`). This file is loaded alongside the root `CLAUDE.md`. It holds backend-specific patterns, known gotchas, and the conventions every module follows.

---

## Stack

- **Express 5** — async route handlers propagate errors automatically. Do NOT wrap in try/catch just to re-throw. Use try/catch only when you need to transform the error.
- **Prisma 6** + PostgreSQL 16
- **TypeScript strict mode**, `moduleResolution: node16`
- **ts-node-dev** for dev reload — file saves hot-reload automatically. No manual restart needed.
- **nodemailer** for SMTP email (Gmail configured in `.env`)
- **bcrypt** (cost 10) for passwords
- **zod** for all request + env validation

---

## Folder Layout

```
server/src/
├── app.ts                    Express app, middleware chain, route mounting
├── index.ts                  Bootstrap + graceful shutdown (SIGINT/SIGTERM)
├── config/
│   ├── env.ts                Zod-validated env vars. Import `env` from here.
│   └── prisma.ts             Shared PrismaClient. NEVER new PrismaClient() elsewhere.
├── middleware/
│   ├── require-auth.ts       Parses access_token cookie → req.user
│   ├── require-workspace-member.ts  Auth + Membership lookup → req.membership
│   ├── require-membership.ts Combined variant
│   ├── require-role.ts       requireRole("ADMIN", "OWNER") — checks req.membership.role
│   └── rate-limit.ts         Auth endpoint rate limiting
├── utils/
│   ├── http-error.ts         HttpError(status, message) — throw this for known errors
│   ├── jwt.ts                signAccessToken / verifyAccessToken
│   ├── cookies.ts            setAuthCookies(res, tokens) / clearAuthCookies(res)
│   └── email.ts              sendEmail (fire-and-forget), sendInvitationEmail,
│                             sendTaskAssignedEmail, sendTaskCompletedEmail
├── types/
│   └── express.d.ts          req.user: { id, email, name } | req.membership: { ... }
└── modules/<feature>/
    ├── <feature>.routes.ts       Router, maps paths → middleware chain → controller fn
    ├── <feature>.controller.ts   Thin: parse req → call service → res.json()
    ├── <feature>.service.ts      All Prisma calls + business logic
    └── <feature>.schemas.ts      Zod schemas + inferred Input types
```

---

## Naming Rules

| Thing | Convention |
|---|---|
| Route files | `<feature>.routes.ts` exporting `<feature>Router` |
| Services | Named exports (no classes): `export async function createWorkspace(...)` |
| Zod schemas | `<Action><Feature>Schema` — e.g. `CreateWorkspaceSchema` |
| Inferred TS types | `type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>` |
| Middleware | `requireAuth`, `requireRole`, `requireWorkspaceMember` (camelCase verb) |

---

## Middleware Shorthand (in routes files)

```ts
const member       = [requireAuth, requireWorkspaceMember()];
const adminOrOwner = [...member, requireRole("ADMIN", "OWNER")];

router.get("/...",   ...member,       ctrl.list);
router.post("/...",  ...member,       ctrl.create);
router.patch("/...", ...adminOrOwner, ctrl.update);
```

---

## Error Handling

Throw `HttpError` for any known/expected error. The global handler in `app.ts` handles it:

```ts
// In service:
throw new HttpError(404, "Task not found");
throw new HttpError(409, "Slug already in use");
throw new HttpError(403, "Cannot remove the workspace owner");

// ZodError thrown by schema.parse() → 400 with fieldErrors (handled automatically)
// Unknown errors → 500 (logged, generic message to client)
```

Never return raw error details to the client. `HttpError.message` is surfaced; stack traces never are.

---

## Prisma Rules

- **Import from `../../config/prisma`**. Never `new PrismaClient()` anywhere else.
- **`select` explicitly** for user-facing data. Never return `passwordHash`, full `RefreshToken` rows, etc.
- **`include` leaks** full related objects — prefer `select` nested inside queries.
- **Transactions for multi-table writes**:

```ts
// CORRECT — tx is the in-transaction client
await prisma.$transaction(async (tx) => {
  const ws = await tx.workspace.create({ data: { ... } });
  await tx.membership.create({ data: { workspaceId: ws.id, ... } });
});

// WRONG — prisma (outer client) escapes the transaction
await prisma.$transaction(async (tx) => {
  const ws = await tx.workspace.create({ data: { ... } });
  await prisma.membership.create({ ... });   // ← BUG
});
```

- **Ordered deletes to avoid FK constraint races**. When deleting a project tree manually, do: tasks → epics → projects. Do NOT rely on cascades to handle all paths simultaneously — Prisma's SET NULL (epicId) and CASCADE (projectId) fire concurrently and race on the Task table.

```ts
// CORRECT cascade manual order
await prisma.task.deleteMany({ where: { projectId: { in: projectIds } } });
await prisma.epic.deleteMany({ where: { projectId: { in: projectIds } } });
await prisma.project.deleteMany({ where: { workspaceId } });
```

---

## Cursor Pagination Pattern

```ts
const tasks = await prisma.task.findMany({
  where: { projectId, ...filters },
  take: 20,
  skip: cursor ? 1 : 0,
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  select: { ... },
});

const nextCursor = tasks.length === 20 ? tasks[tasks.length - 1].id : null;
return { tasks, nextCursor };
```

Never use offset pagination on large tables. The task list uses this pattern.

---

## Auth / Cookies

- **Access token**: short-lived (~15 min), `access_token` httpOnly cookie
- **Refresh token**: opaque 32-byte random hex, hashed (SHA-256) before storage in `RefreshToken` table. ~7 day TTL. Rotated on every use.
- **Reuse detection**: when a refresh token is presented that has already been revoked (`revokedAt` is set), the entire user's token family is revoked (all sessions logged out).
- **Cookie flags**: `httpOnly: true`, `sameSite: "strict"`, `secure: env.NODE_ENV === "production"`, `path: "/api"`
- **On logout**: clear both cookies AND mark the refresh token revoked in DB.

---

## Email

`sendEmail()` is **fire-and-forget** — it never throws and never awaits. Call it after the primary DB operation succeeds:

```ts
// After prisma.invitation.create(...)
sendInvitationEmail(email, workspace.name, inviter.name, token, env.CLIENT_URL);
// ↑ returns void immediately; failure is logged but does not fail the response
```

Email is skipped silently if `SMTP_HOST` is empty. The frontend shows "Invitation sent!" whether or not email is configured — correct behavior.

Available email functions:
- `sendInvitationEmail(to, workspaceName, inviterName, token, clientUrl)` — invite link email
- `sendTaskAssignedEmail(to, assigneeName, taskTitle, projectName)` — task assigned notification
- `sendTaskCompletedEmail(to, creatorName, taskTitle, completedByName)` — task done notification

---

## Request Validation Pattern

```ts
// In controller:
export async function create(req: Request, res: Response) {
  const input = CreateTaskSchema.parse(req.body);   // throws ZodError on invalid
  const task = await svc.createTask(req.membership!.workspaceId, input, req.user!.id);
  res.status(201).json({ task });
}
```

- `req.user` — set by `requireAuth` middleware
- `req.membership` — set by `requireWorkspaceMember` middleware
- Both are non-null after their respective middleware runs (use `!` assertion in controllers)

---

## Multi-Tenant Security

Every workspace-scoped query MUST filter by `workspaceId` derived from `req.membership.workspaceId` (set by middleware from the authenticated Membership row), NOT from `req.params.workspaceId` or `req.body.workspaceId` alone.

```ts
// CORRECT
const tasks = await prisma.task.findMany({
  where: { projectId, project: { workspaceId: req.membership!.workspaceId } },
});

// WRONG — trusts the client
const tasks = await prisma.task.findMany({
  where: { projectId: req.body.projectId },  // ← user could supply any projectId
});
```

---

## Current API Surface

All routes prefix `/api/`:

```
POST   /auth/signup
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me

GET    /workspaces
POST   /workspaces
GET    /workspaces/:id
PATCH  /workspaces/:id                   [ADMIN, OWNER]
GET    /workspaces/:id/members
DELETE /workspaces/:id/members/:userId   [ADMIN, OWNER]
GET    /workspaces/:id/analytics
POST   /workspaces/:id/seed-demo         (?force=true resets and re-seeds)

GET    /workspaces/:wsId/projects
POST   /workspaces/:wsId/projects
GET    /workspaces/:wsId/projects/:id
PATCH  /workspaces/:wsId/projects/:id    [ADMIN, OWNER]
DELETE /workspaces/:wsId/projects/:id    [ADMIN, OWNER]

GET    /projects/:projId/epics
POST   /projects/:projId/epics
PATCH  /projects/:projId/epics/:id
DELETE /projects/:projId/epics/:id

GET    /projects/:projId/tasks           cursor pagination + filters
POST   /projects/:projId/tasks
GET    /projects/:projId/tasks/:id
PATCH  /projects/:projId/tasks/:id
DELETE /projects/:projId/tasks/:id
GET    /projects/:projId/tasks/:id/comments
POST   /projects/:projId/tasks/:id/comments

GET    /workspaces/:wsId/invitations     [ADMIN, OWNER]
POST   /workspaces/:wsId/invitations     [ADMIN, OWNER] — sends SMTP email
DELETE /workspaces/:wsId/invitations/:id [ADMIN, OWNER]
POST   /invitations/accept               (public — token in body)
```

---

## Known Issues / Gotchas

- **`moduleResolution: node10 is deprecated`** → both `module` and `moduleResolution` must be `"node16"` in tsconfig.json.
- **`"Environment variable not found: DATABASE_URL"`** → `prisma.config.ts` is missing `import "dotenv/config"` at the top.
- **TypeScript `rootDir` error** → `tsconfig.json` needs explicit `rootDir` and `outDir`.
- **CORS error from frontend** → must have `credentials: true` in the cors config AND `withCredentials: true` in the Axios instance.
- **Cascade delete FK race** → when manually deleting a project tree, always delete in order: tasks → epics → projects. Prisma's concurrent cascade paths (SET NULL on epicId, CASCADE on projectId) race on the Task row in PostgreSQL.

---

## Verification After Changes

1. `npx tsc --noEmit` — must be zero errors
2. Hit the endpoint with curl or check server logs
3. `npx prisma studio` to verify DB state if needed
4. `curl http://localhost:5000/api/health` — confirms server + DB alive
