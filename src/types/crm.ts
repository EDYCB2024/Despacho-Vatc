export type DispatchCategory = "SIMCARD_ST" | "KIT" | "EQUIPOS_NUEVOS";

export interface DispatchRecord {
  id: number;
  categoria: DispatchCategory;
  solicitado_por: string | null;
  fecha_solicitud: string | null;
  fecha_envio: string | null;
  proceso_especial: string | null;
  referencia_envio: string | null;
  factura: string | null;
  descripcion_contenido: string | null;
  serial: string | null;
  razon_social: string | null;
  destinatario: string | null;
  persona_contacto: string | null;
  cedula_identidad: string | null;
  telefono_contacto: string | null;
  ciudad_destino: string | null;
  sede_zoom: string | null;
  costo_destino: string | null;
  numero_guia: string | null;
  estatus_zoom: string | null;
  observacion: string | null;
  created_at: string;
  updated_at: string;
}

export interface DispatchReception {
  id: number;
  fecha_recepcion: string | null;
  numero_guia: string | null;
  cantidad_equipos: number;
  modelo: string | null;
  serial: string | null;
  razon_social: string | null;
  caja: string | null;
  cargador: string | null;
  bateria: string | null;
  simcard: string | null;
  rollo: string | null;
  forro: string | null;
  estatus: string | null;
  observacion: string | null;
  created_at: string;
  updated_at: string;
}

export interface PosDirectoryRecord {
  id: number;
  serial: string;
  rif_cliente: string | null;
  razon_social: string | null;
  banco: string | null;
  procesadora: string | null;
  fecha: string | null;
  plan: string | null;
  estatus: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  entity_type: string | null;
  entity_id: number | null;
  reference: string | null;
  user_email: string | null;
  user_name: string | null;
  department: string;
  action: string;
  summary: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface DashboardStats {
  totals: {
    totalDispatches: number;
    simcardStCount: number;
    kitCount: number;
    equiposNuevosCount: number;
    entregadosCount: number;
    enTransitoCount: number;
    disponibleRetiroCount: number;
    incidenciasCount: number;
    totalReceptions: number;
    totalPosDirectory: number;
  };
  byCategoria: { name: string; value: number }[];
  byEstatusZoom: { name: string; value: number }[];
  byCiudadDestino: { name: string; value: number }[];
  byRecepcionModelo: { name: string; value: number }[];
  byRecepcionEstatus: { name: string; value: number }[];
  byPosBanco: { name: string; value: number }[];
  byPosProcesadora: { name: string; value: number }[];
  byPosPlan: { name: string; value: number }[];
  recentActivity: ActivityLog[];
}

export const CATEGORIA_LABELS: Record<DispatchCategory, string> = {
  SIMCARD_ST: "SIMCARD / Serv. Técnico / Traslado",
  KIT: "Despacho - Generación de Kit",
  EQUIPOS_NUEVOS: "Despacho - Equipos Nuevos",
};

export const ESTATUS_ZOOM_OPTIONS = [
  "ENTREGADO",
  "EN TRANSITO",
  "DISPONIBLE PARA RETIRO",
  "NO PASO A RETIRAR",
  "RETORNADO AL ALMACEN",
  "DEVOLUCION",
  "GUIA ELIMINADA",
  "PENDIENTE",
];

export const COSTO_DESTINO_OPTIONS = [
  "COBRO VATC",
  "COBRO A DESTINO",
];

export const PROCESO_ESPECIAL_OPTIONS = [
  "PROCESO REGULAR",
  "PROCESO ESPECIAL",
  "RECIPROCIDAD",
  "ENVIO DE EQUIPO",
];

export const ESTATUS_RECEPCION_OPTIONS = [
  "ENTREGADO A ST",
  "OPERACIONES",
  "ALMACEN",
  "ALBERTO",
  "DEVOLUCION",
];

export const MODELOS_POS_SUGERIDOS = [
  "N910",
  "ME60",
  "SP600",
  "NEW 6210",
  "NEW 7210",
  "N950S",
  "ME51",
  "N750",
];

export const BANCOS_DIRECTORIO = [
  "BBVA Provincial",
  "Banco de Venezuela",
  "Bancaribe",
  "Del Sur",
  "Banco Exterior",
  "Banco Mercantil",
  "Bancrecer",
  "Banco Caroní",
  "Banco Activo",
  "Banplus",
  "Banco Plaza",
  "Mi Banco",
  "BFC Banco Fondo Común",
];
