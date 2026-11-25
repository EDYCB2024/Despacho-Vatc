"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Database,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { UserContext } from "../DashboardShell";
import { PosDirectoryRecord, BANCOS_DIRECTORIO } from "@/types/crm";
import { cn, formatDate, getStatusBadgeClass } from "@/lib/utils";

export default function DirectorioPosPage() {
  const user = useContext(UserContext);
  const [records, setRecords] = useState<PosDirectoryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [banco, setBanco] = useState("");
  const [procesadora, setProcesadora] = useState("");
  const [estatus, setEstatus] = useState("");
  const [exporting, setExporting] = useState(false);

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
      if (banco) qs.set("banco", banco);
      if (procesadora) qs.set("procesadora", procesadora);
      if (estatus) qs.set("estatus", estatus);
      qs.set("page", String(page));
      qs.set("pageSize", "50");
      if (extra) {
        for (const [k, v] of Object.entries(extra)) qs.set(k, v);
      }
      return qs.toString();
    },
    [debouncedSearch, banco, procesadora, estatus, page]
  );

  const fetchDirectory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pos-directory?${buildQueryParams()}`);
      const json = await res.json();
      setRecords(json.data || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams]);

  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/pos-directory?${buildQueryParams({ export: "1" })}`);
      const json = await res.json();
      const rows = (json.data || []) as PosDirectoryRecord[];
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "BDDIC25");
      XLSX.writeFile(wb, `DESPACHO_VATC_BDDIC25_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <TopBar
        title="Base Maestro POS (BDDIC25)"
        subtitle="Directorio nacional de 29,986 terminales POS por Serial, RIF, Comercio, Banco, Procesadora y Plan"
        user={user}
      />

      <main className="p-4 sm:p-6 space-y-5 max-w-[1600px] mx-auto w-full">
        <section className="bg-white border border-outline-variant rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[260px] max-w-lg">
              <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar en los 29,986 POS por Serial, RIF, Razón Social, Banco o Plan..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchDirectory}
                className="p-2.5 rounded-xl border border-outline-variant bg-white hover:bg-secondary-container text-primary transition-colors cursor-pointer"
                title="Recargar"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </button>

              <button
                onClick={handleExportExcel}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white hover:bg-secondary-container text-primary text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{exporting ? "Exportando..." : "Exportar Excel (5,000)"}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant/60">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mr-1">
              <Filter className="w-3.5 h-3.5 text-primary" />
              <span>Filtros:</span>
            </div>

            <select
              value={banco}
              onChange={(e) => {
                setBanco(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-outline-variant bg-background text-xs font-medium focus:outline-none focus:border-primary"
            >
              <option value="">Todos los Bancos</option>
              {BANCOS_DIRECTORIO.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <select
              value={procesadora}
              onChange={(e) => {
                setProcesadora(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-outline-variant bg-background text-xs font-medium focus:outline-none focus:border-primary"
            >
              <option value="">Todas las Procesadoras</option>
              <option value="CREDICARD">CREDICARD</option>
              <option value="PLATCO">PLATCO</option>
            </select>

            <select
              value={estatus}
              onChange={(e) => {
                setEstatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-outline-variant bg-background text-xs font-medium focus:outline-none focus:border-primary"
            >
              <option value="">Todos los Estatus</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
              <option value="Nuevo">Nuevo</option>
              <option value="Servicio Técnico">Servicio Técnico</option>
              <option value="Acuerdo de Pago">Acuerdo de Pago</option>
              <option value="Convenio">Convenio</option>
            </select>

            {(search || banco || procesadora || estatus) && (
              <button
                onClick={() => {
                  setSearch("");
                  setBanco("");
                  setProcesadora("");
                  setEstatus("");
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-primary hover:bg-secondary-container cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}

            <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-primary">
              <Database className="w-3.5 h-3.5" />
              {total.toLocaleString()} terminales POS
            </span>
          </div>
        </section>

        <section className="bg-white border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary-container/60 border-b border-outline-variant text-[11px] font-black uppercase tracking-wider text-primary">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Serial</th>
                  <th className="py-3 px-4">RIF Cliente</th>
                  <th className="py-3 px-4">Razón Social / Comercio</th>
                  <th className="py-3 px-4">Banco</th>
                  <th className="py-3 px-4">Procesadora</th>
                  <th className="py-3 px-4">Plan Comercial</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-on-surface-variant">
                      Consultando directorio BDDIC25 en Neon PostgreSQL...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-on-surface-variant">
                      No se encontraron terminales con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-secondary-container/25 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-outline">{r.id}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-primary whitespace-nowrap">
                        {r.serial}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-on-surface-variant whitespace-nowrap">
                        {r.rif_cliente || "—"}
                      </td>
                      <td className="py-2.5 px-4 max-w-[280px] truncate font-semibold text-on-surface">
                        {r.razon_social || "—"}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-on-surface-variant whitespace-nowrap">
                        {r.banco || "—"}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-bold text-[10px]">
                          {r.procesadora || "—"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap font-medium">
                        {r.plan || "—"}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap text-outline">
                        {formatDate(r.fecha)}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={cn(
                            "inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap",
                            getStatusBadgeClass(r.estatus)
                          )}
                        >
                          {r.estatus || "—"}
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
              <strong>{totalPages.toLocaleString()}</strong> ({total.toLocaleString()} terminales)
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
    </>
  );
}
