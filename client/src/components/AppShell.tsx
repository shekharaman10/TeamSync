import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

type Props = { children: ReactNode };

export function AppShell({ children }: Props) {
  return (
    <div className="app-bg flex h-screen">
      <Sidebar />
      {/* Glowing edge divider — reinforces sidebar depth */}
      <div className="w-px shrink-0 bg-emerald-500/6 shadow-[0_0_12px_rgba(34,197,94,0.12)]" />
      <main className="app-bg flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
