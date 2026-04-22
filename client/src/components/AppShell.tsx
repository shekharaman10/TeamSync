import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

type Props = { children: ReactNode };

export function AppShell({ children }: Props) {
  return (
    <div className="flex h-screen bg-zinc-900">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
