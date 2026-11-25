import { DispatchesBoard } from "@/components/dispatches/DispatchesBoard";

export default function EquiposNuevosPage() {
  return (
    <DispatchesBoard
      categoria="EQUIPOS_NUEVOS"
      title="Despacho — Equipos Nuevos"
      subtitle="Control de envíos de terminales nuevos con factura, proceso especial, serial y guía ZOOM"
    />
  );
}
