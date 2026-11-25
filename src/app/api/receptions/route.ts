import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const modelo = (searchParams.get("modelo") || "").trim();
    const estatus = (searchParams.get("estatus") || "").trim();
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
        `(serial ILIKE $${idx} OR numero_guia ILIKE $${idx} OR razon_social ILIKE $${idx} OR modelo ILIKE $${idx} OR observacion ILIKE $${idx})`
      );
    }
    if (modelo) {
      params.push(modelo);
      conditions.push(`modelo = $${params.length}`);
    }
    if (estatus) {
      params.push(estatus);
      conditions.push(`estatus = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRes = await query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM dispatch_receptions ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.total || "0", 10);

    const dataParams = [...params, pageSize, offset];
    const dataRes = await query(
      `SELECT * FROM dispatch_receptions
       ${whereClause}
       ORDER BY fecha_recepcion DESC NULLS LAST, id DESC
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
    console.error("GET /api/receptions error:", err);
    return NextResponse.json(
      { error: "Error consultando recepciones en despacho." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const today = new Date().toISOString().slice(0, 10);

    const { rows } = await query(
      `INSERT INTO dispatch_receptions (
        fecha_recepcion, numero_guia, cantidad_equipos, modelo, serial, razon_social,
        caja, cargador, bateria, simcard, rollo, forro, estatus, observacion
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13, $14
      ) RETURNING *`,
      [
        body.fecha_recepcion || today,
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
      ]
    );

    const created = rows[0];

    await query(
      `INSERT INTO activity_logs (entity_type, entity_id, reference, user_email, user_name, department, action, summary)
       VALUES ('RECEPTION', $1, $2, $3, $4, 'RECEPCION', 'CREAR', $5)`,
      [
        created.id,
        created.serial || created.numero_guia || String(created.id),
        user?.email || "sistema@vatc.com",
        user?.full_name || "Operador",
        `Recepción en despacho registrada: Serial ${created.serial || "S/S"} (${created.modelo || "POS"}) — Guía ${created.numero_guia || "S/G"}`,
      ]
    );

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    console.error("POST /api/receptions error:", err);
    return NextResponse.json(
      { error: "Error registrando recepción en despacho." },
      { status: 500 }
    );
  }
}
