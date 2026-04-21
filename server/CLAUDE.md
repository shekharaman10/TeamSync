# TeamSync Backend — Claude Code Memory

You are working in the **backend** of TeamSync. This file is loaded in addition to the root `CLAUDE.md`. It holds backend-specific conventions and patterns.

## Stack reminders

- Express 5 (not 4 — async handlers propagate errors automatically, no need to wrap in try/catch for the error-handler)
- Prisma 6 + PostgreSQL 16
- TypeScript strict mode, `moduleResolution: node16`
- Dev reload via `ts-node-dev`

## Folder layout

```
server/src/
├── app.ts                    Express app, middleware chain, route mounting
├── index.ts                  Bootstrap + graceful shutdown
├── config/
│   ├── env.ts                zod-validated env vars. Import `env` from here.
│   └── prisma.ts             Shared PrismaClient. NEVER `new PrismaClient()` elsewhere.
├── middleware/               Cross-cutting: requireAuth, requireRole, errorHandler
├── utils/                    Small helpers: jwt.ts, cookies.ts, http-error.ts
├── types/                    Shared types (e.g. AuthenticatedRequest)
└── modules/<feature>/
    ├── <feature>.routes.ts       Express Router, mounts path → controller
    ├── <feature>.controller.ts   Thin — parse req, call service, respond
    ├── <feature>.service.ts      All Prisma calls + business logic
    └── <feature>.schemas.ts      zod schemas for inputs
```

## Naming rules

- Route files: `<feature>.routes.ts` exporting `<feature>Router`
- Services: `<feature>.service.ts` exporting named functions (NOT a class)
- zod schemas: `<Action><Feature>Schema` — e.g. `CreateWorkspaceSchema`, `UpdateTaskSchema`
- Derived TS types: `<Action><Feature>Input` — e.g. `type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>`

## Error handling

Use a typed `HttpError` class for known errors (404, 403, 400 with reasons). Unknown errors bubble to the global handler, which logs them and returns 500.

```ts
// utils/http-error.ts
export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}
```

In services: `throw new HttpError(404, "Workspace not found")`. In the global error handler: respect `err.status` if it's an HttpError, otherwise 500.

## Prisma rules

- Import `prisma` from `src/config/prisma.ts`. Do NOT create new clients.
- For multi-table writes, use `prisma.$transaction(async (tx) => { ... })` and pass `tx` into all calls inside the callback.
- `select` only the fields you need when returning data to the client — don't leak `passwordHash` etc. Make a "safe user" shape and stick to it.
- Foreign key fields are named `<model>Id` (e.g. `workspaceId`). The relation field is the model name lowercased (e.g. `workspace`).
- When adding a new query filter, check `schema.prisma` for a matching composite index. If none, add one in a new migration before merging.

## Auth / cookies

- Access token: short-lived (~15 min), carried in `access_token` httpOnly cookie
- Refresh token: longer-lived (~7 days), carried in `refresh_token` httpOnly cookie, rotated on each refresh
- On logout: clear both cookies AND invalidate the refresh server-side if we add a refresh token table (TBD)
- Cookie flags: `httpOnly: true`, `sameSite: "strict"`, `secure: env.NODE_ENV === "production"`
- Path: `/api` (so cookies are sent to API but not to unrelated paths)

## Request validation pattern

```ts
// In controller:
const body = CreateWorkspaceSchema.parse(req.body);  // throws ZodError on invalid
const result = await createWorkspace(req.user.id, body);
res.status(201).json(result);
```

Let the global error handler catch `ZodError` and return 400 with `err.flatten()`.

## Verification after changes

Every meaningful change:
1. `npm run dev` — it should not crash on startup (env validation catches a lot)
2. Hit the relevant endpoint with curl or the REST client (see `.vscode/rest-client.http` if it exists, or create one)
3. Open Prisma Studio (`npx prisma studio`) to verify the DB state changed correctly

## Things I've seen break and the fix

- **"Environment variable not found: DATABASE_URL"** → `prisma.config.ts` is missing `import "dotenv/config";` at the top. Fix there.
- **TypeScript `rootDir` error** → `tsconfig.json` must have both `rootDir` and `outDir` set explicitly (TS 6 quirk).
- **`moduleResolution=node10 is deprecated`** → set both `module` and `moduleResolution` to `"node16"`.
- **CORS error from the frontend** → `cors({ origin: env.CLIENT_URL, credentials: true })`. The `credentials: true` is required for cookies to cross origins.
