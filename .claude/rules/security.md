# Rules: Security (Non-negotiable)

These rules are absolute. Violating any of them is a security bug, not a stylistic choice. If a task seems to require breaking one, STOP and ask.

## Auth tokens

1. **Access and refresh tokens live in httpOnly cookies. Never in localStorage, sessionStorage, or any JS-accessible storage.**
2. **Cookie flags (prod):** `httpOnly: true, secure: true, sameSite: "strict", path: "/api"`. In dev, `secure: false` is acceptable because http://localhost isn't https.
3. **Access token: short-lived (~15 min). Refresh token: longer-lived (~7 days). Both rotate on refresh.**
4. **On logout: clear both cookies AND invalidate server-side if we track refresh tokens in the DB.**
5. **Never send tokens in response bodies** (except once, if we ever build a mobile flow — not now).

## Passwords

6. **bcrypt (cost ≥ 10) or argon2. Never MD5, SHA-anything, or a hash without salt.**
7. **Never log passwords. Not plaintext, not hashed. Ever.**
8. **Minimum length enforced server-side — zod schema. Don't rely on the frontend.**
9. **Do not return `passwordHash` from any API.** Ever. Use a safe-select shape.

## Authorization

10. **RBAC is looked up per request via the Membership table. Never encode role in the JWT.** Role changes must take effect immediately.
11. **Every workspace-scoped query MUST filter by a workspaceId derived from an authenticated Membership.** Don't trust `req.body.workspaceId` — verify the user has access.
12. **Default-deny:** a missing `requireAuth` or `requireRole` on a route is a bug. Public routes must be explicitly marked.
13. **Never check permissions in the controller with if-statements.** Use middleware so rules are centralized and can't be forgotten.

## Input handling

14. **Every request body/params/query passes through a zod schema.** Do not read raw `req.body.x`.
15. **Parameterized queries only.** Prisma does this by default — don't switch to `$queryRawUnsafe` without a very good reason and an explicit ask.
16. **Never interpolate user input into SQL, file paths, shell commands, or regex.**

## Secrets

17. **Secrets live in `.env`.** Never commit `.env`. `.env.example` is committed with placeholder values only.
18. **Generate secrets with `crypto.randomBytes(48).toString("hex")`.** Minimum 32 chars — enforced by env validation.
19. **Rotate secrets if they leak.** Assume anything pasted into a chat or screenshot is compromised.

## CORS and headers

20. **CORS whitelist is `env.CLIENT_URL` only.** No `origin: "*"` with credentials — the combination doesn't even work, but don't try.
21. **`Access-Control-Allow-Credentials: true`** on the backend, `withCredentials: true` on the frontend. Both required for cookies.

## Rate limiting and abuse

22. **Auth endpoints (`/login`, `/signup`, `/refresh`) must have rate limiting.** Start with express-rate-limit, tighten if we see abuse.
23. **Invitations expire.** Default 7 days. Accepted invitations are marked and cannot be reused.
24. **Never reveal whether an email is registered in error messages.** "Invalid credentials" is the only acceptable response to a bad login, regardless of whether the email exists.

## Logging

25. **Log auth events** (login success/failure, refresh, logout, role changes). Don't log bodies that contain passwords, tokens, or PII.
26. **Error messages returned to clients are generic.** Detailed errors go to logs. A 500 to the client says "Internal server error," not "ER_DUP_ENTRY in users table."

## Data protection

27. **Cascade deletes on workspace → projects → tasks etc.** When a workspace is deleted, all its data goes. Prevents orphaned rows that leak info.
28. **Do not expose internal ids or stack traces in production responses.**
29. **Hash and salt anything that acts like a password** (API keys, invite tokens — though we use unique random tokens for invites, not hashed).
