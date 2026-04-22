import { useEffect } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { AppShell } from "../../components/AppShell";
import { useWorkspace } from "./api";
import { useWorkspaceStore } from "./store";

export function WorkspaceShell() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { setLastWorkspaceId } = useWorkspaceStore();
  const { isError, error, isSuccess, data } = useWorkspace(workspaceId!);

  useEffect(() => {
    if (!isError) return;
    const status = isAxiosError(error) ? (error.response?.status ?? 0) : 0;
    if (status === 403 || status === 404) {
      navigate("/app/workspaces", { replace: true });
    }
  }, [isError, error, navigate]);

  useEffect(() => {
    if (isSuccess && data) setLastWorkspaceId(data.id);
  }, [isSuccess, data, setLastWorkspaceId]);

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
