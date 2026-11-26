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
  Filter,
  X,
  Save,
  Trash2,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { UserContext } from "../DashboardShell";
import {
  DispatchReception,
  ESTATUS_RECEPCION_OPTIONS,
  MODELOS_POS_SUGERIDOS,
} from "@/types/crm";
import { cn, formatDate, getStatusBadgeClass } from "@/lib/utils";

export default function RecepcionDespachoPage() {
  const user = useContext(UserContext);
  const [records, setRecords] = useState<DispatchReception[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [modelo, setModelo] = useState("");
  const [estatus, setEstatus] = useState("");
  const [exporting, setExporting] = useState(false);

  const [selected, setSelected] = useState<DispatchReception | null>(null);
  const [showNew, setShowNew] = useState(false);

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
      if (modelo) qs.set("modelo", modelo);
      if (estatus) qs.set("estatus", estatus);
      qs.set("page", String(page));
      qs.set("pageSize", "35");
      if (extra) {
        for (const [k, v] of Object.entries(extra)) qs.set(k, v);
      }
      return qs.toString();
    },
    [debouncedSearch, modelo, estatus, page]
  );

  const fetchReceptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/receptions?${buildQueryParams()}`);
      const json = await res.json();
      setRecords(json.data || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams]);

  useEffect(() => {
    fetchReceptions();
  }, [fetchReceptions]);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/receptions?${buildQueryParams({ export: "1" })}`);
      const json = await res.json();
      const rows = (json.data || []) as DispatchReception[];
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "RECEPCION_DESPACHO");
      XLSX.writeFile(wb, `DESPACHO_VATC_RECEPCION_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <TopBar
        title="Recepción de Equipos en Despacho"
        subtitle="Control de ingresos por guía ZOOM y checklist de accesorios (Caja, Cargador, Batería, SIMCARD, Rollo, Forro)"
        user={user}
      />

      <main className="p-3 sm:p-6 space-y-4 sm:space-y-5 max-w-[1600px] mx-auto w-full">
        {/* Toolbar */}
        <section className="bg-white border border-outline-variant rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2.5 sm:gap-3">
            <div className="relative flex-1 w-full sm:min-w-[240px] sm:max-w-md">
              <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por serial, guía ZOOM, razón social o modelo..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <button
                onClick={fetchReceptions}
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
                onClick={() => setShowNew(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-md shadow-primary/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Registrar Recepción</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 pt-2.5 border-t border-outline-variant/60">
            <div className="flex items-center justify-between sm:justify-start gap-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant sm:mr-1">
              <span className="inline-flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-primary" />
                <span>Filtros:</span>
              </span>
              <span className="sm:hidden text-xs font-bold text-primary">
                {total.toLocaleString()} recepciones
              </span>
            </div>

            <div className="grid grid-cols-2 sm:contents gap-2">
              <select
                value={modelo}
                onChange={(e) => {
                  setModelo(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-xl border border-outline-variant bg-background text-xs font-medium focus:outline-none focus:border-primary"
              >
                <option value="">Todos los Modelos</option>
                {MODELOS_POS_SUGERIDOS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={estatus}
                onChange={(e) => {
                  setEstatus(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-xl border border-outline-variant bg-background text-xs font-medium focus:outline-none focus:border-primary"
              >
                <option value="">Todos los Estatus</option>
                {ESTATUS_RECEPCION_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {(search || modelo || estatus) && (
              <button
                onClick={() => {
                  setSearch("");
                  setModelo("");
                  setEstatus("");
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-primary hover:bg-secondary-container cursor-pointer text-left sm:text-center"
              >
                Limpiar filtros
              </button>
            )}

            <span className="hidden sm:inline ml-auto text-xs font-bold text-on-surface-variant">
              {total.toLocaleString()} recepciones
            </span>
          </div>
        </section>

        {/* Mobile Cards (< md) + Desktop Table (>= md) */}
        <section className="bg-white border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
          {/* Mobile Cards View */}
          <div className="md:hidden divide-y divide-outline-variant/60">
            {loading ? (
              <div className="py-12 px-4 text-center text-xs text-on-surface-variant">
                Cargando recepciones desde Neon...
              </div>
            ) : records.length === 0 ? (
              <div className="py-12 px-4 text-center text-xs text-on-surface-variant">
                No se encontraron recepciones con los filtros actuales.
              </div>
            ) : (
              records.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="p-3.5 hover:bg-secondary-container/25 active:bg-secondary-container/40 transition-colors cursor-pointer space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-black text-xs text-primary">
                          {r.serial || "SIN SERIAL"}
                        </span>
                        {r.modelo && (
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container text-primary font-bold text-[10px]">
                            {r.modelo}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-extrabold text-on-surface mt-1 line-clamp-1">
                        {r.razon_social || "Sin razón social"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0",
                        getStatusBadgeClass(r.estatus)
                      )}
                    >
                      {r.estatus || "ENTREGADO A ST"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                    <span>
                      Guía: <strong className="font-mono text-primary">{r.numero_guia || "—"}</strong> • Cant:{" "}
                      <strong>{r.cantidad_equipos || 1}</strong>
                    </span>
                    <span>{formatDate(r.fecha_recepcion)}</span>
                  </div>

                  <div className="grid grid-cols-6 gap-1 pt-0.5">
                    {(
                      [
                        ["caja", "Caja"],
                        ["cargador", "Carg"],
                        ["bateria", "Bat"],
                        ["simcard", "SIM"],
                        ["rollo", "Rollo"],
                        ["forro", "Forro"],
                      ] as const
                    ).map(([k, label]) => (
                      <div
                        key={k}
                        className={cn(
                          "py-1 px-1 rounded-lg border text-center text-[9px] font-black",
                          r[k] === "SI"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-stone-100 text-stone-400 border-stone-200"
                        )}
                      >
                        {label}: {r[k] || "NO"}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary-container/60 border-b border-outline-variant text-[11px] font-black uppercase tracking-wider text-primary">
                  <th className="py-3 px-4">F. Recepción</th>
                  <th className="py-3 px-4">N° Guía</th>
                  <th className="py-3 px-4">Cant.</th>
                  <th className="py-3 px-4">Modelo / Serial</th>
                  <th className="py-3 px-4">Razón Social</th>
                  <th className="py-3 px-3 text-center">Caja</th>
                  <th className="py-3 px-3 text-center">Carg.</th>
                  <th className="py-3 px-3 text-center">Bat.</th>
                  <th className="py-3 px-3 text-center">SIM</th>
                  <th className="py-3 px-3 text-center">Rollo</th>
                  <th className="py-3 px-3 text-center">Forro</th>
                  <th className="py-3 px-4">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-on-surface-variant">
                      Cargando recepciones desde Neon...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-on-surface-variant">
                      No se encontraron recepciones con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelected(r)}
                      className="hover:bg-secondary-container/30 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 whitespace-nowrap text-outline">
                        {formatDate(r.fecha_recepcion)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-primary whitespace-nowrap">
                        {r.numero_guia || "—"}
                      </td>
                      <td className="py-3 px-4 font-bold">{r.cantidad_equipos || 1}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-on-surface">
                          {r.serial || "—"}
                        </span>
                        <span className="block text-[10px] font-bold text-primary">
                          {r.modelo || ""}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-[230px] truncate font-semibold text-on-surface">
                        {r.razon_social || "—"}
                      </td>
                      {(["caja", "cargador", "bateria", "simcard", "rollo", "forro"] as const).map(
                        (k) => (
                          <td key={k} className="py-3 px-3 text-center">
                            <span
                              className={cn(
                                "inline-flex px-2 py-0.5 rounded-full text-[10px] font-black border",
                                r[k] === "SI"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-stone-100 text-stone-500 border-stone-200"
                              )}
                            >
                              {r[k] || "NO"}
                            </span>
                          </td>
                        )
                      )}
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap",
                            getStatusBadgeClass(r.estatus)
                          )}
                        >
                          {r.estatus || "ENTREGADO A ST"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-surface-container/60 border-t border-outline-variant flex items-center justify-between text-xs">
            <span className="text-on-surface-variant font-medium">
              Página <strong className="text-primary">{page}</strong> de{" "}
              <strong>{totalPages}</strong> ({total.toLocaleString()} registros)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-outline-variant bg-white hover:bg-secondary-container text-primary font-bold disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-outline-variant bg-white hover:bg-secondary-container text-primary font-bold disabled:opacity-40 cursor-pointer"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {(showNew || selected) && (
        <ReceptionModal
          record={selected}
          onClose={() => {
            setSelected(null);
            setShowNew(false);
          }}
          onSaved={() => {
            setSelected(null);
            setShowNew(false);
            fetchReceptions();
          }}
        />
      )}
    </>
  );
}

function ReceptionModal({
  record,
  onClose,
  onSaved,
}: {
  record: DispatchReception | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    fecha_recepcion: record?.fecha_recepcion
      ? String(record.fecha_recepcion).slice(0, 10)
      : today,
    numero_guia: record?.numero_guia || "",
    cantidad_equipos: record?.cantidad_equipos ?? 1,
    modelo: record?.modelo || "N910",
    serial: record?.serial || "",
    razon_social: record?.razon_social || "",
    caja: record?.caja || "SI",
    cargador: record?.cargador || "SI",
    bateria: record?.bateria || "SI",
    simcard: record?.simcard || "SI",
    rollo: record?.rollo || "NO",
    forro: record?.forro || "NO",
    estatus: record?.estatus || "ENTREGADO A ST",
    observacion: record?.observacion || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = record ? `/api/receptions/${record.id}` : "/api/receptions";
      const method = record ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!record) return;
    if (!confirm(`¿Eliminar recepción #${record.id} (${record.serial})?`)) return;
    const res = await fetch(`/api/receptions/${record.id}`, { method: "DELETE" });
    if (res.ok) onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-outline-variant w-full max-w-2xl max-h-[94dvh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-container text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/80">
              Recepción en Despacho
            </p>
            <h2 className="text-base sm:text-lg font-black">
              {record ? `Editar Recepción #${record.id}` : "Registrar Recepción de Equipo"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Fecha Recepción
              </label>
              <input
                type="date"
                value={form.fecha_recepcion}
                onChange={(e) => setForm({ ...form, fecha_recepcion: e.target.value })}
                className="input-green"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                N° de Guía ZOOM
              </label>
              <input
                value={form.numero_guia}
                onChange={(e) =>
                  setForm({ ...form, numero_guia: e.target.value.toUpperCase() })
                }
                className="input-green font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Cant. Equipos
              </label>
              <input
                type="number"
                min={1}
                value={form.cantidad_equipos}
                onChange={(e) =>
                  setForm({ ...form, cantidad_equipos: parseInt(e.target.value || "1", 10) })
                }
                className="input-green font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Modelo POS
              </label>
              <input
                list="rec-modelos"
                value={form.modelo}
                onChange={(e) => setForm({ ...form, modelo: e.target.value.toUpperCase() })}
                className="input-green font-bold"
              />
              <datalist id="rec-modelos">
                {MODELOS_POS_SUGERIDOS.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Serial *
              </label>
              <input
                required
                value={form.serial}
                onChange={(e) => setForm({ ...form, serial: e.target.value.toUpperCase() })}
                className="input-green font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Estatus
              </label>
              <select
                value={form.estatus}
                onChange={(e) => setForm({ ...form, estatus: e.target.value })}
                className="input-green font-bold"
              >
                {ESTATUS_RECEPCION_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Razón Social / Cliente
              </label>
              <input
                value={form.razon_social}
                onChange={(e) =>
                  setForm({ ...form, razon_social: e.target.value.toUpperCase() })
                }
                className="input-green"
              />
            </div>
          </div>

          {/* Checklist de Accesorios */}
          <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant">
            <p className="text-[11px] font-black uppercase tracking-wider text-primary mb-3">
              Checklist de Accesorios Recibidos
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
              {(
                [
                  ["caja", "Caja"],
                  ["cargador", "Cargador"],
                  ["bateria", "Batería"],
                  ["simcard", "SIMCARD"],
                  ["rollo", "Rollo"],
                  ["forro", "Forro"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      [key]: prev[key] === "SI" ? "NO" : "SI",
                    }))
                  }
                  className={cn(
                    "py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer flex flex-col items-center",
                    form[key] === "SI"
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-white text-on-surface-variant border-outline-variant"
                  )}
                >
                  <span>{label}</span>
                  <span className="text-[10px] mt-0.5">{form[key]}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
              Observaciones
            </label>
            <textarea
              rows={2}
              value={form.observacion}
              onChange={(e) => setForm({ ...form, observacion: e.target.value })}
              className="input-green"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-outline-variant">
            {record ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-background cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-lg shadow-primary/25 cursor-pointer disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Guardando..." : "Guardar Recepción"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
