# Rules: Database & Transactions

## Client usage

1. **One `PrismaClient` per process.** Always import from `src/config/prisma.ts`. Never `new PrismaClient()` elsewhere.
2. **Disconnect on shutdown.** Already handled in `src/index.ts` — don't duplicate.

## Transactions

3. **Any operation that writes to 2+ tables in a way that must be atomic uses `prisma.$transaction`.**
4. **Inside a transaction, use the `tx` parameter, not the top-level `prisma` client** — otherwise the writes escape the transaction.

```ts
// CORRECT
await prisma.$transaction(async (tx) => {
  const workspace = await tx.workspace.create({ data: { ... } });
  await tx.membership.create({ data: { workspaceId: workspace.id, userId, role: "OWNER" } });
});

// WRONG — membership write is NOT in the transaction
await prisma.$transaction(async (tx) => {
  const workspace = await tx.workspace.create({ data: { ... } });
  await prisma.membership.create({ data: { ... } });  // uses outer client!
});
```

5. **Cases that require a transaction in TeamSync:**
   - Create workspace → create owner Membership
   - Accept invitation → create Membership + mark invitation accepted
   - Any future "delete workspace and its data" flow that has cleanup beyond cascades
   - Bulk ops that must all succeed or all fail (e.g. reordering a list)

6. **Keep transactions short.** Don't call external services (HTTP, email) inside a transaction — they hold DB connections open. Do external work before or after.

## Queries

7. **`select` explicitly** for user-facing data. Don't return full rows. At minimum, never return `passwordHash`.

```ts
// Define once, reuse
const safeUserSelect = { id: true, name: true, email: true, avatarUrl: true };
```

8. **`include` vs `select`** — prefer `select` when you want to limit fields. `include` returns the full related object, which may leak fields.

9. **Pagination is cursor-based** on tables expected to grow (Task, probably Epic). Offset is fine on small bounded tables (memberships for a workspace).

```ts
// Cursor pagination pattern
const tasks = await prisma.task.findMany({
  where: { projectId, ...filters },
  take: 20,
  skip: cursor ? 1 : 0,
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: [{ createdAt: "desc" }, { id: "desc" }],
});
```

10. **Filter queries MUST hit an index.** When adding `where: { projectId, status, priority }`, confirm there's a `@@index([projectId, status, priority])` (or a prefix of it) in `schema.prisma`.

## Schema design

11. **Foreign keys: `<model>Id: String`** — matches Prisma convention. The relation field is named after the model lowercased: `workspace: Workspace @relation(...)`.

12. **Cascade deletes on ownership relations** (workspace → projects → tasks). Use `onDelete: SetNull` on soft references (Task → Epic — deleting an epic orphans tasks but doesn't delete them).

13. **Timestamps on every table** — `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`. Not optional.

14. **Composite unique constraints for scoped uniqueness** (e.g. `@@unique([workspaceId, key])` on Project — project keys are unique within a workspace, not globally).

## Data integrity

15. **Never UPDATE or DELETE rows from another user's workspace.** The service layer must verify workspace membership before any mutation.
16. **Soft-delete is opt-in per model**, not a default. Right now nothing is soft-deleted — we use cascade deletes. Revisit if audit requirements come up.

## Raw SQL

17. **Avoid `$queryRawUnsafe`.** Use `$queryRaw` with a tagged template if you need raw SQL — it parameterizes automatically. Ask before introducing raw SQL at all; prefer Prisma's query builder.

## Migrations

18. **Always run `npx prisma migrate dev --name <desc>`** for schema changes. Never hand-edit the DB.
19. **Never commit a `schema.prisma` change without the corresponding migration folder.**
20. **Review generated SQL before committing.** `migration.sql` shows what will actually run.

## Seeding

21. **Seed script is idempotent.** Running it twice doesn't create duplicates. Use `upsert` or check-then-insert.
22. **Seeds use hardcoded IDs or predictable inputs** so downstream tests/demos can reference them.

## Testing against the DB

23. **Integration tests use a separate test DB.** Never run against the dev DB.
24. **Each test wraps work in a transaction that's rolled back** — or uses `prisma migrate reset` between suites. Don't try to clean up manually.
