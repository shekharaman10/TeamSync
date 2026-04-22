import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthGuard } from "../features/auth/AuthGuard";
import { PublicOnlyRoute } from "../features/auth/PublicOnlyRoute";
import { LoginPage } from "../features/auth/LoginPage";
import { SignupPage } from "../features/auth/SignupPage";
import { AppShell } from "../components/AppShell";
import { BoardPage } from "../features/board/BoardPage";
import { BacklogPage } from "../features/backlog/BacklogPage";
import { MembersPage } from "../features/members/MembersPage";
import { AnalyticsPage } from "../features/analytics/AnalyticsPage";
import { SettingsPage } from "../features/settings/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/app/board" replace />,
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: "/login",  element: <LoginPage /> },
      { path: "/signup", element: <SignupPage /> },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        path: "/app",
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/app/board" replace /> },
          { path: "board",     element: <BoardPage /> },
          { path: "backlog",   element: <BacklogPage /> },
          { path: "members",   element: <MembersPage /> },
          { path: "analytics", element: <AnalyticsPage /> },
          { path: "settings",  element: <SettingsPage /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-sm text-zinc-500">404 — page not found</p>
      </div>
    ),
  },
]);
