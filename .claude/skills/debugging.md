# Skill: Debugging When Things Break

**Load this skill when:** you've hit an error, a test fails, a request returns unexpected data, or the user says "this isn't working."

## The mindset

The error message is usually telling the truth. Read it carefully before trying a fix. "Retry with a tweak" wastes everyone's time and teaches you nothing.

## The procedure

### 1. Reproduce

Can you hit the same error twice? If not, figure out what's different. Intermittent bugs are almost always (a) race conditions, (b) state leaking between requests, or (c) something cached.

### 2. Read the error, identify the layer

- **TypeScript error** — compile-time, your code doesn't match the types. Don't `// @ts-ignore` it away.
- **Runtime error in Node** — check the stack trace. The first line in YOUR code (not in `node_modules`) is usually where to look.
- **Prisma error** — look at the `code` field. `P2002` = unique constraint violation. `P2025` = record not found. Full list: https://www.prisma.io/docs/reference/api-reference/error-reference
- **Postgres error** — `ECONNREFUSED` means the DB isn't running. `password authentication failed` means the `DATABASE_URL` password is wrong.
- **HTTP 4xx** — the request was malformed. 401 = not authenticated. 403 = authenticated but not authorized. 400 = validation failed (look at the response body for zod details).
- **HTTP 5xx** — your server crashed. Look at the server console.
- **CORS error in browser** — the backend isn't setting the right headers, or `credentials: true` is missing on either side.
- **"Cookie not sent"** — check Secure/SameSite flags. In dev, Secure=true will drop the cookie on http://. Check the Cookie tab in devtools > Application.

### 3. Form a hypothesis

Before changing code, say out loud (or in chat) what you think is wrong and why. "I think the workspaceId is being read before auth runs, because the middleware order has auth after the route handler." This forces the thinking to be concrete.

### 4. Verify the hypothesis cheaply before fixing

- Add a `console.log` at the suspected line
- Query the DB directly in Prisma Studio
- Use `curl -v` to see raw HTTP
- Check the actual value of env vars: `console.log(env)` inside a route (NEVER leave this in)

### 5. Fix, run, confirm

- Make the smallest change that could possibly fix it
- Run it, confirm the fix
- Check the adjacent code to see if the bug could also occur elsewhere

### 6. Remove the debug scaffolding

Pull out the `console.log`s. Don't commit them.

## Common TeamSync-specific gotchas

### "Environment variable not found: DATABASE_URL"
`prisma.config.ts` is missing `import "dotenv/config";` at the very top.

### Prisma migrations "drift detected"
Schema doesn't match DB. In dev, `npx prisma migrate reset` (destroys data, re-applies all migrations). In prod, never reset — investigate.

### 401 on every request after login
Cookie isn't being sent. Check:
1. `withCredentials: true` on axios
2. `credentials: true` in the backend's CORS config
3. Cookie flags: in dev `secure: false`, in prod `secure: true`
4. Correct cookie path — we use `/api`

### "Invalid token" on access-token but refresh works
Access token expired. Frontend should catch 401 on any request, call `/auth/refresh`, then retry the original. Axios interceptor is the right place for this.

### Workspace-scoped query returns data from another workspace
Authorization bug. Every query that touches workspace data MUST filter by `workspaceId` derived from the authenticated Membership, not from the request body. Check the service — is it passing `workspaceId` through `requireRole` output, or trusting `req.body.workspaceId`?

### ts-node-dev keeps crashing with no useful error
Delete `node_modules` + `package-lock.json`, `npm install`, try again. This is rare but real.

### Postgres on Windows: `net start postgresql-x64-16` fails
Run CMD as Administrator. Or use `services.msc` → PostgreSQL → Start.

## What NOT to do when stuck

- ❌ Don't `try/catch` the error away so it's silent. That moves the bug from the current request to a mystery elsewhere.
- ❌ Don't `// @ts-ignore` to make the compiler happy. TypeScript was telling you something real.
- ❌ Don't add `setTimeout` to "wait for things to be ready." There's a real reason the timing is off; find it.
- ❌ Don't rebuild the whole feature from scratch. The 5-minute bug is almost never worth a 2-hour rewrite.
