"use client";

import { useContext, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Zap,
  Search,
  Truck,
  Radio,
  Package,
  Sparkles,
  Inbox,
  Database,
  LayoutDashboard,
  ArrowRight,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { UserContext } from "./DashboardShell";

const modules = [
  {
    title: "SIMCARD / Serv. Técnico / Traslado",
    desc: "Controla envíos de SIMCARD Digitel/Movistar, retornos de Servicio Técnico, traslados internos y guías ZOOM.",
    href: "/simcard-st",
    icon: Radio,
  },
  {
    title: "Despacho - Generación de Kit",
    desc: "Gestiona despachos de Kits y mercancía a nivel nacional, destinatarios, guías ZOOM y estatus de entrega.",
    href: "/despacho-kit",
    icon: Package,
  },
  {
    title: "Despacho - Equipos Nuevos",
    desc: "Supervisa envíos de terminales POS nuevos con control de factura, proceso especial, serial y guía ZOOM.",
    href: "/equipos-nuevos",
    icon: Sparkles,
  },
  {
    title: "Recepción de Equipos en Despacho",
    desc: "Registra ingresos en despacho con checklist completo de accesorios (Caja, Cargador, Batería, SIM, Rollo, Forro).",
    href: "/recepcion",
    icon: Inbox,
  },
  {
    title: "Base Maestro POS (BDDIC25)",
    desc: "Consulta los 29,986 terminales del parque POS por serial, RIF, comercio, banco, procesadora (CREDICARD/PLATCO) y plan.",
    href: "/directorio-pos",
    icon: Database,
  },
  {
    title: "Resultados & Analítica",
    desc: "Visualiza indicadores en tiempo real de entregas ZOOM, ciudades destino, modelos recibidos y distribución por banco.",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
];

export default function HomePage() {
  const user = useContext(UserContext);
  const router = useRouter();
  const [quickSearch, setQuickSearch] = useState("");

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSearch.trim()) {
      router.push("/despachos");
      return;
    }
    router.push(`/despachos?q=${encodeURIComponent(quickSearch.trim())}`);
  };

  return (
    <>
      <TopBar
        title="Inicio — Despacho VATC CRM"
        subtitle="Panel Central de Logística ZOOM, Recepción y Parque POS"
        user={user}
      />

      <main className="p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-[1440px] mx-auto w-full">
        {/* Hero Card Verde Esmeralda */}
        <section className="relative overflow-hidden bg-white border border-outline-variant p-5 sm:p-10 rounded-3xl sm:rounded-[32px] shadow-xl shadow-primary/5">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 bg-secondary-container border border-primary/20 rounded-full mb-4 sm:mb-5 max-w-full">
              <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-black text-primary uppercase tracking-[0.12em] sm:tracking-[0.2em] truncate">
                VA Technology Communication • Neon Cloud
              </span>
            </div>

            <h1 className="text-2xl sm:text-5xl font-black tracking-tight text-on-surface leading-[1.15] sm:leading-[1.1] mb-3 sm:mb-4">
              Control Logístico y{" "}
              <span className="text-primary">Despacho Nacional POS</span>
            </h1>

            <p className="text-xs sm:text-base text-on-surface-variant max-w-2xl mx-auto mb-6 sm:mb-8">
              Plataforma integral conectada a Neon PostgreSQL para administrar envíos de SIMCARD, generación de Kits, despacho de Equipos Nuevos, Recepción con control de accesorios y el Directorio Maestro BDDIC25.
            </p>

            {/* Quick Search */}
            <form
              onSubmit={handleQuickSearch}
              className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto mb-4"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-outline absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2" />
                <input
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  placeholder="Guía ZOOM, Serial, Destinatario, Cédula o Ciudad..."
                  className="w-full pl-10 sm:pl-11 pr-4 py-3 sm:py-3.5 rounded-2xl border border-outline-variant bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-primary to-primary-container hover:from-primary-hover hover:to-primary text-white text-sm font-bold shadow-lg shadow-primary/25 inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Buscar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-on-surface-variant">
              <Link
                href="/despachos"
                className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline"
              >
                <Truck className="w-3.5 h-3.5 shrink-0" />
                <span>Ver Todos los Despachos</span>
              </Link>
              <span className="hidden sm:inline">•</span>
              <Link
                href="/directorio-pos"
                className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline"
              >
                <Database className="w-3.5 h-3.5 shrink-0" />
                <span>Base Maestro BDDIC25 (29,986 POS)</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Modules Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
          {modules.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="group p-5 sm:p-6 bg-white border border-outline-variant rounded-2xl sm:rounded-3xl hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 sm:hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-secondary-container text-primary group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-colors mb-4 shadow-sm">
                  <m.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-on-surface mb-1.5 group-hover:text-primary transition-colors">
                  {m.title}
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {m.desc}
                </p>
              </div>
              <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                <span>Abrir módulo</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </section>
      </main>
    </>
  );
}
