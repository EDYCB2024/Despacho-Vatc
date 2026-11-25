"use client";

import { useEffect, useState } from "react";
import {
  X,
  Save,
  Truck,
  History,
  MessageCircle,
  Trash2,
  CheckCircle2,
  Search,
} from "lucide-react";
import {
  DispatchRecord,
  DispatchCategory,
  ActivityLog,
  CATEGORIA_LABELS,
  ESTATUS_ZOOM_OPTIONS,
  COSTO_DESTINO_OPTIONS,
  PROCESO_ESPECIAL_OPTIONS,
} from "@/types/crm";
import {
  buildDispatchWhatsAppLink,
  cn,
  formatDate,
  getStatusBadgeClass,
} from "@/lib/utils";

interface DispatchDetailModalProps {
  dispatchId: number | null;
  onClose: () => void;
  onSaved: (updated: DispatchRecord) => void;
  onDeleted?: (id: number) => void;
}

export function DispatchDetailModal({
  dispatchId,
  onClose,
  onSaved,
  onDeleted,
}: DispatchDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"ficha" | "historial">("ficha");
  const [form, setForm] = useState<Partial<DispatchRecord>>({});
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  useEffect(() => {
    if (!dispatchId) return;
    setLoading(true);
    setActiveTab("ficha");
    fetch(`/api/dispatches/${dispatchId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setForm(res.data);
        if (res.logs) setLogs(res.logs);
      })
      .finally(() => setLoading(false));
  }, [dispatchId]);

  if (!dispatchId) return null;

  const setField = (key: keyof DispatchRecord, value: string | null) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLookupSerial = async () => {
    if (!form.serial) return;
    setLookingUp(true);
    try {
      const res = await fetch(`/api/pos-directory?serial=${encodeURIComponent(form.serial)}`);
      const json = await res.json();
      if (json.data) {
        setForm((prev) => ({
          ...prev,
          razon_social: prev.razon_social || json.data.razon_social,
          destinatario: prev.destinatario || json.data.razon_social,
          cedula_identidad: prev.cedula_identidad || json.data.rif_cliente,
        }));
      }
    } finally {
      setLookingUp(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedNotice(false);
    try {
      const res = await fetch(`/api/dispatches/${dispatchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setForm(json.data);
        onSaved(json.data);
        setSavedNotice(true);
        const detail = await fetch(`/api/dispatches/${dispatchId}`).then((r) => r.json());
        if (detail.logs) setLogs(detail.logs);
        setTimeout(() => setSavedNotice(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Seguro que deseas eliminar el despacho #${dispatchId} (Guía: ${form.numero_guia || "S/G"})?`)) {
      return;
    }
    const res = await fetch(`/api/dispatches/${dispatchId}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted?.(dispatchId);
      onClose();
    }
  };

  const waUrl = buildDispatchWhatsAppLink({
    phone: form.telefono_contacto,
    destinatario: form.destinatario || form.razon_social,
    guia: form.numero_guia,
    ciudad: form.ciudad_destino,
    contenido: form.descripcion_contenido || form.referencia_envio,
    serial: form.serial,
    estatus: form.estatus_zoom,
  });

  const dateVal = (v: string | null | undefined) => (v ? String(v).slice(0, 10) : "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6">
      <div className="bg-white rounded-3xl shadow-2xl border border-outline-variant w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-container text-white px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                Despacho #{dispatchId}
              </span>
              {form.categoria && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-black/20 px-2.5 py-0.5 rounded-full">
                  {CATEGORIA_LABELS[form.categoria as DispatchCategory] || form.categoria}
                </span>
              )}
              {form.numero_guia && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-white/15 px-2.5 py-0.5 rounded-full">
                  Guía ZOOM: {form.numero_guia}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight mt-1 truncate">
              {form.destinatario || form.razon_social || "Sin destinatario"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2 bg-surface-container border-b border-outline-variant">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("ficha")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                activeTab === "ficha"
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-on-surface-variant hover:bg-white hover:text-primary"
              )}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Expediente de Despacho</span>
            </button>
            <button
              onClick={() => setActiveTab("historial")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                activeTab === "historial"
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-on-surface-variant hover:bg-white hover:text-primary"
              )}
            >
              <History className="w-3.5 h-3.5" />
              <span>Historial ({logs.length})</span>
            </button>
          </div>

          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Notificar Guía por WhatsApp</span>
            </a>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="py-16 text-center text-sm text-on-surface-variant">
              Cargando expediente desde Neon...
            </div>
          ) : activeTab === "ficha" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Categoría de Despacho">
                <select
                  value={form.categoria || "SIMCARD_ST"}
                  onChange={(e) => setField("categoria", e.target.value)}
                  className="input-green font-bold"
                >
                  <option value="SIMCARD_ST">SIMCARD / Serv. Técnico / Traslado</option>
                  <option value="KIT">Despacho - Generación de Kit</option>
                  <option value="EQUIPOS_NUEVOS">Despacho - Equipos Nuevos</option>
                </select>
              </Field>

              <Field label="Número de Guía ZOOM">
                <input
                  value={form.numero_guia || ""}
                  onChange={(e) => setField("numero_guia", e.target.value.toUpperCase())}
                  className="input-green font-mono font-bold text-primary"
                  placeholder="Ej. 1590884398"
                />
              </Field>

              <Field label="Estatus ZOOM">
                <select
                  value={form.estatus_zoom || ""}
                  onChange={(e) => setField("estatus_zoom", e.target.value)}
                  className="input-green font-bold"
                >
                  {ESTATUS_ZOOM_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                  {form.estatus_zoom && !ESTATUS_ZOOM_OPTIONS.includes(form.estatus_zoom) && (
                    <option value={form.estatus_zoom}>{form.estatus_zoom}</option>
                  )}
                </select>
              </Field>

              <Field label="Serial del Equipo (Autocompletar BDDIC25)">
                <div className="flex gap-1.5">
                  <input
                    value={form.serial || ""}
                    onChange={(e) => setField("serial", e.target.value.toUpperCase())}
                    className="input-green font-mono font-bold"
                    placeholder="Ej. N7B405555334"
                  />
                  <button
                    type="button"
                    onClick={handleLookupSerial}
                    disabled={lookingUp || !form.serial}
                    title="Buscar en BDDIC25"
                    className="px-2.5 rounded-xl bg-secondary-container text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Field>

              <Field label="Destinatario / Razón Social" className="md:col-span-2">
                <input
                  value={form.destinatario || form.razon_social || ""}
                  onChange={(e) => {
                    setField("destinatario", e.target.value);
                    setField("razon_social", e.target.value);
                  }}
                  className="input-green font-semibold"
                />
              </Field>

              <Field label="Persona de Contacto">
                <input
                  value={form.persona_contacto || ""}
                  onChange={(e) => setField("persona_contacto", e.target.value)}
                  className="input-green"
                />
              </Field>

              <Field label="Cédula / RIF">
                <input
                  value={form.cedula_identidad || ""}
                  onChange={(e) => setField("cedula_identidad", e.target.value.toUpperCase())}
                  className="input-green font-mono"
                />
              </Field>

              <Field label="Teléfono Contacto (WhatsApp)">
                <input
                  value={form.telefono_contacto || ""}
                  onChange={(e) => setField("telefono_contacto", e.target.value)}
                  className="input-green font-mono"
                />
              </Field>

              <Field label="Ciudad Destino">
                <input
                  value={form.ciudad_destino || ""}
                  onChange={(e) => setField("ciudad_destino", e.target.value.toUpperCase())}
                  className="input-green font-bold"
                />
              </Field>

              <Field label="Sede / Agencia ZOOM">
                <input
                  value={form.sede_zoom || ""}
                  onChange={(e) => setField("sede_zoom", e.target.value)}
                  className="input-green"
                />
              </Field>

              <Field label="Costo Destino">
                <select
                  value={form.costo_destino || "COBRO VATC"}
                  onChange={(e) => setField("costo_destino", e.target.value)}
                  className="input-green"
                >
                  {COSTO_DESTINO_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Solicitado Por">
                <input
                  value={form.solicitado_por || ""}
                  onChange={(e) => setField("solicitado_por", e.target.value.toUpperCase())}
                  className="input-green"
                />
              </Field>

              <Field label="Fecha de Solicitud">
                <input
                  type="date"
                  value={dateVal(form.fecha_solicitud)}
                  onChange={(e) => setField("fecha_solicitud", e.target.value)}
                  className="input-green"
                />
              </Field>

              <Field label="Fecha de Envío">
                <input
                  type="date"
                  value={dateVal(form.fecha_envio)}
                  onChange={(e) => setField("fecha_envio", e.target.value)}
                  className="input-green"
                />
              </Field>

              <Field label="Referencia de Envío">
                <input
                  value={form.referencia_envio || ""}
                  onChange={(e) => setField("referencia_envio", e.target.value.toUpperCase())}
                  className="input-green"
                  placeholder="DOCUMENTO, MERCANCIA, TRASLADO..."
                />
              </Field>

              <Field label="Descripción de Contenido">
                <input
                  value={form.descripcion_contenido || ""}
                  onChange={(e) => setField("descripcion_contenido", e.target.value.toUpperCase())}
                  className="input-green"
                  placeholder="SIMCARD, SERVICIO TECNICO, KIT..."
                />
              </Field>

              <Field label="Factura / Proceso Especial">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={form.factura || ""}
                    onChange={(e) => setField("factura", e.target.value.toUpperCase())}
                    className="input-green font-mono"
                    placeholder="Factura A-16408"
                  />
                  <select
                    value={form.proceso_especial || ""}
                    onChange={(e) => setField("proceso_especial", e.target.value)}
                    className="input-green"
                  >
                    <option value="">Proceso...</option>
                    {PROCESO_ESPECIAL_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>

              <Field label="Observaciones" className="md:col-span-3">
                <textarea
                  rows={3}
                  value={form.observacion || ""}
                  onChange={(e) => setField("observacion", e.target.value)}
                  className="input-green"
                />
              </Field>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.length === 0 ? (
                <p className="text-xs text-on-surface-variant py-8 text-center">
                  No hay movimientos registrados para este despacho.
                </p>
              ) : (
                logs.map((l) => (
                  <div
                    key={l.id}
                    className="p-3.5 rounded-2xl bg-background border border-outline-variant/60 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-secondary-container text-primary">
                          {l.action}
                        </span>
                        <span className="text-xs font-bold text-on-surface">
                          {l.user_name || l.user_email}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">{l.summary}</p>
                    </div>
                    <span className="text-[11px] text-outline whitespace-nowrap">
                      {formatDate(l.created_at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface-container border-t border-outline-variant flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar</span>
          </button>

          <div className="flex items-center gap-3">
            {savedNotice && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                Guardado en Neon
              </span>
            )}
            <span
              className={cn(
                "hidden sm:inline-flex px-3 py-1 rounded-full text-[11px] font-bold border",
                getStatusBadgeClass(form.estatus_zoom)
              )}
            >
              {form.estatus_zoom || "EN TRANSITO"}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-outline-variant bg-white text-xs font-bold text-on-surface-variant hover:bg-background cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
