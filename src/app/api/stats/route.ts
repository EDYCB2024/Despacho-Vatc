import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const [
      dispTotalsRes,
      recTotalsRes,
      dirTotalsRes,
      byCatRes,
      byEstatusZoomRes,
      byCiudadRes,
      byRecModeloRes,
      byRecEstatusRes,
      byPosBancoRes,
      byPosProcRes,
      byPosPlanRes,
      activityRes,
    ] = await Promise.all([
      query<{
        total_dispatches: string;
        simcard_st: string;
        kit: string;
        equipos_nuevos: string;
        entregados: string;
        en_transito: string;
        disponible_retiro: string;
        incidencias: string;
      }>(`
        SELECT
          COUNT(*)::text AS total_dispatches,
          COUNT(*) FILTER (WHERE categoria = 'SIMCARD_ST')::text AS simcard_st,
          COUNT(*) FILTER (WHERE categoria = 'KIT')::text AS kit,
          COUNT(*) FILTER (WHERE categoria = 'EQUIPOS_NUEVOS')::text AS equipos_nuevos,
          COUNT(*) FILTER (WHERE estatus_zoom ILIKE '%ENTREGADO%')::text AS entregados,
          COUNT(*) FILTER (WHERE estatus_zoom ILIKE '%TRANSITO%')::text AS en_transito,
          COUNT(*) FILTER (WHERE estatus_zoom ILIKE '%DISPONIBLE%')::text AS disponible_retiro,
          COUNT(*) FILTER (WHERE estatus_zoom ILIKE '%DEVOL%' OR estatus_zoom ILIKE '%NO PASO%' OR estatus_zoom ILIKE '%RETORNADO%')::text AS incidencias
        FROM dispatches
      `),
      query<{ c: string }>("SELECT COUNT(*)::text AS c FROM dispatch_receptions"),
      query<{ c: string }>("SELECT COUNT(*)::text AS c FROM pos_directory"),
      query<{ name: string; value: number }>(`
        SELECT categoria AS name, COUNT(*)::int AS value
        FROM dispatches GROUP BY 1 ORDER BY value DESC
      `),
      query<{ name: string; value: number }>(`
        SELECT COALESCE(NULLIF(TRIM(estatus_zoom), ''), 'SIN ESTATUS') AS name, COUNT(*)::int AS value
        FROM dispatches GROUP BY 1 ORDER BY value DESC LIMIT 10
      `),
      query<{ name: string; value: number }>(`
        SELECT COALESCE(NULLIF(TRIM(ciudad_destino), ''), 'SIN CIUDAD') AS name, COUNT(*)::int AS value
        FROM dispatches
        WHERE ciudad_destino IS NOT NULL AND TRIM(ciudad_destino) <> ''
        GROUP BY 1 ORDER BY value DESC LIMIT 12
      `),
      query<{ name: string; value: number }>(`
        SELECT COALESCE(NULLIF(TRIM(modelo), ''), 'SIN MODELO') AS name, COUNT(*)::int AS value
        FROM dispatch_receptions
        WHERE modelo IS NOT NULL AND TRIM(modelo) <> ''
        GROUP BY 1 ORDER BY value DESC LIMIT 10
      `),
      query<{ name: string; value: number }>(`
        SELECT COALESCE(NULLIF(TRIM(estatus), ''), 'SIN ESTATUS') AS name, COUNT(*)::int AS value
        FROM dispatch_receptions GROUP BY 1 ORDER BY value DESC
      `),
      query<{ name: string; value: number }>(`
        SELECT COALESCE(NULLIF(TRIM(banco), ''), 'SIN BANCO') AS name, COUNT(*)::int AS value
        FROM pos_directory GROUP BY 1 ORDER BY value DESC LIMIT 12
      `),
      query<{ name: string; value: number }>(`
        SELECT COALESCE(NULLIF(TRIM(procesadora), ''), 'SIN PROCESADORA') AS name, COUNT(*)::int AS value
        FROM pos_directory GROUP BY 1 ORDER BY value DESC
      `),
      query<{ name: string; value: number }>(`
        SELECT COALESCE(NULLIF(TRIM(plan), ''), 'SIN PLAN') AS name, COUNT(*)::int AS value
        FROM pos_directory GROUP BY 1 ORDER BY value DESC LIMIT 10
      `),
      query("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 12"),
    ]);

    const d = dispTotalsRes.rows[0];

    return NextResponse.json({
      totals: {
        totalDispatches: parseInt(d?.total_dispatches || "0", 10),
        simcardStCount: parseInt(d?.simcard_st || "0", 10),
        kitCount: parseInt(d?.kit || "0", 10),
        equiposNuevosCount: parseInt(d?.equipos_nuevos || "0", 10),
        entregadosCount: parseInt(d?.entregados || "0", 10),
        enTransitoCount: parseInt(d?.en_transito || "0", 10),
        disponibleRetiroCount: parseInt(d?.disponible_retiro || "0", 10),
        incidenciasCount: parseInt(d?.incidencias || "0", 10),
        totalReceptions: parseInt(recTotalsRes.rows[0]?.c || "0", 10),
        totalPosDirectory: parseInt(dirTotalsRes.rows[0]?.c || "0", 10),
      },
      byCategoria: byCatRes.rows,
      byEstatusZoom: byEstatusZoomRes.rows,
      byCiudadDestino: byCiudadRes.rows,
      byRecepcionModelo: byRecModeloRes.rows,
      byRecepcionEstatus: byRecEstatusRes.rows,
      byPosBanco: byPosBancoRes.rows,
      byPosProcesadora: byPosProcRes.rows,
      byPosPlan: byPosPlanRes.rows,
      recentActivity: activityRes.rows,
    });
  } catch (err) {
    console.error("GET /api/stats error:", err);
    return NextResponse.json(
      { error: "Error obteniendo métricas del dashboard." },
      { status: 500 }
    );
  }
}
