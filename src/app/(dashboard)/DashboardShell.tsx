"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Truck, Inbox, Database, LayoutDashboard } from "lucide-react";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { Sidebar } from "@/components/layout/Sidebar";
import type { SessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const UserContext = React.createContext<SessionUser | null>(null);

const mobileBottomNav = [
  { name: "Inicio", href: "/", icon: Home },
  { name: "Despachos", href: "/despachos", icon: Truck },
  { name: "Recepción", href: "/recepcion", icon: Inbox },
  { name: "BDDIC25", href: "/directorio-pos", icon: Database },
  { name: "Analítica", href: "/dashboard", icon: LayoutDashboard },
];

function MobileBottomBar() {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-outline-variant px-1.5 py-1.5 shadow-[0_-4px_20px_rgba(6,95,70,0.08)]">
      <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
        {mobileBottomNav.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href ||
                (item.href === "/despachos" &&
                  ["/despachos", "/simcard-st", "/despacho-kit", "/equipos-nuevos"].includes(
                    pathname
                  ));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all",
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant hover:text-primary"
              )}
            >
              <item.icon className="w-4 h-4 mb-0.5 shrink-0" />
              <span className="truncate max-w-full">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar();
  return (
    <div className="flex min-h-[100dvh] bg-background text-on-surface overflow-x-hidden">
      <Sidebar />
      <div
        className={`flex-1 min-w-0 flex flex-col min-h-[100dvh] pb-16 lg:pb-0 transition-all duration-300 ease-in-out ${
          isOpen ? "lg:ml-80" : "ml-0"
        }`}
      >
        {children}
      </div>
      <MobileBottomBar />
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
