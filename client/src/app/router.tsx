import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthGuard } from "../features/auth/AuthGuard";
import { PublicOnlyRoute } from "../features/auth/PublicOnlyRoute";
import { LoginPage } from "../features/auth/LoginPage";
import { SignupPage } from "../features/auth/SignupPage";
import { WorkspaceSelectPage } from "../features/workspaces/WorkspaceSelectPage";
import { WorkspaceShell } from "../features/workspaces/WorkspaceShell";
import { DashboardPage } from "../features/analytics/DashboardPage";
import { DevelopmentPage } from "../features/analytics/DevelopmentPage";
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
import { ListPage } from "../features/list/ListPage";
import { TimelinePage } from "../features/timeline/TimelinePage";
import { CalendarPage } from "../features/calendar/CalendarPage";
import { GoalsPage } from "../features/goals/GoalsPage";

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
  {
    path: "/invitations/accept/:token",
    element: <AcceptInvitePage />,
  },
  {
    element: <AuthGuard />,
    children: [
      { path: "/app", element: <AppRedirect /> },
      { path: "/app/workspaces", element: <WorkspaceSelectPage /> },
      {
        path: "/app/workspaces/:workspaceId",
        element: <WorkspaceShell />,
        children: [
          // Dashboard is the primary landing page
          { index: true,           element: <Navigate to="dashboard" replace /> },
          { path: "dashboard",     element: <DashboardPage /> },
          // Core workspace
          { path: "board",         element: <BoardPage /> },
          { path: "backlog",       element: <BacklogPage /> },
          { path: "projects",      element: <ProjectListPage /> },
          {
            path: "projects/:projectId",
            element: <ProjectDetailShell />,
            children: [
              { index: true, element: <Navigate to="epics" replace /> },
              { path: "epics", element: <EpicsPage /> },
            ],
          },
          // Views
          { path: "list",          element: <ListPage /> },
          { path: "timeline",      element: <TimelinePage /> },
          { path: "calendar",      element: <CalendarPage /> },
          { path: "goals",         element: <GoalsPage /> },
          // Collaboration
          { path: "members",       element: <MembersPage /> },
          // Insights (charts + breakdown, separate from the living dashboard)
          { path: "analytics",     element: <AnalyticsPage /> },
          { path: "development",   element: <DevelopmentPage /> },
          // System
          { path: "settings",      element: <SettingsPage /> },
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
        <a href="/app" className="mt-2 text-xs text-emerald-400 hover:text-emerald-300">
          Go to app →
        </a>
      </div>
    ),
  },
]);
