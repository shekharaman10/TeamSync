import { Outlet, Navigate } from "react-router-dom";
import { useAuthStore } from "./useAuthStore";

export function PublicOnlyRoute() {
  const status = useAuthStore((s) => s.status);

  // If we know the user is authenticated, redirect away from public pages.
  // If status is idle (no /me has fired yet), just render — the user clearly
  // isn't authenticated in this tab session.
  if (status === "authenticated") {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
