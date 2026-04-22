import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthGuard } from "../features/auth/AuthGuard";
import { PublicOnlyRoute } from "../features/auth/PublicOnlyRoute";
import { LoginPage } from "../features/auth/LoginPage";
import { SignupPage } from "../features/auth/SignupPage";
import { WorkspaceSelectPage } from "../features/workspaces/WorkspaceSelectPage";
import { WorkspaceShell } from "../features/workspaces/WorkspaceShell";
import { BoardPage } from "../features/board/BoardPage";
import { BacklogPage } from "../features/backlog/BacklogPage";
import { MembersPage } from "../features/members/MembersPage";
import { AnalyticsPage } from "../features/analytics/AnalyticsPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { ProjectListPage } from "../features/projects/ProjectListPage";
import { ProjectDetailShell } from "../features/projects/ProjectDetailShell";
import { EpicsPage } from "../features/epics/EpicsPage";
import { AcceptInvitePage } from "../features/invitations/AcceptInvitePage";
import { AppRedirect } from "./AppRedirect";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/app" replace />,
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: "/login",  element: <LoginPage /> },
      { path: "/signup", element: <SignupPage /> },
    ],
  },
  // Invitation accept — semi-public: auth is checked inside the page
  {
    path: "/invitations/accept/:token",
    element: <AcceptInvitePage />,
  },
  {
    element: <AuthGuard />,
    children: [
      // /app → redirect to last workspace or workspace select
      { path: "/app", element: <AppRedirect /> },
      // Workspace selection (no workspace in URL)
      { path: "/app/workspaces", element: <WorkspaceSelectPage /> },
      // Workspace-scoped shell
      {
        path: "/app/workspaces/:workspaceId",
        element: <WorkspaceShell />,
        children: [
          { index: true, element: <Navigate to="board" replace /> },
          { path: "board",     element: <BoardPage /> },
          { path: "backlog",   element: <BacklogPage /> },
          { path: "members",   element: <MembersPage /> },
          { path: "analytics", element: <AnalyticsPage /> },
          { path: "settings",  element: <SettingsPage /> },
          // Projects
          { path: "projects",  element: <ProjectListPage /> },
          {
            path: "projects/:projectId",
            element: <ProjectDetailShell />,
            children: [
              { index: true, element: <Navigate to="epics" replace /> },
              { path: "epics", element: <EpicsPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-950">
        <p className="text-2xl font-bold text-white">404</p>
        <p className="text-sm text-zinc-500">Page not found</p>
        <a href="/app" className="mt-2 text-xs text-teal-400 hover:text-teal-300">
          Go to app →
        </a>
      </div>
    ),
  },
]);
