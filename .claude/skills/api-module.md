# Skill: Build a Backend API Module

**Load this skill when:** asked to build a new feature on the backend — auth, workspaces, projects, tasks, epics, invitations, analytics, or any new `modules/<feature>/` slice.

## The procedure (follow in order)

### 1. Plan before coding

Write a short plan in chat with:
- The endpoints (method + path + purpose)
- The zod schemas (input shapes)
- The service functions (one per use case, pure-ish, takes plain inputs)
- The Prisma queries you'll need and any new indexes required
- Any middleware you'll wire up (`requireAuth`, `requireRole`, etc.)
- The trickiest part (usually: transactions, authorization, or pagination)

Wait for approval before writing code.

### 2. Create the files

For feature `X`, create:

```
src/modules/X/
├── X.schemas.ts       zod schemas + inferred types
├── X.service.ts       business logic, Prisma calls
├── X.controller.ts    thin — parse, call service, respond
└── X.routes.ts        Express Router wiring paths to controller
```

Then mount in `src/app.ts`:

```ts
import { xRouter } from "./modules/X/X.routes";
app.use("/api/X", xRouter);
```

### 3. File templates

**X.schemas.ts**

```ts
import { z } from "zod";

export const CreateXSchema = z.object({
  name: z.string().min(1).max(100),
  // ...
});
export type CreateXInput = z.infer<typeof CreateXSchema>;

export const UpdateXSchema = CreateXSchema.partial();
export type UpdateXInput = z.infer<typeof UpdateXSchema>;
```

**X.service.ts**

```ts
import { prisma } from "../../config/prisma";
import { HttpError } from "../../utils/http-error";
import type { CreateXInput } from "./X.schemas";

export async function createX(userId: string, input: CreateXInput) {
  // Authorization checks here (or via middleware — whichever makes sense)
  // Business logic here
  // Prisma calls here
  return prisma.x.create({ data: { ...input, createdById: userId } });
}
```

**X.controller.ts**

```ts
import type { Request, Response, NextFunction } from "express";
import { CreateXSchema } from "./X.schemas";
import * as service from "./X.service";

export async function createX(req: Request, res: Response, next: NextFunction) {
  try {
    const body = CreateXSchema.parse(req.body);
    const result = await service.createX(req.user!.id, body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
```

**X.routes.ts**

```ts
import { Router } from "express";
import { requireAuth } from "../../middleware/require-auth";
import * as controller from "./X.controller";

export const xRouter = Router();

xRouter.use(requireAuth);
xRouter.post("/", controller.createX);
// ...
```

### 4. For workspace-scoped features (projects, tasks, epics)

Routes usually live under `/api/workspaces/:workspaceId/<feature>`. The `:workspaceId` param is checked by `requireRole(workspaceId, [...])` middleware which:
1. Looks up `Membership(userId, workspaceId)` in the DB
2. 403s if not a member or role doesn't match
3. Attaches `req.membership` so handlers know the effective role

### 5. Test before declaring done

- `npm run dev` — server starts clean
- `curl` or REST client: happy path works
- `curl` or REST client: unauthorized request returns 401 (or 403)
- `curl` with invalid body: returns 400 with zod details
- Open Prisma Studio to confirm the DB state

### 6. If you add a new filter or sort

Check `schema.prisma` for a matching composite index. If missing, add it and create a migration:

```cmd
npx prisma migrate dev --name add_<feature>_<filter>_index
```

## Anti-patterns to avoid

- ❌ Writing Prisma calls inside controllers
- ❌ Creating a new `PrismaClient` — always import the shared one
- ❌ Wrapping every controller in try/catch that re-throws — use `next(err)` once
- ❌ Returning the full User object (contains `passwordHash`) — select safe fields only
- ❌ Adding a role check via `if (req.user.role === "ADMIN")` — use `requireRole` middleware so rules are centralized
- ❌ Skipping zod validation and accessing `req.body.x` directly
