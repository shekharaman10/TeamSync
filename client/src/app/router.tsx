import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthGuard } from "../features/auth/AuthGuard";
import { PublicOnlyRoute } from "../features/auth/PublicOnlyRoute";
import { LoginPage } from "../features/auth/LoginPage";
import { SignupPage } from "../features/auth/SignupPage";
import { AppPage } from "../pages/AppPage";

export const router = createBrowserRouter([
  {
    // "/" → always redirect to /app; AuthGuard decides whether to let through or
    // bounce to /login. This achieves "redirect based on auth" with zero extra code.
    path: "/",
    element: <Navigate to="/app" replace />,
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/signup", element: <SignupPage /> },
    ],
  },
  {
    element: <AuthGuard />,
    children: [{ path: "/app", element: <AppPage /> }],
  },
  {
    path: "*",
    element: (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">404 — page not found</p>
      </div>
    ),
  },
]);
