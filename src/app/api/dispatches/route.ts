import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const categoria = (searchParams.get("categoria") || "").trim();
    const estatusZoom = (searchParams.get("estatus_zoom") || "").trim();
    const ciudad = (searchParams.get("ciudad_destino") || "").trim();
    const costoDestino = (searchParams.get("costo_destino") || "").trim();
    const exportAll = searchParams.get("export") === "1";

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const pageSize = exportAll
      ? 5000
      : Math.min(200, Math.max(10, parseInt(searchParams.get("pageSize") || "35", 10) || 35));
    const offset = exportAll ? 0 : (page - 1) * pageSize;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      conditions.push(
        `(serial ILIKE $${idx} OR numero_guia ILIKE $${idx} OR destinatario ILIKE $${idx} OR razon_social ILIKE $${idx} OR persona_contacto ILIKE $${idx} OR cedula_identidad ILIKE $${idx} OR ciudad_destino ILIKE $${idx} OR referencia_envio ILIKE $${idx} OR factura ILIKE $${idx} OR descripcion_contenido ILIKE $${idx})`
      );
    }
    if (categoria) {
      params.push(categoria);
      conditions.push(`categoria = $${params.length}`);
    }
    if (estatusZoom) {
      params.push(estatusZoom);
      conditions.push(`estatus_zoom = $${params.length}`);
    }
    if (ciudad) {
      params.push(`%${ciudad}%`);
      conditions.push(`ciudad_destino ILIKE $${params.length}`);
    }
    if (costoDestino) {
      params.push(costoDestino);
      conditions.push(`costo_destino = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRes = await query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM dispatches ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.total || "0", 10);

    const dataParams = [...params, pageSize, offset];
    const dataRes = await query(
      `SELECT * FROM dispatches
       ${whereClause}
       ORDER BY COALESCE(fecha_envio, fecha_solicitud) DESC NULLS LAST, id DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    return NextResponse.json({
      data: dataRes.rows,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err) {
    console.error("GET /api/dispatches error:", err);
    return NextResponse.json(
      { error: "Error consultando los despachos." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const categoria = String(body.categoria || "SIMCARD_ST").trim().toUpperCase();
    const today = new Date().toISOString().slice(0, 10);

    const { rows } = await query(
      `INSERT INTO dispatches (
        categoria, solicitado_por, fecha_solicitud, fecha_envio,
        proceso_especial, referencia_envio, factura, descripcion_contenido,
        serial, razon_social, destinatario, persona_contacto,
        cedula_identidad, telefono_contacto, ciudad_destino, sede_zoom,
        costo_destino, numero_guia, estatus_zoom, observacion
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, $16,
        $17, $18, $19, $20
      ) RETURNING *`,
      [
        categoria,
        body.solicitado_por || user?.full_name || null,
        body.fecha_solicitud || today,
        body.fecha_envio || today,
        body.proceso_especial || null,
        body.referencia_envio || null,
        body.factura || null,
        body.descripcion_contenido || null,
        body.serial ? String(body.serial).trim().toUpperCase() : null,
        body.razon_social || body.destinatario || null,
        body.destinatario || body.razon_social || null,
        body.persona_contacto || null,
        body.cedula_identidad || null,
        body.telefono_contacto || null,
        body.ciudad_destino ? String(body.ciudad_destino).trim().toUpperCase() : null,
        body.sede_zoom || null,
        body.costo_destino || "COBRO VATC",
        body.numero_guia ? String(body.numero_guia).trim().toUpperCase() : null,
        body.estatus_zoom || "EN TRANSITO",
        body.observacion || null,
      ]
    );

    const created = rows[0];

    await query(
      `INSERT INTO activity_logs (entity_type, entity_id, reference, user_email, user_name, department, action, summary)
       VALUES ('DISPATCH', $1, $2, $3, $4, 'DESPACHO', 'CREAR', $5)`,
      [
        created.id,
        created.numero_guia || created.serial || String(created.id),
        user?.email || "sistema@vatc.com",
        user?.full_name || "Operador",
        `Nuevo despacho (${categoria}) registrado: Guía ${created.numero_guia || "S/G"} — ${created.destinatario || "Sin destinatario"}`,
      ]
    );

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    console.error("POST /api/dispatches error:", err);
    return NextResponse.json(
      { error: "Error al registrar el despacho." },
      { status: 500 }
    );
  }
}
