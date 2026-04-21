# Rules: Code Style

Don't bikeshed on style — follow these and move on.

## TypeScript

1. **`strict: true`** is on. If TypeScript complains, fix the types. Do not `// @ts-ignore` or `as any`.
2. **Prefer `type` over `interface`** for simple shapes. Use `interface` when you need declaration merging.
3. **No default exports** in backend code. Named exports only — they're greppable and refactor-safe. (Frontend React components are the exception — default-export page/component files.)
4. **Use `import type` for type-only imports.** Keeps runtime imports clean.

```ts
import type { Request, Response } from "express";
import { Router } from "express";
```

5. **`unknown`, not `any`, in error handlers.** Narrow with type guards.

## Naming

6. **Files:** kebab-case for configs (`prisma.config.ts`), kebab-case or dot-notation for modules (`auth.service.ts`, `require-auth.ts`). Pick one and stay consistent within a folder.
7. **Types and interfaces:** PascalCase (`Workspace`, `CreateTaskInput`).
8. **Constants:** SCREAMING_SNAKE_CASE only for true compile-time constants. Otherwise camelCase.
9. **Functions:** verbs (`createTask`, `getUserById`, `sendInvitation`).
10. **Booleans:** start with `is`, `has`, `can`, `should` (`isAuthenticated`, `hasAccess`).
11. **Route paths:** lowercase, kebab-case (`/api/workspaces/:workspaceId/task-boards`). Plural nouns for collections.

## Imports

12. **Order:**
    1. Node built-ins (`node:path`, `node:crypto`)
    2. Third-party (`express`, `zod`)
    3. Internal absolute (if you set up path aliases)
    4. Relative (`./x`, `../y`)
13. **No unused imports.** Most editors can do this on save — enable it.

## Structure

14. **Functions do one thing.** If a service function does two things (creates a workspace AND sends an email), split them.
15. **Max ~80 lines per function.** Longer = probably needs to be broken up.
16. **Early return over deep nesting.** If the request is invalid, return. Don't wrap the whole function body in a giant `if`.
17. **Avoid `else` after `return`.** Just return.

## Comments

18. **Comment why, not what.** Good: `// Prisma 6 doesn't support X on Postgres — workaround`. Bad: `// Create the user`.
19. **Delete commented-out code.** Git remembers. Commented code is noise.
20. **Use JSDoc on exported service functions** — at least a one-line description. Helps IDE hover tooltips.

## Express / server

21. **Async route handlers in Express 5 propagate errors automatically.** You don't need try/catch just to re-throw. Use try/catch only if you need to transform the error.
22. **Middleware order matters.** The chain in `app.ts`: cors → body parsers → cookie parser → routes → 404 → error handler. Error handler is last, with 4 args `(err, req, res, next)`.
23. **Respond with JSON.** No HTML, no plaintext, except on `/api/health`.
24. **HTTP status codes that matter:** 200 (ok), 201 (created), 204 (no content — for deletes), 400 (bad input), 401 (not authed), 403 (authed but forbidden), 404 (not found), 409 (conflict — e.g. email taken), 500 (server error).

## React / frontend (for later)

25. **Components: function components with hooks only.** No class components.
26. **One component per file.** File name = component name.
27. **Props: destructure in the signature.** `function Thing({ a, b }: Props)`.
28. **Extract hooks early.** If a component has 30+ lines of hooks, pull them into a custom hook.
29. **Keep JSX clean.** No inline logic chains — extract to variables or small helpers.

## Git commits

30. **Present-tense, imperative, under 72 chars for the subject line.** `add task priority filter`, not `added task priority filter` or `Added task priority filter.`.
31. **One concern per commit.** A commit that both renames files and adds a feature is two commits.
32. **Migration commits include the generated SQL.** Don't commit the schema change without `prisma/migrations/<n>/migration.sql`.
