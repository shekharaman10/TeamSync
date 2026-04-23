# TeamSync — Architecture & Project Context

## Project Objective

TeamSync is a multi-tenant B2B project management SaaS in the spirit of Linear/Jira. Teams create workspaces, invite members with role-based access, organize work into projects and epics, and track tasks across a full status lifecycle. The system is built to enforce clean architectural boundaries, database-level multi-tenant isolation, and RBAC from day one — the kind of architecture that passes a security review and scales to real customers.

**Core capabilities (all implemented):**
- Email/password + Google OAuth authentication with httpOnly cookie sessions
- Multiple workspaces per user, fully isolated per tenant
- Projects → Epics → Tasks hierarchy with status, priority, assignee, due date
- Kanban board with drag-and-drop (dnd-kit), backlog, list, timeline, calendar, analytics views
- RBAC: OWNER / ADMIN / MEMBER enforced via Membership table lookups per request (not JWT claims)
- Workspace invitations via tokenized email links (SMTP, 7-day expiry)
- Task filtering by status / priority / assignee / epic with indexed queries
- Cursor-based pagination on tasks
- Analytics dashboard: completion rate, tasks by status/priority/assignee, burndown
- Demo seed: 2 projects, 6 epics, 30 realistic tasks with force-reset support

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | `server/` (Express API) + `client/` (React SPA) |
| Runtime | Node 20+ |
| Backend framework | Express 5 (async errors propagate automatically) |
| Language | TypeScript strict mode throughout |
| ORM | Prisma 6 + PostgreSQL 16 |
| Auth | bcrypt (cost 10) + JWT access tokens in httpOnly cookies; opaque refresh tokens in DB |
| Validation | zod (env vars, all request bodies/params/query) |
| Email | nodemailer (SMTP — Gmail configured) |
| Frontend bundler | Vite 5 |
| UI framework | React 18 + Tailwind CSS v4 |
| Server state | TanStack Query v5 (React Query) |
| Client state | Zustand |
| Forms | React Hook Form + zod resolver |
| Routing | React Router v6 |
| Drag and drop | @dnd-kit/core + @dnd-kit/sortable |
| Charts | recharts |
| Animations | framer-motion |

---

## Repo Layout

```
teamsync/
├── CLAUDE.md                     Claude Code behavioral instructions
├── architecture.md               This file — architecture, stack, data model
├── setup.txt                     Full onboarding guide and dev commands
├── .claude/
│   ├── skills/                   Reusable how-to procedures for Claude
│   └── rules/                    Non-negotiable rules (code-style, database, security)
│
├── server/                       Express API (port 5000)
│   ├── CLAUDE.md                 Backend-specific Claude conventions
│   ├── package.json
│   ├── tsconfig.json             strict, moduleResolution: node16
│   ├── prisma.config.ts          Loads dotenv, points to schema
│   ├── .env                      Secrets (gitignored)
│   ├── prisma/
│   │   ├── schema.prisma         Source of truth for data model
│   │   └── migrations/           Auto-generated SQL migrations
│   └── src/
│       ├── index.ts              Bootstrap + graceful shutdown (SIGINT/SIGTERM)
│       ├── app.ts                Express app, middleware chain, route mounting
│       ├── config/
│       │   ├── env.ts            Zod-validated env loader — exits on missing vars
│       │   └── prisma.ts         Single shared PrismaClient instance
│       ├── middleware/
│       │   ├── require-auth.ts           Verifies access_token cookie → sets req.user
│       │   ├── require-membership.ts     Looks up Membership → sets req.membership
│       │   ├── require-workspace-member.ts  Combined auth + membership check
│       │   ├── require-role.ts           Checks req.membership.role against allowed roles
│       │   └── rate-limit.ts             express-rate-limit (auth endpoints)
│       ├── middleware/
│       ├── utils/
│       │   ├── http-error.ts     HttpError(status, message) for typed errors
│       │   ├── jwt.ts            signAccessToken / verifyAccessToken
│       │   ├── cookies.ts        setAuthCookies / clearAuthCookies helpers
│       │   └── email.ts          nodemailer wrapper — sendEmail, sendInvitationEmail,
│       │                         sendTaskAssignedEmail, sendTaskCompletedEmail
│       ├── types/
│       │   └── express.d.ts      Augments Request with req.user and req.membership
│       └── modules/
│           ├── auth/
│           │   ├── auth.routes.ts        POST /auth/signup, /login, /refresh, /logout, /me
│           │   ├── auth.controller.ts    Thin — parse → call service → respond
│           │   ├── auth.service.ts       bcrypt, JWT, refresh token rotation + reuse detection
│           │   └── auth.schemas.ts       SignupSchema, LoginSchema
│           ├── workspaces/
│           │   ├── workspaces.routes.ts  CRUD + members + analytics + seed-demo
│           │   ├── workspaces.controller.ts
│           │   ├── workspaces.service.ts  createWorkspace (transaction), listMembers,
│           │   │                          seedDemoData (force-reset), getAnalytics
│           │   └── workspaces.schemas.ts  CreateWorkspaceSchema, UpdateWorkspaceSchema
│           ├── projects/
│           │   ├── projects.routes.ts    CRUD under /workspaces/:id/projects
│           │   ├── projects.controller.ts
│           │   ├── projects.service.ts
│           │   └── projects.schemas.ts
│           ├── epics/
│           │   ├── epics.routes.ts       CRUD under /projects/:id/epics
│           │   ├── epics.controller.ts
│           │   ├── epics.service.ts
│           │   └── epics.schemas.ts
│           ├── tasks/
│           │   ├── tasks.routes.ts       CRUD + comments under /projects/:id/tasks
│           │   ├── tasks.controller.ts
│           │   ├── tasks.service.ts      Cursor pagination, filtering, status updates
│           │   ├── tasks.schemas.ts
│           │   └── comments.service.ts   Task comment creation and retrieval
│           └── invitations/
│               ├── invitations.routes.ts  Create/list/revoke + accept
│               ├── invitations.controller.ts
│               ├── invitations.service.ts  Token creation, email dispatch, atomic accept
│               └── invitations.schemas.ts
│
└── client/                       React SPA (port 5173 in dev)
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts            Proxy: /api → http://localhost:5000
    └── src/
        ├── main.tsx              React entry, mounts RouterProvider + providers
        ├── index.css             Tailwind base, CSS custom properties
        ├── vite-env.d.ts
        ├── app/
        │   ├── router.tsx        createBrowserRouter — all routes defined here
        │   ├── providers.tsx     QueryClientProvider, AuthProvider
        │   └── AppRedirect.tsx   / redirect → last workspace or /app/workspaces
        ├── components/
        │   ├── AppShell.tsx      Layout: Sidebar + main content
        │   ├── Sidebar.tsx       Global nav: workspaces, links, user menu, Invite people
        │   ├── NavItem.tsx       Reusable nav link with active state
        │   └── ui/
        │       ├── Badge.tsx     Status/priority badge
        │       ├── Modal.tsx     Accessible dialog wrapper
        │       ├── ErrorBanner.tsx
        │       ├── EmptyState.tsx
        │       └── Skeleton.tsx  Loading placeholders
        ├── features/
        │   ├── auth/
        │   │   ├── LoginPage.tsx
        │   │   ├── SignupPage.tsx
        │   │   ├── AuthGuard.tsx        Redirects to /login if unauthenticated
        │   │   ├── PublicOnlyRoute.tsx  Redirects to /app if already authenticated
        │   │   ├── auth.api.ts          login, signup, logout, refresh API calls
        │   │   ├── auth.schemas.ts      Form validation schemas
        │   │   └── useAuthStore.ts      Zustand store: user, status (idle/loading/authenticated/unauthenticated)
        │   ├── workspaces/
        │   │   ├── WorkspaceSelectPage.tsx   Pick or create workspace
        │   │   ├── WorkspaceShell.tsx         Layout wrapper, tab nav, "+ New Task" button
        │   │   ├── api.ts                     useWorkspaces, useWorkspace, useWorkspaceMembers,
        │   │   │                              useCreateWorkspace, useSeedDemo, useUpdateMemberRole
        │   │   ├── store.ts                   Zustand: lastWorkspaceId persistence
        │   │   └── components/
        │   │       ├── CreateWorkspaceModal.tsx
        │   │       ├── WorkspaceSwitcher.tsx
        │   │       └── WorkspaceList.tsx
        │   ├── projects/
        │   │   ├── ProjectListPage.tsx        List + seed demo data button
        │   │   ├── ProjectDetailShell.tsx     Detail layout (wraps epics)
        │   │   ├── api.ts                     useProjects, useProject, useCreateProject
        │   │   └── components/
        │   │       ├── CreateProjectModal.tsx
        │   │       ├── ProjectCard.tsx
        │   │       └── ProjectSelector.tsx    URL-driven project picker (?projectId=)
        │   ├── epics/
        │   │   ├── EpicsPage.tsx
        │   │   ├── api.ts                     useEpics, useCreateEpic
        │   │   └── components/
        │   │       ├── CreateEpicModal.tsx
        │   │       ├── EpicBadge.tsx
        │   │       └── EpicListItem.tsx
        │   ├── tasks/
        │   │   ├── api.ts                     useInfiniteTasks (cursor pagination), useCreateTask,
        │   │   │                              useUpdateTask, useUpdateTaskStatus, useTask, useComments
        │   │   ├── schemas.ts
        │   │   ├── hooks/
        │   │   │   └── useTaskFilters.ts      URL-driven filter state
        │   │   └── components/
        │   │       ├── CreateTaskModal.tsx    Full create form (title, status, priority, assignee, epic, due date)
        │   │       ├── TaskDetailModal.tsx    View/edit task detail
        │   │       ├── TaskDetailDrawer.tsx   Slide-in task detail panel
        │   │       ├── TaskDetailComments.tsx Comments section
        │   │       ├── FilterBar.tsx          Status/priority/assignee/search filters
        │   │       ├── TaskTable.tsx
        │   │       └── TaskRow.tsx
        │   ├── board/
        │   │   ├── BoardPage.tsx      5-column Kanban (BACKLOG/TODO/IN_PROGRESS/IN_REVIEW/DONE),
        │   │   │                      dnd-kit drag-drop, member avatar filters, "Complete sprint"
        │   │   ├── TaskCard.tsx       Vivid avatar colors, epic badge, priority, due date
        │   │   ├── CreateTaskModal.tsx
        │   │   ├── api.ts
        │   │   └── mockData.ts
        │   ├── backlog/
        │   │   └── BacklogPage.tsx    Backlog task list
        │   ├── analytics/
        │   │   ├── DashboardPage.tsx  Metrics grid, area chart, donut, recent tasks table
        │   │   │                      (View All Tasks → navigates to /list)
        │   │   ├── AnalyticsPage.tsx  Detailed analytics view
        │   │   ├── DevelopmentPage.tsx
        │   │   └── api.ts             useWorkspaceAnalytics
        │   ├── timeline/
        │   │   └── TimelinePage.tsx   Gantt-style view
        │   ├── calendar/
        │   │   └── CalendarPage.tsx   Week / Month / Agenda views (Google Calendar style)
        │   ├── list/
        │   │   └── ListPage.tsx       Sortable table with status/priority/assignee/due columns
        │   ├── goals/
        │   │   └── GoalsPage.tsx      Goals tracking
        │   ├── members/
        │   │   ├── MembersPage.tsx    Member list + InviteForm + PendingInvitesList
        │   │   └── api.ts
        │   ├── invitations/
        │   │   ├── AcceptInvitePage.tsx         Token accept flow (redirects to workspace on success)
        │   │   ├── api.ts                        useInviteUser, useRevokeInvitation, useAcceptInvitation
        │   │   └── components/
        │   │       ├── InviteForm.tsx            Email + role select + Send invite button
        │   │       └── PendingInvitesList.tsx    List of outstanding invites with revoke
        │   └── settings/
        │       ├── SettingsPage.tsx   5-section sidebar layout: General, Notifications,
        │       │                      Members, Security, Danger zone
        │       └── api.ts
        └── lib/
            ├── api.ts          Axios instance, baseURL /api, withCredentials,
            │                   401 interceptor → refresh → retry
            ├── types.ts        All shared TypeScript types (Task, Project, Epic, etc.)
            ├── query-keys.ts   QK factory: workspaces, projects, epics, tasks, board, analytics…
            ├── query-client.ts React Query client config
            └── error.ts        extractErrorMessage helper
```

---

## Data Model

8 models, 4 enums. Source of truth: `server/prisma/schema.prisma`.

```
Enums
  Role          OWNER | ADMIN | MEMBER
  TaskStatus    BACKLOG | TODO | IN_PROGRESS | IN_REVIEW | DONE
  Priority      LOW | MEDIUM | HIGH | URGENT
  AuthProvider  EMAIL | GOOGLE

User
  id            cuid
  email         unique
  name
  passwordHash  (null for OAuth users)
  googleId      (null for email users)
  provider      AuthProvider
  avatarUrl
  createdAt, updatedAt

Workspace
  id, name
  slug          unique — URL-friendly identifier
  ownerId       → User
  createdAt, updatedAt
  members       → Membership[]
  projects      → Project[]

Membership                ← enforces multi-tenant RBAC per request
  id
  userId        → User    (onDelete: Cascade)
  workspaceId   → Workspace (onDelete: Cascade)
  role          Role
  joinedAt
  @@unique([userId, workspaceId])

Project
  id, workspaceId → Workspace
  name, key       (key like "PRM", "TFN")
  description
  createdAt, updatedAt
  @@unique([workspaceId, key])  ← key is unique within workspace, not globally

Epic
  id, projectId → Project  (onDelete: Cascade)
  title, description
  createdAt, updatedAt

Task
  id, projectId → Project  (onDelete: Cascade)
  epicId?       → Epic     (onDelete: SetNull — orphaned, not deleted)
  title, description
  status        TaskStatus  @default(TODO)
  priority      Priority    @default(MEDIUM)
  assigneeId?   → User      @relation("TaskAssignee")
  createdById   → User      @relation("TaskCreator")
  dueDate?
  createdAt, updatedAt
  @@index([projectId, status])
  @@index([projectId, assigneeId])
  @@index([projectId, priority])

Comment
  id, taskId → Task  (onDelete: Cascade)
  authorId   → User
  body
  createdAt, updatedAt

RefreshToken               ← opaque tokens, not JWTs
  id, userId → User  (onDelete: Cascade)
  tokenHash    SHA-256 of the raw token
  expiresAt
  createdAt
  revokedAt?   (set on rotation/logout for reuse detection)

Invitation
  id
  email
  workspaceId → Workspace  (onDelete: Cascade)
  role        Role
  token       unique random hex (32 bytes)
  invitedById → User
  expiresAt   (7 days from creation)
  acceptedAt? (null = pending)
  createdAt
  @@index([email, workspaceId])
```

---

## API Routes

All routes are prefixed `/api/`.

```
Auth  (POST /api/auth/*)
  POST   /auth/signup           Create user, issue tokens
  POST   /auth/login            Verify password, issue tokens
  POST   /auth/refresh          Rotate refresh token, issue new access token
  POST   /auth/logout           Clear cookies, revoke refresh token
  GET    /auth/me               Return current user from access token

Workspaces  (member = requireAuth + requireWorkspaceMember)
  GET    /workspaces                    List user's workspaces
  POST   /workspaces                    Create workspace (+ owner Membership, atomic)
  GET    /workspaces/:id                Get single workspace
  PATCH  /workspaces/:id                Update name/slug  [ADMIN, OWNER]
  GET    /workspaces/:id/members        List members
  DELETE /workspaces/:id/members/:uid   Remove member     [ADMIN, OWNER]
  GET    /workspaces/:id/analytics      Aggregate task metrics
  POST   /workspaces/:id/seed-demo      Seed demo data (?force=true to reset)

Projects
  GET    /workspaces/:wsId/projects              List projects
  POST   /workspaces/:wsId/projects              Create project
  GET    /workspaces/:wsId/projects/:id          Get project
  PATCH  /workspaces/:wsId/projects/:id          Update project [ADMIN, OWNER]
  DELETE /workspaces/:wsId/projects/:id          Delete project [ADMIN, OWNER]

Epics
  GET    /projects/:projId/epics                 List epics
  POST   /projects/:projId/epics                 Create epic
  PATCH  /projects/:projId/epics/:id             Update epic
  DELETE /projects/:projId/epics/:id             Delete epic

Tasks
  GET    /projects/:projId/tasks                 List tasks (cursor pagination + filters)
  POST   /projects/:projId/tasks                 Create task
  GET    /projects/:projId/tasks/:id             Get task
  PATCH  /projects/:projId/tasks/:id             Update task (partial)
  DELETE /projects/:projId/tasks/:id             Delete task
  GET    /projects/:projId/tasks/:id/comments    List comments
  POST   /projects/:projId/tasks/:id/comments    Add comment

Invitations
  GET    /workspaces/:wsId/invitations           List pending invites [ADMIN, OWNER]
  POST   /workspaces/:wsId/invitations           Send invite (+ SMTP email)
  DELETE /workspaces/:wsId/invitations/:id       Revoke invite [ADMIN, OWNER]
  POST   /invitations/accept                     Accept invite by token (creates Membership, atomic)
```

---

## Frontend Routes

```
/                                     → /app (redirect)
/login                                Login (PublicOnlyRoute)
/signup                               Signup (PublicOnlyRoute)
/invitations/accept/:token            Accept workspace invitation

/app                                  → last workspace or /app/workspaces
/app/workspaces                       Workspace select / create

/app/workspaces/:workspaceId          WorkspaceShell (tab nav + "+ New Task")
  /dashboard                          Analytics dashboard (charts, metrics, recent tasks)
  /board                              Kanban board (5 columns, drag-drop)
  /backlog                            Backlog view
  /projects                           Project list + demo seed button
  /projects/:projectId/epics          Epic management
  /list                               Sortable table view
  /timeline                           Gantt/timeline
  /calendar                           Week / Month / Agenda calendar
  /goals                              Goals tracking
  /members                            Member list + invite form
  /analytics                          Detailed analytics
  /development                        Development metrics
  /settings                           Workspace settings (5 sections)
```

---

## Key Architectural Decisions

1. **RBAC in the database, not the JWT.** Membership is looked up per request via `requireWorkspaceMember` middleware. Role changes take effect immediately without forcing re-login.

2. **httpOnly cookie sessions.** Access token (~15 min) + refresh token (~7 days). No localStorage. Refresh tokens are opaque random strings stored hashed in the DB — not JWTs. Rotation on every use; reuse detection by checking `revokedAt`.

3. **Prisma transactions for atomic multi-table writes.** Creating a workspace atomically creates the owner Membership. Accepting an invitation atomically creates the Membership and marks the invitation accepted.

4. **Explicit ordered deletes to avoid FK constraint races.** When force-resetting demo data: delete tasks → epics → projects in order instead of relying on cascades. This avoids the race between Prisma's SET NULL (epicId on Task) and CASCADE (projectId on Task) firing simultaneously.

5. **Cursor-based pagination on tasks.** Uses last-seen `id + createdAt` pair. Offset pagination silently double-counts rows when data changes during scroll.

6. **Fire-and-forget email.** `sendEmail()` never throws and never awaits — email failures are logged but never fail the API response.

7. **Multi-tenant isolation via workspaceId on every query.** The service layer always derives workspaceId from the authenticated Membership (set by middleware), never from the request body.

---

## Environment Variables

```
Required
  DATABASE_URL          postgresql://USER:PASS@HOST:PORT/DB
  JWT_ACCESS_SECRET     64+ char random hex (access token signing)
  CLIENT_URL            http://localhost:5173 (dev) — used for CORS + invite links
  PORT                  5000

SMTP (optional — email silently skipped if SMTP_HOST is blank)
  SMTP_HOST             smtp.gmail.com
  SMTP_PORT             587
  SMTP_SECURE           false (true for port 465)
  SMTP_USER             your@email.com
  SMTP_PASS             Gmail app password
  SMTP_FROM             TeamSync <noreply@yourdomain.com>

OAuth (optional)
  GOOGLE_CLIENT_ID
  GOOGLE_CLIENT_SECRET
  GOOGLE_CALLBACK_URL

Other
  COOKIE_DOMAIN         localhost (dev)
  NODE_ENV              development | production | test
```
