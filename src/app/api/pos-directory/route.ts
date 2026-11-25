import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const exactSerial = (searchParams.get("serial") || "").trim();
    const banco = (searchParams.get("banco") || "").trim();
    const procesadora = (searchParams.get("procesadora") || "").trim();
    const estatus = (searchParams.get("estatus") || "").trim();
    const exportAll = searchParams.get("export") === "1";

    if (exactSerial) {
      const { rows } = await query(
        "SELECT * FROM pos_directory WHERE UPPER(serial) = $1 LIMIT 1",
        [exactSerial.toUpperCase()]
      );
      return NextResponse.json({ data: rows[0] || null });
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const pageSize = exportAll
      ? 5000
      : Math.min(200, Math.max(10, parseInt(searchParams.get("pageSize") || "50", 10) || 50));
    const offset = exportAll ? 0 : (page - 1) * pageSize;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      conditions.push(
        `(serial ILIKE $${idx} OR rif_cliente ILIKE $${idx} OR razon_social ILIKE $${idx} OR banco ILIKE $${idx} OR plan ILIKE $${idx})`
      );
    }
    if (banco) {
      params.push(banco);
      conditions.push(`banco = $${params.length}`);
    }
    if (procesadora) {
      params.push(procesadora);
      conditions.push(`procesadora = $${params.length}`);
    }
    if (estatus) {
      params.push(estatus);
      conditions.push(`estatus = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRes = await query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM pos_directory ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.total || "0", 10);

    const dataParams = [...params, pageSize, offset];
    const dataRes = await query(
      `SELECT * FROM pos_directory
       ${whereClause}
       ORDER BY id ASC
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
    console.error("GET /api/pos-directory error:", err);
    return NextResponse.json(
      { error: "Error consultando directorio BDDIC25." },
      { status: 500 }
    );
  }
}
