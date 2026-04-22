import { create } from "zustand";
import { persist } from "zustand/middleware";

type WorkspaceStore = {
  lastWorkspaceId: string | null;
  setLastWorkspaceId: (id: string) => void;
};

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      lastWorkspaceId: null,
      setLastWorkspaceId: (id) => set({ lastWorkspaceId: id }),
    }),
    { name: "teamsync-workspace" }
  )
);
