# Skill: Prisma Schema Changes and Migrations

**Load this skill when:** asked to add a field, add a model, change a relation, add an index, or run migrations.

## The rule

Every schema change goes through `prisma migrate dev`. Never hand-edit the database. Never hand-edit a generated migration file unless you explicitly need a data migration the autogenerator can't do (ask first).

## Procedure

### 1. Edit `prisma/schema.prisma`

- Add new fields with a `?` (nullable) first if the table has existing rows. A non-null new column with no default will fail migration on a non-empty DB.
- If the field should eventually be NOT NULL, plan a two-step migration: add nullable → backfill → make non-null.
- For every new filter/sort column on a hot table (Task, Project), add a `@@index([...])` in the same change.
- For uniqueness that depends on scope (e.g. Project key unique within a workspace), use `@@unique([workspaceId, key])`, not `@unique` on the single field.

### 2. Create the migration

```cmd
npx prisma migrate dev --name <short_snake_case_description>
```

Examples of good names:
- `add_task_due_date`
- `add_task_priority_index`
- `make_invitation_token_unique`

Examples of bad names:
- `update` / `fix` / `change` — tells me nothing in 6 months

### 3. Inspect the generated SQL before moving on

Open `prisma/migrations/<timestamp>_<name>/migration.sql`. Sanity check:
- Is it doing what you expected?
- Any destructive ops (`DROP COLUMN`, `DROP TABLE`) — did I intend that?
- Any `ALTER TABLE ... ADD COLUMN ... NOT NULL` on a non-empty table without a default — will fail in prod.

### 4. Regenerate the client (automatic in dev, but)

`migrate dev` automatically runs `prisma generate`. If you skipped the migration (e.g. you're iterating on schema in dev only), run:

```cmd
npx prisma generate
```

to update TypeScript types.

### 5. Verify

- `npx prisma studio` — confirm the new columns/tables exist
- Restart `npm run dev` — Prisma Client is now rebuilt with new types, old types go stale
- Spot-check a query that uses the new field

## If something goes wrong

**"Database is out of sync with schema"** — you edited schema but didn't run migrate. Run `npx prisma migrate dev`.

**"Drift detected"** — someone changed the DB outside Prisma (or a migration was reverted). Either reset (dev only — destroys data: `npx prisma migrate reset`) or investigate what changed and write a corrective migration.

**"Can't reach database"** — Postgres isn't running. Windows: `net start postgresql-x64-16` in an admin CMD.

## When NOT to use migrate dev

- In production. In prod we run `prisma migrate deploy` which applies pending migrations without prompting.
- When all you want is to test a schema change locally without committing the migration. Use `prisma db push` for throwaway experimentation — but ALWAYS run `migrate dev` before committing, because that's what ships.

## Data migrations (when a pure schema change isn't enough)

Example: renaming `Task.description` to `Task.body` while preserving data.

1. Add new column `body String?` (nullable) — `migrate dev --name add_task_body`
2. Write a script or a raw SQL migration to copy `description` into `body`
3. Drop `description` — `migrate dev --name remove_task_description`
4. Make `body` non-null if intended — `migrate dev --name make_task_body_required`

Ask before doing this. Multi-step migrations need coordination with deploys.
