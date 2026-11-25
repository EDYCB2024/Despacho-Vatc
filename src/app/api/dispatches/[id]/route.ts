import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const [dispRes, logsRes] = await Promise.all([
      query("SELECT * FROM dispatches WHERE id = $1", [numId]),
      query(
        "SELECT * FROM activity_logs WHERE entity_type = 'DISPATCH' AND entity_id = $1 ORDER BY created_at DESC LIMIT 30",
        [numId]
      ),
    ]);

    if (!dispRes.rows[0]) {
      return NextResponse.json({ error: "Despacho no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      data: dispRes.rows[0],
      logs: logsRes.rows,
    });
  } catch (err) {
    console.error("GET /api/dispatches/[id] error:", err);
    return NextResponse.json({ error: "Error consultando despacho" }, { status: 500 });
  }
}

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
      `UPDATE dispatches SET
        categoria = COALESCE($1, categoria),
        solicitado_por = $2,
        fecha_solicitud = $3,
        fecha_envio = $4,
        proceso_especial = $5,
        referencia_envio = $6,
        factura = $7,
        descripcion_contenido = $8,
        serial = $9,
        razon_social = $10,
        destinatario = $11,
        persona_contacto = $12,
        cedula_identidad = $13,
        telefono_contacto = $14,
        ciudad_destino = $15,
        sede_zoom = $16,
        costo_destino = $17,
        numero_guia = $18,
        estatus_zoom = $19,
        observacion = $20,
        updated_at = NOW()
      WHERE id = $21
      RETURNING *`,
      [
        body.categoria || null,
        body.solicitado_por || null,
        body.fecha_solicitud || null,
        body.fecha_envio || null,
        body.proceso_especial || null,
        body.referencia_envio || null,
        body.factura || null,
        body.descripcion_contenido || null,
        body.serial ? String(body.serial).trim().toUpperCase() : null,
        body.razon_social || null,
        body.destinatario || null,
        body.persona_contacto || null,
        body.cedula_identidad || null,
        body.telefono_contacto || null,
        body.ciudad_destino ? String(body.ciudad_destino).trim().toUpperCase() : null,
        body.sede_zoom || null,
        body.costo_destino || null,
        body.numero_guia ? String(body.numero_guia).trim().toUpperCase() : null,
        body.estatus_zoom || "EN TRANSITO",
        body.observacion || null,
        numId,
      ]
    );

    if (!rows[0]) {
      return NextResponse.json({ error: "Despacho no encontrado" }, { status: 404 });
    }

    const updated = rows[0];

    await query(
      `INSERT INTO activity_logs (entity_type, entity_id, reference, user_email, user_name, department, action, summary)
       VALUES ('DISPATCH', $1, $2, $3, $4, 'DESPACHO', 'ACTUALIZAR', $5)`,
      [
        numId,
        updated.numero_guia || updated.serial || String(numId),
        user?.email || "sistema@vatc.com",
        user?.full_name || "Operador",
        `Actualización de despacho #${numId} (${updated.destinatario || "S/D"}) — Guía: ${updated.numero_guia || "S/G"} • Estatus ZOOM: ${updated.estatus_zoom}`,
      ]
    );

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("PATCH /api/dispatches/[id] error:", err);
    return NextResponse.json({ error: "Error actualizando despacho" }, { status: 500 });
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

    const { rows } = await query("DELETE FROM dispatches WHERE id = $1 RETURNING *", [numId]);
    if (!rows[0]) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    await query(
      `INSERT INTO activity_logs (entity_type, entity_id, reference, user_email, user_name, department, action, summary)
       VALUES ('DISPATCH', $1, $2, $3, $4, 'DESPACHO', 'ELIMINAR', $5)`,
      [
        numId,
        rows[0].numero_guia || rows[0].serial || String(numId),
        user?.email || "sistema@vatc.com",
        user?.full_name || "Operador",
        `Despacho #${numId} eliminado (${rows[0].destinatario || "S/D"})`,
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/dispatches/[id] error:", err);
    return NextResponse.json({ error: "Error eliminando despacho" }, { status: 500 });
  }
}
