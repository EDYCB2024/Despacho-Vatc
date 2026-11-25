import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const s = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

export function buildDispatchWhatsAppLink(params: {
  phone?: string | null;
  destinatario?: string | null;
  guia?: string | null;
  ciudad?: string | null;
  contenido?: string | null;
  serial?: string | null;
  estatus?: string | null;
}): string | null {
  const raw = (params.phone || "").replace(/[^0-9]/g, "");
  if (!raw) return null;
  const normalized = raw.startsWith("58")
    ? raw
    : raw.startsWith("0")
      ? `58${raw.slice(1)}`
      : `58${raw}`;

  const destinatario = params.destinatario || "Estimado Cliente";
  const guia = params.guia || "asignada";
  const ciudad = params.ciudad ? ` con destino a *${params.ciudad}*` : "";
  const serialTxt = params.serial ? ` (Serial: *${params.serial}*)` : "";
  const contenido = params.contenido || "su envío";
  const estatus = params.estatus || "EN TRÁNSITO";

  const text = `Buen día, *${destinatario}*.\nLe saludamos del *Departamento de Despacho de VA TECHNOLOGY COMMUNICATION, C.A (VATC)*.\nLe informamos que ${contenido}${serialTxt} fue procesado vía *ZOOM*${ciudad} bajo el número de guía *${guia}* (Estatus actual: *${estatus}*).\nPor favor conserve este número de guía para su seguimiento o retiro en agencia ZOOM.`;

  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

export function getStatusBadgeClass(status: string | null | undefined): string {
  const s = (status || "").toUpperCase();
  if (!s) return "bg-stone-100 text-stone-600 border-stone-200";
  if (
    s.includes("ENTREGADO") ||
    s === "ACTIVO" ||
    s === "SI"
  ) {
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  }
  if (
    s.includes("TRANSITO") ||
    s.includes("TRÁNSITO") ||
    s.includes("DISPONIBLE") ||
    s.includes("OPERACIONES") ||
    s === "NUEVO" ||
    s.includes("ACUERDO") ||
    s.includes("CONVENIO")
  ) {
    return "bg-teal-50 text-teal-800 border-teal-200";
  }
  if (
    s.includes("PENDIENTE") ||
    s.includes("ALMACEN") ||
    s.includes("SERVICIO")
  ) {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }
  if (
    s.includes("DEVOL") ||
    s.includes("NO PASO") ||
    s.includes("NO RETIRO") ||
    s.includes("ELIMINADA") ||
    s.includes("INACTIVO") ||
    s === "NO"
  ) {
    return "bg-rose-50 text-rose-800 border-rose-200";
  }
  return "bg-primary/10 text-primary border-primary/20";
}
