"use client";

import { useEffect, useState } from "react";
import { X, PlusCircle, Search } from "lucide-react";
import {
  DispatchCategory,
  DispatchRecord,
  ESTATUS_ZOOM_OPTIONS,
  COSTO_DESTINO_OPTIONS,
  PROCESO_ESPECIAL_OPTIONS,
} from "@/types/crm";

interface NewDispatchModalProps {
  open: boolean;
  defaultCategory?: DispatchCategory;
  onClose: () => void;
  onCreated: (created: DispatchRecord) => void;
}

export function NewDispatchModal({
  open,
  defaultCategory = "SIMCARD_ST",
  onClose,
  onCreated,
}: NewDispatchModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    categoria: defaultCategory,
    solicitado_por: "",
    fecha_solicitud: today,
    fecha_envio: today,
    proceso_especial: "PROCESO REGULAR",
    referencia_envio: defaultCategory === "KIT" ? "MERCANCIA" : "DOCUMENTO",
    factura: "",
    descripcion_contenido:
      defaultCategory === "EQUIPOS_NUEVOS"
        ? "EQUIPO NUEVO POS"
        : defaultCategory === "KIT"
          ? "GENERACION DE KIT POS"
          : "SIMCARD",
    serial: "",
    destinatario: "",
    persona_contacto: "",
    cedula_identidad: "",
    telefono_contacto: "",
    ciudad_destino: "",
    sede_zoom: "",
    costo_destino: "COBRO VATC",
    numero_guia: "",
    estatus_zoom: "EN TRANSITO",
    observacion: "",
  });

  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      categoria: defaultCategory,
      referencia_envio: defaultCategory === "KIT" ? "MERCANCIA" : "DOCUMENTO",
      descripcion_contenido:
        defaultCategory === "EQUIPOS_NUEVOS"
          ? "EQUIPO NUEVO POS"
          : defaultCategory === "KIT"
            ? "GENERACION DE KIT POS"
            : "SIMCARD",
    }));
  }, [defaultCategory, open]);

  if (!open) return null;

  const handleLookupSerial = async () => {
    if (!form.serial.trim()) return;
    setLookingUp(true);
    try {
      const res = await fetch(`/api/pos-directory?serial=${encodeURIComponent(form.serial.trim())}`);
      const json = await res.json();
      if (json.data) {
        setForm((prev) => ({
          ...prev,
          destinatario: prev.destinatario || json.data.razon_social || "",
          cedula_identidad: prev.cedula_identidad || json.data.rif_cliente || "",
        }));
      }
    } finally {
      setLookingUp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/dispatches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No se pudo registrar el despacho.");
        setSaving(false);
        return;
      }
      onCreated(json.data);
      onClose();
    } catch {
      setError("Error de red al registrar despacho.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-outline-variant w-full max-w-2xl max-h-[94dvh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-container text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/80">
              Logística ZOOM • Despacho VATC
            </p>
            <h2 className="text-base sm:text-lg font-black">Registrar Nuevo Despacho</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Categoría de Despacho *
              </label>
              <select
                value={form.categoria}
                onChange={(e) =>
                  setForm({ ...form, categoria: e.target.value as DispatchCategory })
                }
                className="input-green font-bold"
              >
                <option value="SIMCARD_ST">SIMCARD / Serv. Técnico / Traslado</option>
                <option value="KIT">Despacho - Generación de Kit</option>
                <option value="EQUIPOS_NUEVOS">Despacho - Equipos Nuevos</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Número de Guía ZOOM
              </label>
              <input
                value={form.numero_guia}
                onChange={(e) => setForm({ ...form, numero_guia: e.target.value.toUpperCase() })}
                placeholder="Ej. 1590884398"
                className="input-green font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Serial del Equipo (Autocompletar BDDIC25)
              </label>
              <div className="flex gap-1.5">
                <input
                  value={form.serial}
                  onChange={(e) => setForm({ ...form, serial: e.target.value.toUpperCase() })}
                  placeholder="Ej. N7B405555646"
                  className="input-green font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={handleLookupSerial}
                  disabled={lookingUp || !form.serial}
                  className="px-3 rounded-xl bg-secondary-container text-primary hover:bg-primary hover:text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
                  title="Buscar Serial en BDDIC25"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Estatus ZOOM
              </label>
              <select
                value={form.estatus_zoom}
                onChange={(e) => setForm({ ...form, estatus_zoom: e.target.value })}
                className="input-green font-bold"
              >
                {ESTATUS_ZOOM_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Destinatario / Razón Social *
              </label>
              <input
                required
                value={form.destinatario}
                onChange={(e) => setForm({ ...form, destinatario: e.target.value.toUpperCase() })}
                placeholder="Nombre del comercio o destinatario"
                className="input-green"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Persona de Contacto
              </label>
              <input
                value={form.persona_contacto}
                onChange={(e) =>
                  setForm({ ...form, persona_contacto: e.target.value.toUpperCase() })
                }
                className="input-green"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Cédula / RIF
              </label>
              <input
                value={form.cedula_identidad}
                onChange={(e) =>
                  setForm({ ...form, cedula_identidad: e.target.value.toUpperCase() })
                }
                placeholder="V-12345678 / J-123456789"
                className="input-green font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Teléfono Contacto
              </label>
              <input
                value={form.telefono_contacto}
                onChange={(e) => setForm({ ...form, telefono_contacto: e.target.value })}
                placeholder="4121234567"
                className="input-green font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Ciudad Destino *
              </label>
              <input
                required
                value={form.ciudad_destino}
                onChange={(e) => setForm({ ...form, ciudad_destino: e.target.value.toUpperCase() })}
                placeholder="Ej. VALENCIA, BARCELONA, MERIDA..."
                className="input-green font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Referencia de Envío
              </label>
              <input
                value={form.referencia_envio}
                onChange={(e) =>
                  setForm({ ...form, referencia_envio: e.target.value.toUpperCase() })
                }
                placeholder="DOCUMENTO, MERCANCIA, TRASLADO..."
                className="input-green"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Descripción de Contenido
              </label>
              <input
                value={form.descripcion_contenido}
                onChange={(e) =>
                  setForm({ ...form, descripcion_contenido: e.target.value.toUpperCase() })
                }
                placeholder="SIMCARD DIGITEL, SERVICIO TECNICO..."
                className="input-green"
              />
            </div>

            {form.categoria === "EQUIPOS_NUEVOS" ? (
              <>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                    Factura
                  </label>
                  <input
                    value={form.factura}
                    onChange={(e) => setForm({ ...form, factura: e.target.value.toUpperCase() })}
                    placeholder="Ej. A-16408"
                    className="input-green font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                    Proceso Especial
                  </label>
                  <select
                    value={form.proceso_especial}
                    onChange={(e) => setForm({ ...form, proceso_especial: e.target.value })}
                    className="input-green"
                  >
                    {PROCESO_ESPECIAL_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                    Solicitado Por
                  </label>
                  <input
                    value={form.solicitado_por}
                    onChange={(e) =>
                      setForm({ ...form, solicitado_por: e.target.value.toUpperCase() })
                    }
                    placeholder="Ej. DALIANA GIL, KEVIN RODRIGUEZ..."
                    className="input-green"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                    Costo Destino
                  </label>
                  <select
                    value={form.costo_destino}
                    onChange={(e) => setForm({ ...form, costo_destino: e.target.value })}
                    className="input-green"
                  >
                    {COSTO_DESTINO_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Fecha de Envío
              </label>
              <input
                type="date"
                value={form.fecha_envio}
                onChange={(e) => setForm({ ...form, fecha_envio: e.target.value })}
                className="input-green"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Sede / Agencia ZOOM
              </label>
              <input
                value={form.sede_zoom}
                onChange={(e) => setForm({ ...form, sede_zoom: e.target.value })}
                placeholder="Agencia ZOOM destino"
                className="input-green"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Observación
              </label>
              <textarea
                rows={2}
                value={form.observacion}
                onChange={(e) => setForm({ ...form, observacion: e.target.value })}
                className="input-green"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant">
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
              <PlusCircle className="w-4 h-4" />
              <span>{saving ? "Registrando..." : "Registrar Despacho"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
