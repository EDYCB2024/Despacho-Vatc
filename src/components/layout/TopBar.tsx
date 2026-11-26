"use client";

import { useRouter } from "next/navigation";
import { LogOut, Menu, ShieldCheck } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import type { SessionUser } from "@/lib/auth";

interface TopBarProps {
  title: string;
  subtitle?: string;
  user?: SessionUser | null;
}

export function TopBar({ title, subtitle, user }: TopBarProps) {
  const { toggle } = useSidebar();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const getInitials = () => {
    const name = user?.full_name || "DV";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-outline-variant flex justify-between items-center gap-2 w-full px-3 sm:px-6 py-2.5 sm:py-3">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <button
          onClick={toggle}
          className="p-2 -ml-1 text-primary hover:bg-secondary-container rounded-xl lg:hidden cursor-pointer shrink-0"
          title="Menú"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-lg font-extrabold text-on-surface truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-on-surface-variant truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/70 border border-primary/15 text-[11px] font-bold text-primary">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{user?.department || "DESPACHO"}</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-outline-variant">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-extrabold uppercase text-primary leading-none">
              {user?.full_name || "Administrador"}
            </p>
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest mt-1">
              {user?.alias || user?.role || "ADMIN"}
            </p>
          </div>
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs shadow-md shadow-primary/20 shrink-0">
            {getInitials()}
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-primary/70 hover:text-primary hover:bg-secondary-container rounded-lg transition-all cursor-pointer shrink-0"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
