import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const numId = parseInt(id, 10);
    const body = await request.json();

    const { rows } = await query(
      `UPDATE dispatch_receptions SET
        fecha_recepcion = $1,
        numero_guia = $2,
        cantidad_equipos = $3,
        modelo = $4,
        serial = $5,
        razon_social = $6,
        caja = $7,
        cargador = $8,
        bateria = $9,
        simcard = $10,
        rollo = $11,
        forro = $12,
        estatus = $13,
        observacion = $14,
        updated_at = NOW()
      WHERE id = $15
      RETURNING *`,
      [
        body.fecha_recepcion || null,
        body.numero_guia ? String(body.numero_guia).trim().toUpperCase() : null,
        parseInt(body.cantidad_equipos || "1", 10) || 1,
        body.modelo ? String(body.modelo).trim().toUpperCase() : null,
        body.serial ? String(body.serial).trim().toUpperCase() : null,
        body.razon_social || null,
        body.caja === "SI" ? "SI" : "NO",
        body.cargador === "SI" ? "SI" : "NO",
        body.bateria === "SI" ? "SI" : "NO",
        body.simcard === "SI" ? "SI" : "NO",
        body.rollo === "SI" ? "SI" : "NO",
        body.forro === "SI" ? "SI" : "NO",
        body.estatus || "ENTREGADO A ST",
        body.observacion || null,
        numId,
      ]
    );

    if (!rows[0]) {
      return NextResponse.json({ error: "Recepción no encontrada" }, { status: 404 });
    }

    const updated = rows[0];
    await query(
      `INSERT INTO activity_logs (entity_type, entity_id, reference, user_email, user_name, department, action, summary)
       VALUES ('RECEPTION', $1, $2, $3, $4, 'RECEPCION', 'ACTUALIZAR', $5)`,
      [
        numId,
        updated.serial || updated.numero_guia || String(numId),
        user?.email || "sistema@vatc.com",
        user?.full_name || "Operador",
        `Recepción #${numId} actualizada (${updated.serial || "S/S"}) • Estatus: ${updated.estatus}`,
      ]
    );

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("PATCH /api/receptions/[id] error:", err);
    return NextResponse.json({ error: "Error actualizando recepción" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const numId = parseInt(id, 10);

    const { rows } = await query("DELETE FROM dispatch_receptions WHERE id = $1 RETURNING *", [numId]);
    if (!rows[0]) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    await query(
      `INSERT INTO activity_logs (entity_type, entity_id, reference, user_email, user_name, department, action, summary)
       VALUES ('RECEPTION', $1, $2, $3, $4, 'RECEPCION', 'ELIMINAR', $5)`,
      [
        numId,
        rows[0].serial || String(numId),
        user?.email || "sistema@vatc.com",
        user?.full_name || "Operador",
        `Recepción #${numId} eliminada (${rows[0].serial || "S/S"})`,
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/receptions/[id] error:", err);
    return NextResponse.json({ error: "Error eliminando recepción" }, { status: 500 });
  }
}
