"use client";

import { useContext, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Truck,
  CheckCircle2,
  Clock,
  Radio,
  Package,
  Sparkles,
  Inbox,
  Database,
  RefreshCw,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { UserContext } from "../DashboardShell";
import type { DashboardStats } from "@/types/crm";
import { formatDate } from "@/lib/utils";

const EMERALD_PALETTE = [
  "#065f46",
  "#059669",
  "#10b981",
  "#0d9488",
  "#047857",
  "#14b8a6",
  "#064e3b",
  "#34d399",
  "#0f766e",
  "#15803d",
];

export default function DashboardPage() {
  const user = useContext(UserContext);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stats");
      const json = await res.json();
      setStats(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const kpis = stats
    ? [
        {
          label: "Total Despachos ZOOM",
          value: stats.totals.totalDispatches.toLocaleString(),
          sub: "Consolidado 3 módulos de envío",
          icon: Truck,
          accent: "bg-primary text-white",
        },
        {
          label: "Entregados Confirmados",
          value: stats.totals.entregadosCount.toLocaleString(),
          sub: `${Math.round(
            (stats.totals.entregadosCount / Math.max(1, stats.totals.totalDispatches)) * 100
          )}% efectividad de entrega`,
          icon: CheckCircle2,
          accent: "bg-emerald-600 text-white",
        },
        {
          label: "SIMCARD / Serv. Técnico",
          value: stats.totals.simcardStCount.toLocaleString(),
          sub: "Envíos de SIM, ST y traslados",
          icon: Radio,
          accent: "bg-primary-container text-white",
        },
        {
          label: "Despacho - Kits",
          value: stats.totals.kitCount.toLocaleString(),
          sub: "Generación de Kit y mercancía",
          icon: Package,
          accent: "bg-teal-600 text-white",
        },
        {
          label: "Equipos Nuevos",
          value: stats.totals.equiposNuevosCount.toLocaleString(),
          sub: "Facturados y procesos especiales",
          icon: Sparkles,
          accent: "bg-[#047857] text-white",
        },
        {
          label: "Tránsito / Retiro Agencia",
          value: (
            stats.totals.enTransitoCount + stats.totals.disponibleRetiroCount
          ).toLocaleString(),
          sub: `${stats.totals.disponibleRetiroCount} disponibles en ZOOM`,
          icon: Clock,
          accent: "bg-amber-600 text-white",
        },
        {
          label: "Recepción en Despacho",
          value: stats.totals.totalReceptions.toLocaleString(),
          sub: "Ingresos con control accesorios",
          icon: Inbox,
          accent: "bg-secondary text-white",
        },
        {
          label: "Base Maestro BDDIC25",
          value: stats.totals.totalPosDirectory.toLocaleString(),
          sub: "Parque nacional POS indexado",
          icon: Database,
          accent: "bg-[#064e3b] text-white",
        },
      ]
    : [];

  return (
    <>
      <TopBar
        title="Resultados y Analítica Logística"
        subtitle="Indicadores operativos en tiempo real desde Neon PostgreSQL"
        user={user}
      />

      <main className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-on-surface">Resumen Ejecutivo de Despacho</h2>
            <p className="text-xs text-on-surface-variant">
              Consolidado de SIMCARD/ST, Despacho de Kits, Equipos Nuevos, Recepción y Parque POS BDDIC25
            </p>
          </div>
          <button
            onClick={loadStats}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant bg-white hover:bg-secondary-container text-primary text-xs font-bold cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>
        </div>

        {loading || !stats ? (
          <div className="py-20 text-center text-sm text-on-surface-variant">
            Calculando métricas logísticas en Neon...
          </div>
        ) : (
          <>
            {/* KPI Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((k) => (
                <div
                  key={k.label}
                  className="bg-white border border-outline-variant rounded-2xl p-5 shadow-sm flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                      {k.label}
                    </p>
                    <p className="text-2xl font-black text-on-surface mt-1">{k.value}</p>
                    <p className="text-[11px] text-outline mt-0.5">{k.sub}</p>
                  </div>
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md shrink-0 ${k.accent}`}
                  >
                    <k.icon className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </section>

            {/* Charts Row 1 */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Top Ciudades Destino en Despachos ZOOM">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={stats.byCiudadDestino}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                      {stats.byCiudadDestino.map((_, idx) => (
                        <Cell key={idx} fill={EMERALD_PALETTE[idx % EMERALD_PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Parque Maestro POS (BDDIC25) por Banco">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={stats.byPosBanco}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#059669" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </section>

            {/* Charts Row 2 */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Equipos Recibidos en Despacho por Modelo">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={stats.byRecepcionModelo}
                    margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                  >
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#065f46" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Planes Comerciales Activos en BDDIC25">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={stats.byPosPlan.slice(0, 8)}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#0d9488" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </section>

            {/* Estatus ZOOM Table + Recent Activity */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-outline-variant rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-wider text-primary mb-4">
                  Distribución por Estatus ZOOM y Recepción
                </h3>
                <div className="divide-y divide-outline-variant/50 max-h-80 overflow-y-auto custom-scrollbar">
                  {stats.byEstatusZoom.map((item) => (
                    <div
                      key={item.name}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-on-surface">ZOOM • {item.name}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-primary font-black font-mono">
                        {item.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {stats.byRecepcionEstatus.map((item) => (
                    <div
                      key={`rec-${item.name}`}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-on-surface-variant">
                        RECEPCIÓN • {item.name}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-primary font-black font-mono">
                        {item.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-outline-variant rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-wider text-primary mb-4">
                  Actividad Reciente en Despacho
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                  {stats.recentActivity.length === 0 ? (
                    <p className="text-xs text-on-surface-variant">Sin actividad registrada aún.</p>
                  ) : (
                    stats.recentActivity.map((act) => (
                      <div
                        key={act.id}
                        className="p-3 rounded-xl bg-background border border-outline-variant/60 flex items-start justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-secondary-container text-primary">
                              {act.department}
                            </span>
                            <span className="text-[11px] font-bold text-on-surface">
                              {act.user_name || act.user_email}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-1">{act.summary}</p>
                        </div>
                        <span className="text-[10px] text-outline whitespace-nowrap">
                          {formatDate(act.created_at)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-outline-variant rounded-2xl p-5 shadow-sm">
      <h3 className="text-sm font-black uppercase tracking-wider text-primary mb-4">{title}</h3>
      {children}
    </div>
  );
}
