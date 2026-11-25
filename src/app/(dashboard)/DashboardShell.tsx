"use client";

import React from "react";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { Sidebar } from "@/components/layout/Sidebar";
import type { SessionUser } from "@/lib/auth";

export const UserContext = React.createContext<SessionUser | null>(null);

function ShellInner({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar();
  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <Sidebar />
      <div
        className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isOpen ? "lg:ml-80" : "ml-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function DashboardShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <UserContext.Provider value={user}>
      <SidebarProvider>
        <ShellInner>{children}</ShellInner>
      </SidebarProvider>
    </UserContext.Provider>
  );
}
