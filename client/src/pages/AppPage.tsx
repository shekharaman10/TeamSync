import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { logoutRequest } from "../features/auth/auth.api";
import { useAuthStore } from "../features/auth/useAuthStore";
import { queryClient } from "../lib/query-client";

export function AppPage() {
  const { user, clear } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    // Optimistic logout: fire and forget the network call, clean up immediately.
    // The .catch suppresses unhandled rejection if the request fails.
    logoutRequest().catch((err: unknown) => {
      if (!isAxiosError(err)) console.error("Logout error:", err);
    });
    queryClient.clear();
    clear();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-gray-900">Welcome back</h1>
        {user && (
          <div className="mb-6 space-y-1">
            <p className="text-sm text-gray-700">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
