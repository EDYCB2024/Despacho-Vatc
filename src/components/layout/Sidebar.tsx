"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  Truck,
  Radio,
  Package,
  Sparkles,
  Inbox,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/context/SidebarContext";

const mainNav = [
  { name: "Inicio", href: "/", icon: Home },
  { name: "Resultados / Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Todos los Despachos", href: "/despachos", icon: Truck },
];

const dispatchNav = [
  { name: "SIMCARD / Serv. Técnico", href: "/simcard-st", icon: Radio },
  { name: "Despacho - Kits", href: "/despacho-kit", icon: Package },
  { name: "Despacho - Equipos Nuevos", href: "/equipos-nuevos", icon: Sparkles },
  { name: "Recepción en Despacho", href: "/recepcion", icon: Inbox },
];

const catalogNav = [
  { name: "Base Maestro POS (BDDIC25)", href: "/directorio-pos", icon: Database },
  { name: "Configuración", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle, setIsOpen } = useSidebar();

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsOpen(false);
    }
  }, [pathname, setIsOpen]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={toggle}
        />
      )}

      <div
        className={cn(
          "fixed left-0 top-0 h-[100dvh] z-50 transition-all duration-300 ease-in-out flex w-[82vw] max-w-72 lg:max-w-none lg:w-80",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <aside className="w-full h-full bg-white border-r border-outline-variant flex flex-col p-5 sm:p-6 overflow-y-auto custom-scrollbar relative shadow-2xl shadow-primary/5">
          {/* Logo Section - Verde Esmeralda */}
          <div className="flex items-center justify-between mb-7 px-1">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-primary to-primary-container rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
                <Truck className="text-white w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight text-primary uppercase leading-tight">
                  DESPACHO VATC
                </h2>
                <p className="text-[10px] font-bold text-on-surface-variant/75 uppercase tracking-widest">
                  Logística ZOOM &amp; POS
                </p>
              </div>
            </div>
            <button
              onClick={toggle}
              className="p-2 -mr-2 text-on-surface-variant hover:bg-secondary-container rounded-lg lg:hidden transition-colors"
              title="Cerrar menú"
            >
              <ChevronLeft className="w-5 h-5 text-primary" />
            </button>
          </div>

          <nav className="flex-1 space-y-6">
            {/* Principal */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-[0.2em] px-4 mb-2">
                Panel Central
              </div>
              {mainNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all group",
                      isActive
                        ? "bg-primary text-white shadow-lg shadow-primary/25"
                        : "text-secondary hover:text-primary hover:bg-secondary-container/60"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-4 h-4 shrink-0",
                        isActive ? "text-white" : "text-primary/70 group-hover:text-primary"
                      )}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Módulos de Despacho */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-[0.2em] px-4 mb-2">
                Operaciones &amp; Guías ZOOM
              </div>
              {dispatchNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all group",
                      isActive
                        ? "bg-primary text-white shadow-lg shadow-primary/25"
                        : "text-secondary hover:text-primary hover:bg-secondary-container/60"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-4 h-4 shrink-0",
                        isActive ? "text-white" : "text-primary/70 group-hover:text-primary"
                      )}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Base Maestro & Sistema */}
            <div className="space-y-1 pt-4 border-t border-outline-variant/70">
              <div className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-[0.2em] px-4 mb-2">
                Directorio &amp; Sistema
              </div>
              {catalogNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all group",
                      isActive
                        ? "bg-primary text-white shadow-lg shadow-primary/25"
                        : "text-secondary hover:text-primary hover:bg-secondary-container/60"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-4 h-4 shrink-0",
                        isActive ? "text-white" : "text-primary/70 group-hover:text-primary"
                      )}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer Badge */}
          <div className="mt-6 p-3.5 rounded-2xl bg-secondary-container/60 border border-primary/15">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                Neon PostgreSQL Live
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">
              Despacho-Vatc • Sincronizado
            </p>
          </div>
        </aside>

        {/* Desktop Handle Tab */}
        <button
          onClick={toggle}
          className="hidden lg:flex w-6 h-20 bg-primary hover:bg-primary-container text-white rounded-r-xl items-center justify-center shadow-lg shadow-primary/25 hover:w-7 transition-all duration-300 mt-[50vh] -translate-y-1/2 cursor-pointer"
          title={isOpen ? "Ocultar menú" : "Mostrar menú"}
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </>
  );
}
