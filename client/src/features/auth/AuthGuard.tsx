import { useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useMe } from "./auth.api";
import { useAuthStore } from "./useAuthStore";

export function AuthGuard() {
  const { setUser, setStatus, clear } = useAuthStore();
  const { data, isPending, isError } = useMe();

  useEffect(() => {
    if (isPending) {
      setStatus("loading");
    } else if (data) {
      setUser(data);
    } else if (isError) {
      clear();
    }
  }, [isPending, data, isError, setUser, setStatus, clear]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (isError) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
