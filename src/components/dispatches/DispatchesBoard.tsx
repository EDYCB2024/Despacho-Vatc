"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
  Search,
  Download,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  ExternalLink,
  Filter,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { UserContext } from "@/app/(dashboard)/DashboardShell";
import { DispatchDetailModal } from "@/components/modals/DispatchDetailModal";
import { NewDispatchModal } from "@/components/modals/NewDispatchModal";
import {
  DispatchCategory,
  DispatchRecord,
  CATEGORIA_LABELS,
  ESTATUS_ZOOM_OPTIONS,
  COSTO_DESTINO_OPTIONS,
} from "@/types/crm";
import {
  buildDispatchWhatsAppLink,
  cn,
  formatDate,
  getStatusBadgeClass,
} from "@/lib/utils";

interface DispatchesBoardProps {
  categoria?: DispatchCategory;
  title: string;
  subtitle: string;
}

export function DispatchesBoard({ categoria, title, subtitle }: DispatchesBoardProps) {
  const user = useContext(UserContext);
  const [records, setRecords] = useState<DispatchRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>(categoria || "");
  const [estatusZoom, setEstatusZoom] = useState("");
  const [costoDestino, setCostoDestino] = useState("");

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("q");
      if (q) {
        setSearch(q);
        setDebouncedSearch(q);
      }
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const buildQueryParams = useCallback(
    (extra?: Record<string, string>) => {
      const qs = new URLSearchParams();
      if (debouncedSearch) qs.set("search", debouncedSearch);
      const effectiveCat = categoria || catFilter;
      if (effectiveCat) qs.set("categoria", effectiveCat);
      if (estatusZoom) qs.set("estatus_zoom", estatusZoom);
      if (costoDestino) qs.set("costo_destino", costoDestino);
      qs.set("page", String(page));
      qs.set("pageSize", "35");
      if (extra) {
        for (const [k, v] of Object.entries(extra)) qs.set(k, v);
      }
      return qs.toString();
    },
    [debouncedSearch, categoria, catFilter, estatusZoom, costoDestino, page]
  );

  const fetchDispatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dispatches?${buildQueryParams()}`);
      const json = await res.json();
      setRecords(json.data || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams]);

  useEffect(() => {
    fetchDispatches();
  }, [fetchDispatches]);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/dispatches?${buildQueryParams({ export: "1" })}`);
      const json = await res.json();
      const rows = (json.data || []) as DispatchRecord[];
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, categoria || "DESPACHOS");
      XLSX.writeFile(
        wb,
        `DESPACHO_VATC_${categoria || "TODOS"}_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    if (!categoria) setCatFilter("");
    setEstatusZoom("");
    setCostoDestino("");
    setPage(1);
  };

  const hasFilters = Boolean(search || (!categoria && catFilter) || estatusZoom || costoDestino);

  return (
    <>
      <TopBar title={title} subtitle={subtitle} user={user} />

      <main className="p-3 sm:p-6 space-y-4 sm:space-y-5 max-w-[1600px] mx-auto w-full">
        {/* Toolbar */}
        <section className="bg-white border border-outline-variant rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2.5 sm:gap-3">
            <div className="relative flex-1 w-full sm:min-w-[240px] sm:max-w-md">
              <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por guía ZOOM, serial, destinatario, cédula o ciudad..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <button
                onClick={fetchDispatches}
                className="p-2.5 rounded-xl border border-outline-variant bg-white hover:bg-secondary-container text-primary transition-colors cursor-pointer shrink-0"
                title="Recargar"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </button>

              <button
                onClick={handleExportExcel}
                disabled={exporting}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-outline-variant bg-white hover:bg-secondary-container text-primary text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>{exporting ? "Exportando..." : "Excel"}</span>
              </button>

              <button
                onClick={() => setShowNewModal(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-md shadow-primary/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Nuevo Despacho</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 pt-2.5 border-t border-outline-variant/60">
            <div className="flex items-center justify-between sm:justify-start gap-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant sm:mr-1">
              <span className="inline-flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-primary" />
                <span>Filtros:</span>
              </span>
              <span className="sm:hidden text-xs font-bold text-primary">
                {total.toLocaleString()} despachos
              </span>
            </div>

            {!categoria && (
              <select
                value={catFilter}
                onChange={(e) => {
                  setCatFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-xl border border-outline-variant bg-background text-xs font-medium focus:outline-none focus:border-primary"
              >
                <option value="">Todas las Categorías</option>
                <option value="SIMCARD_ST">SIMCARD / Serv. Técnico / Traslado</option>
                <option value="KIT">Despacho - Generación de Kit</option>
                <option value="EQUIPOS_NUEVOS">Despacho - Equipos Nuevos</option>
              </select>
            )}

            <div className="grid grid-cols-2 sm:contents gap-2">
              <select
                value={estatusZoom}
                onChange={(e) => {
                  setEstatusZoom(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-xl border border-outline-variant bg-background text-xs font-medium focus:outline-none focus:border-primary"
              >
                <option value="">Estatus ZOOM (Todos)</option>
                {ESTATUS_ZOOM_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>

              <select
                value={costoDestino}
                onChange={(e) => {
                  setCostoDestino(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-xl border border-outline-variant bg-background text-xs font-medium focus:outline-none focus:border-primary"
              >
                <option value="">Cobro (Todos)</option>
                {COSTO_DESTINO_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-primary hover:bg-secondary-container cursor-pointer text-left sm:text-center"
              >
                Limpiar filtros
              </button>
            )}

            <span className="hidden sm:inline ml-auto text-xs font-bold text-on-surface-variant">
              {total.toLocaleString()} despachos
            </span>
          </div>
        </section>

        {/* Mobile Auto-Adjustable Cards (< md) + Desktop Table (>= md) */}
        <section className="bg-white border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
          {/* Mobile Cards View */}
          <div className="md:hidden divide-y divide-outline-variant/60">
            {loading ? (
              <div className="py-12 px-4 text-center text-xs text-on-surface-variant">
                Cargando despachos desde Neon PostgreSQL...
              </div>
            ) : records.length === 0 ? (
              <div className="py-12 px-4 text-center text-xs text-on-surface-variant">
                No se encontraron despachos con los filtros actuales.
              </div>
            ) : (
              records.map((r) => {
                const waUrl = buildDispatchWhatsAppLink({
                  phone: r.telefono_contacto,
                  destinatario: r.destinatario || r.razon_social,
                  guia: r.numero_guia,
                  ciudad: r.ciudad_destino,
                  contenido: r.descripcion_contenido || r.referencia_envio,
                  serial: r.serial,
                  estatus: r.estatus_zoom,
                });

                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className="p-3.5 hover:bg-secondary-container/25 active:bg-secondary-container/40 transition-colors cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-black text-xs text-primary">
                            Guía: {r.numero_guia || "S/G"}
                          </span>
                          {!categoria && (
                            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-primary font-bold text-[10px]">
                              {r.categoria === "SIMCARD_ST"
                                ? "SIMCARD / ST"
                                : r.categoria === "KIT"
                                  ? "KIT"
                                  : "EQ. NUEVO"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-extrabold text-on-surface mt-1 line-clamp-1">
                          {r.destinatario || r.razon_social || "Sin destinatario"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0",
                          getStatusBadgeClass(r.estatus_zoom)
                        )}
                      >
                        {r.estatus_zoom || "PENDIENTE"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-surface-container/50 rounded-xl p-2.5 border border-outline-variant/50">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase text-outline block">
                          Serial / Contenido
                        </span>
                        <span className="font-mono font-bold text-on-surface truncate block">
                          {r.serial || r.referencia_envio || "—"}
                        </span>
                        <span className="text-[10px] text-on-surface-variant truncate block">
                          {r.descripcion_contenido || ""}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase text-outline block">
                          Ciudad / Fecha
                        </span>
                        <span className="font-bold text-on-surface truncate block">
                          {r.ciudad_destino || "—"}
                        </span>
                        <span className="text-[10px] text-on-surface-variant block">
                          {formatDate(r.fecha_envio || r.fecha_solicitud)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <span className="text-[11px] text-outline truncate">
                        {r.persona_contacto || r.solicitado_por || r.factura || ""}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase shadow-sm"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Guía WA</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedId(r.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary-container text-primary text-[11px] font-bold"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Ficha</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary-container/60 border-b border-outline-variant text-[11px] font-black uppercase tracking-wider text-primary">
                  <th className="py-3 px-4">Fecha</th>
                  {!categoria && <th className="py-3 px-4">Módulo</th>}
                  <th className="py-3 px-4">Guía ZOOM</th>
                  <th className="py-3 px-4">Serial / Contenido</th>
                  <th className="py-3 px-4">Destinatario / Contacto</th>
                  <th className="py-3 px-4">Ciudad Destino</th>
                  {categoria === "EQUIPOS_NUEVOS" ? (
                    <th className="py-3 px-4">Factura / Proceso</th>
                  ) : (
                    <th className="py-3 px-4">Solicitado Por / Cobro</th>
                  )}
                  <th className="py-3 px-4">Estatus ZOOM</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4 text-right">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-on-surface-variant">
                      Cargando despachos desde Neon PostgreSQL...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-on-surface-variant">
                      No se encontraron despachos con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => {
                    const waUrl = buildDispatchWhatsAppLink({
                      phone: r.telefono_contacto,
                      destinatario: r.destinatario || r.razon_social,
                      guia: r.numero_guia,
                      ciudad: r.ciudad_destino,
                      contenido: r.descripcion_contenido || r.referencia_envio,
                      serial: r.serial,
                      estatus: r.estatus_zoom,
                    });

                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedId(r.id)}
                        className="hover:bg-secondary-container/30 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 whitespace-nowrap text-outline font-medium">
                          {formatDate(r.fecha_envio || r.fecha_solicitud)}
                        </td>

                        {!categoria && (
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-primary font-bold text-[10px]">
                              {r.categoria === "SIMCARD_ST"
                                ? "SIMCARD / ST"
                                : r.categoria === "KIT"
                                  ? "KIT"
                                  : "EQ. NUEVO"}
                            </span>
                          </td>
                        )}

                        <td className="py-3 px-4 font-mono font-bold text-primary whitespace-nowrap">
                          {r.numero_guia || "—"}
                        </td>

                        <td className="py-3 px-4 max-w-[200px]">
                          <p className="font-mono font-bold text-on-surface truncate">
                            {r.serial || r.referencia_envio || "—"}
                          </p>
                          <p className="text-[11px] text-outline truncate">
                            {r.descripcion_contenido || r.referencia_envio || ""}
                          </p>
                        </td>

                        <td className="py-3 px-4 max-w-[240px]">
                          <p className="font-semibold text-on-surface truncate">
                            {r.destinatario || r.razon_social || "—"}
                          </p>
                          <p className="text-[11px] text-outline truncate">
                            {r.persona_contacto || ""}{" "}
                            {r.cedula_identidad ? `• ${r.cedula_identidad}` : ""}
                          </p>
                        </td>

                        <td className="py-3 px-4 font-bold text-on-surface-variant whitespace-nowrap">
                          {r.ciudad_destino || "—"}
                        </td>

                        {categoria === "EQUIPOS_NUEVOS" ? (
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-primary">
                              {r.factura || "—"}
                            </span>
                            <span className="block text-[10px] text-outline">
                              {r.proceso_especial || ""}
                            </span>
                          </td>
                        ) : (
                          <td className="py-3 px-4 max-w-[170px]">
                            <p className="font-medium truncate">{r.solicitado_por || "—"}</p>
                            <p className="text-[10px] font-bold text-primary">
                              {r.costo_destino || ""}
                            </p>
                          </td>
                        )}

                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap",
                              getStatusBadgeClass(r.estatus_zoom)
                            )}
                          >
                            {r.estatus_zoom || "PENDIENTE"}
                          </span>
                        </td>

                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          {waUrl ? (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase shadow-sm transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Guía WA</span>
                            </a>
                          ) : (
                            <span className="text-[10px] font-bold text-outline">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(r.id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary-container text-primary hover:bg-primary hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Abrir</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-3.5 sm:px-4 py-3 bg-surface-container/60 border-t border-outline-variant flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-on-surface-variant font-medium">
              Pág. <strong className="text-primary">{page}</strong> /{" "}
              <strong>{totalPages}</strong>{" "}
              <span className="hidden sm:inline">({total.toLocaleString()} registros)</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl border border-outline-variant bg-white hover:bg-secondary-container text-primary font-bold disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl border border-outline-variant bg-white hover:bg-secondary-container text-primary font-bold disabled:opacity-40 cursor-pointer"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <DispatchDetailModal
        dispatchId={selectedId}
        onClose={() => setSelectedId(null)}
        onSaved={(updated) => {
          setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        }}
        onDeleted={(id) => {
          setRecords((prev) => prev.filter((r) => r.id !== id));
          setTotal((t) => Math.max(0, t - 1));
        }}
      />

      <NewDispatchModal
        open={showNewModal}
        defaultCategory={categoria || "SIMCARD_ST"}
        onClose={() => setShowNewModal(false)}
        onCreated={() => {
          setPage(1);
          fetchDispatches();
        }}
      />
    </>
  );
}
