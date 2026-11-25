import fs from "fs";
import path from "path";
import XLSX from "xlsx";
import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) {
        const key = m[1].trim();
        const val = m[2].trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

const excelPath =
  process.argv[2] ||
  "C:\\Users\\ecastillo\\.gemini\\antigravity\\brain\\0f353e04-aebb-4812-89c7-528ae3740955\\scratch\\despacho_vatc.xlsx";

function cleanStr(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/\r?\n/g, " ").trim();
  if (!s || s === "-" || s === "—") return null;
  return s;
}

function cleanDate(v) {
  if (!v) return null;
  if (v instanceof Date && !isNaN(v.getTime())) {
    const y = v.getUTCFullYear();
    if (y < 1990 || y > 2100) return null;
    return v.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmy) {
    let [, d, m, y] = dmy;
    if (y.length === 2) y = "20" + y;
    const di = parseInt(d, 10);
    const mi = parseInt(m, 10);
    const yi = parseInt(y, 10);
    if (mi >= 1 && mi <= 12 && di >= 1 && di <= 31 && yi >= 1990 && yi <= 2100) {
      return `${yi}-${String(mi).padStart(2, "0")}-${String(di).padStart(2, "0")}`;
    }
  }
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getUTCFullYear();
    if (y >= 1990 && y <= 2100) return parsed.toISOString().slice(0, 10);
  }
  return null;
}

function cleanInt(v, fallback = 1) {
  if (v === null || v === undefined || v === "") return fallback;
  const n = parseInt(String(v).replace(/[^0-9\-]/g, ""), 10);
  return isNaN(n) ? fallback : n;
}

function normalizeZoomStatus(v) {
  const s = cleanStr(v);
  if (!s) return "PENDIENTE";
  const u = s.toUpperCase();
  if (u === "ESTATUS ZOOM") return null;
  if (u.includes("DISPONOBLE") || u.includes("DISPONIBLE")) return "DISPONIBLE PARA RETIRO";
  if (u.includes("NO PASO A RETIR") || u.includes("NO RETIRO")) return "NO PASO A RETIRAR";
  if (u.includes("DEVOL")) return "DEVOLUCION";
  if (u.includes("RETORNADO")) return "RETORNADO AL ALMACEN";
  if (u.includes("TRANSITO") || u.includes("TRÁNSITO")) return "EN TRANSITO";
  if (u.includes("ENTREGADO")) return "ENTREGADO";
  if (u.includes("ELIMINADA")) return "GUIA ELIMINADA";
  return u;
}

function normalizeCostoDestino(v) {
  const s = cleanStr(v);
  if (!s) return null;
  const u = s.toUpperCase();
  if (u === "COSTO DESTINO") return null;
  if (u.includes("DESTINO")) return "COBRO A DESTINO";
  if (u.includes("VAT") || u.includes("VACT")) return "COBRO VATC";
  return u;
}

async function batchInsert(client, tableName, cols, rows, batchSize = 500) {
  let total = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values = [];
    const placeholders = batch.map((row, rIdx) => {
      const base = rIdx * cols.length;
      values.push(...row);
      return `(${cols.map((_, cIdx) => `$${base + cIdx + 1}`).join(",")})`;
    });
    const sql = `INSERT INTO ${tableName} (${cols.join(",")}) VALUES ${placeholders.join(",")}`;
    await client.query(sql, values);
    total += batch.length;
  }
  return total;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no configurado");
  }
  if (!fs.existsSync(excelPath)) {
    throw new Error(`No se encontró el archivo Excel en: ${excelPath}`);
  }

  console.log("Leyendo archivo Excel:", excelPath);
  const wb = XLSX.readFile(excelPath, { cellDates: true });

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Create schema tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        alias TEXT,
        role TEXT NOT NULL DEFAULT 'editor',
        department TEXT NOT NULL DEFAULT 'DESPACHO',
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS dispatches (
        id SERIAL PRIMARY KEY,
        categoria TEXT NOT NULL, -- 'SIMCARD_ST', 'KIT', 'EQUIPOS_NUEVOS'
        solicitado_por TEXT,
        fecha_solicitud DATE,
        fecha_envio DATE,
        proceso_especial TEXT,
        referencia_envio TEXT,
        factura TEXT,
        descripcion_contenido TEXT,
        serial TEXT,
        razon_social TEXT,
        destinatario TEXT,
        persona_contacto TEXT,
        cedula_identidad TEXT,
        telefono_contacto TEXT,
        ciudad_destino TEXT,
        sede_zoom TEXT,
        costo_destino TEXT,
        numero_guia TEXT,
        estatus_zoom TEXT DEFAULT 'EN TRANSITO',
        observacion TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_dispatches_categoria ON dispatches(categoria);
      CREATE INDEX IF NOT EXISTS idx_dispatches_serial ON dispatches(serial);
      CREATE INDEX IF NOT EXISTS idx_dispatches_guia ON dispatches(numero_guia);
      CREATE INDEX IF NOT EXISTS idx_dispatches_estatus ON dispatches(estatus_zoom);
      CREATE INDEX IF NOT EXISTS idx_dispatches_ciudad ON dispatches(ciudad_destino);

      CREATE TABLE IF NOT EXISTS dispatch_receptions (
        id SERIAL PRIMARY KEY,
        fecha_recepcion DATE,
        numero_guia TEXT,
        cantidad_equipos INT NOT NULL DEFAULT 1,
        modelo TEXT,
        serial TEXT,
        razon_social TEXT,
        caja TEXT DEFAULT 'NO',
        cargador TEXT DEFAULT 'NO',
        bateria TEXT DEFAULT 'NO',
        simcard TEXT DEFAULT 'NO',
        rollo TEXT DEFAULT 'NO',
        forro TEXT DEFAULT 'NO',
        estatus TEXT DEFAULT 'ENTREGADO A ST',
        observacion TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_receptions_serial ON dispatch_receptions(serial);
      CREATE INDEX IF NOT EXISTS idx_receptions_guia ON dispatch_receptions(numero_guia);
      CREATE INDEX IF NOT EXISTS idx_receptions_estatus ON dispatch_receptions(estatus);

      CREATE TABLE IF NOT EXISTS pos_directory (
        id SERIAL PRIMARY KEY,
        serial TEXT NOT NULL,
        rif_cliente TEXT,
        razon_social TEXT,
        banco TEXT,
        procesadora TEXT,
        fecha DATE,
        plan TEXT,
        estatus TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_pos_dir_serial ON pos_directory(serial);
      CREATE INDEX IF NOT EXISTS idx_pos_dir_rif ON pos_directory(rif_cliente);
      CREATE INDEX IF NOT EXISTS idx_pos_dir_banco ON pos_directory(banco);
      CREATE INDEX IF NOT EXISTS idx_pos_dir_estatus ON pos_directory(estatus);

      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        entity_type TEXT,
        entity_id INT,
        reference TEXT,
        user_email TEXT,
        user_name TEXT,
        department TEXT NOT NULL DEFAULT 'DESPACHO',
        action TEXT NOT NULL,
        summary TEXT NOT NULL,
        details JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log("Tablas creadas / verificadas en Neon.");

    // 2. Seed users
    const passHash = await bcrypt.hash("Admin2026!", 10);
    await client.query(
      `INSERT INTO users (email, password_hash, full_name, alias, role, department, status)
       VALUES
         ($1, $2, 'Administrador Despacho VATC', 'ADMIN', 'admin', 'DESPACHO', 'active'),
         ($3, $2, 'Eduardo Castillo', 'EDUARDO', 'admin', 'GENERAL', 'active')
       ON CONFLICT (email) DO NOTHING`,
      ["admin@vatc.com", passHash, "edcastilloblanco@gmail.com"]
    );
    console.log("Usuarios iniciales configurados.");

    // 3. Seed dispatches (3 sheets)
    const { rows: dispCount } = await client.query("SELECT COUNT(*)::int AS c FROM dispatches");
    let insertedDispatches = 0;
    if (dispCount[0].c === 0) {
      const dispatchRows = [];

      // Sheet 1: SIMCARD SERVICIO TECNICO TRASLA
      const s1 = XLSX.utils.sheet_to_json(wb.Sheets["SIMCARD SERVICIO TECNICO TRASLA"], { header: 1, defval: "" });
      for (let i = 2; i < s1.length; i++) {
        const r = s1[i] || [];
        const solicitadoPor = cleanStr(r[1]);
        if (solicitadoPor && solicitadoPor.toUpperCase() === "SOLICITADO POR") continue;
        const fechaSol = cleanDate(r[2]);
        const refEnvio = cleanStr(r[3]);
        const descCont = cleanStr(r[4]);
        const serial = cleanStr(r[5]);
        const dest = cleanStr(r[6]);
        const contacto = cleanStr(r[7]);
        const ciudad = cleanStr(r[8]);
        const sedeZoom = cleanStr(r[9]);
        const fechaEnv = cleanDate(r[10]) || fechaSol;
        const cedula = cleanStr(r[11]);
        const telefono = cleanStr(r[12]);
        const costoDest = normalizeCostoDestino(r[13]);
        const guia = cleanStr(r[14]);
        const estatusZoom = normalizeZoomStatus(r[15]);
        const obs = cleanStr(r[16]);

        if (!dest && !serial && !guia && !descCont && !refEnvio) continue;

        dispatchRows.push([
          "SIMCARD_ST",
          solicitadoPor,
          fechaSol,
          fechaEnv,
          null,
          refEnvio,
          null,
          descCont,
          serial,
          dest,
          dest,
          contacto,
          cedula,
          telefono,
          ciudad ? ciudad.toUpperCase() : null,
          sedeZoom,
          costoDest,
          guia,
          estatusZoom || "ENTREGADO",
          obs,
        ]);
      }

      // Sheet 2: DESPACHO - KIT
      const s2 = XLSX.utils.sheet_to_json(wb.Sheets["DESPACHO - KIT"], { header: 1, defval: "" });
      for (let i = 5; i < s2.length; i++) {
        const r = s2[i] || [];
        const solicitadoPor = cleanStr(r[1]);
        if (solicitadoPor && solicitadoPor.toUpperCase() === "SOLICITADO POR") continue;
        const fechaEnv = cleanDate(r[2]);
        const refEnvio = cleanStr(r[3]);
        const descCont = cleanStr(r[4]);
        const serial = cleanStr(r[5]);
        const dest = cleanStr(r[6]);
        const contacto = cleanStr(r[7]);
        const ciudad = cleanStr(r[8]);
        const cedula = cleanStr(r[9]);
        const telefono = cleanStr(r[10]);
        const guia = cleanStr(r[11]);
        const estatusZoom = normalizeZoomStatus(r[12]);
        const obs = cleanStr(r[13]);

        if (!dest && !serial && !guia && !descCont && !refEnvio) continue;

        dispatchRows.push([
          "KIT",
          solicitadoPor,
          fechaEnv,
          fechaEnv,
          null,
          refEnvio,
          null,
          descCont,
          serial,
          dest,
          dest,
          contacto,
          cedula,
          telefono,
          ciudad ? ciudad.toUpperCase() : null,
          null,
          "COBRO VATC",
          guia,
          estatusZoom || "ENTREGADO",
          obs,
        ]);
      }

      // Sheet 3: DESPACHO - EQUIPOS NUEVOS
      const s3 = XLSX.utils.sheet_to_json(wb.Sheets["DESPACHO - EQUIPOS NUEVOS"], { header: 1, defval: "" });
      for (let i = 1; i < s3.length; i++) {
        const r = s3[i] || [];
        const rawFirst = cleanStr(r[1]);
        if (rawFirst && rawFirst.toUpperCase() === "FECHA DE ENVIO") continue;
        const fechaEnv = cleanDate(r[1]);
        const procEsp = cleanStr(r[2]);
        const refEnvio = cleanStr(r[3]);
        const factura = cleanStr(r[4]);
        const razonSocial = cleanStr(r[5]);
        const serial = cleanStr(r[6]);
        const dest = cleanStr(r[7]) || razonSocial;
        const contacto = cleanStr(r[8]);
        const ciudad = cleanStr(r[9]);
        const cedula = cleanStr(r[10]);
        const telefono = cleanStr(r[11]);
        const guia = cleanStr(r[12]);
        const estatusZoom = normalizeZoomStatus(r[13]);
        const obs = cleanStr(r[14]);

        if (!razonSocial && !dest && !serial && !guia && !factura) continue;

        dispatchRows.push([
          "EQUIPOS_NUEVOS",
          null,
          fechaEnv,
          fechaEnv,
          procEsp || "PROCESO REGULAR",
          refEnvio,
          factura,
          "EQUIPO NUEVO POS",
          serial,
          razonSocial,
          dest,
          contacto,
          cedula,
          telefono,
          ciudad ? ciudad.toUpperCase() : null,
          null,
          "COBRO VATC",
          guia,
          estatusZoom || "ENTREGADO",
          obs,
        ]);
      }

      const dispCols = [
        "categoria",
        "solicitado_por",
        "fecha_solicitud",
        "fecha_envio",
        "proceso_especial",
        "referencia_envio",
        "factura",
        "descripcion_contenido",
        "serial",
        "razon_social",
        "destinatario",
        "persona_contacto",
        "cedula_identidad",
        "telefono_contacto",
        "ciudad_destino",
        "sede_zoom",
        "costo_destino",
        "numero_guia",
        "estatus_zoom",
        "observacion",
      ];

      insertedDispatches = await batchInsert(client, "dispatches", dispCols, dispatchRows, 400);
      console.log(`Despachos insertados: ${insertedDispatches}`);
    } else {
      console.log(`dispatches ya contiene ${dispCount[0].c} registros.`);
    }

    // 4. Seed dispatch_receptions (Sheet 4: RECEPCION DE EQUIPO)
    const { rows: recCount } = await client.query("SELECT COUNT(*)::int AS c FROM dispatch_receptions");
    let insertedReceptions = 0;
    if (recCount[0].c === 0) {
      const s4 = XLSX.utils.sheet_to_json(wb.Sheets["RECEPCION DE EQUIPO"], { header: 1, defval: "" });
      const recRows = [];

      for (let i = 4; i < s4.length; i++) {
        const r = s4[i] || [];
        const rawFirst = cleanStr(r[0]);
        if (rawFirst && rawFirst.toUpperCase().includes("FECHA")) continue;
        const fechaRec = cleanDate(r[0]);
        const guia = cleanStr(r[1]);
        const cant = cleanInt(r[2], 1);
        const modelo = cleanStr(r[3]);
        const serial = cleanStr(r[4]);
        const razon = cleanStr(r[5]);
        const caja = (cleanStr(r[6]) || "NO").toUpperCase();
        const cargador = (cleanStr(r[7]) || "NO").toUpperCase();
        const bateria = (cleanStr(r[8]) || "NO").toUpperCase();
        const simcard = (cleanStr(r[9]) || "NO").toUpperCase();
        const rollo = (cleanStr(r[10]) || "NO").toUpperCase();
        const forro = (cleanStr(r[11]) || "NO").toUpperCase();
        const estatus = cleanStr(r[12]) || "ENTREGADO A ST";
        const obs = cleanStr(r[13]);

        if (!serial && !guia && !razon && !modelo) continue;
        if (modelo === "MODELO" || estatus === "ESTATUS") continue;

        recRows.push([
          fechaRec,
          guia,
          cant,
          modelo ? modelo.toUpperCase() : null,
          serial ? serial.toUpperCase() : null,
          razon,
          caja === "SI" ? "SI" : "NO",
          cargador === "SI" ? "SI" : "NO",
          bateria === "SI" ? "SI" : "NO",
          simcard === "SI" ? "SI" : "NO",
          rollo === "SI" ? "SI" : "NO",
          forro === "SI" ? "SI" : "NO",
          estatus.toUpperCase(),
          obs,
        ]);
      }

      const recCols = [
        "fecha_recepcion",
        "numero_guia",
        "cantidad_equipos",
        "modelo",
        "serial",
        "razon_social",
        "caja",
        "cargador",
        "bateria",
        "simcard",
        "rollo",
        "forro",
        "estatus",
        "observacion",
      ];

      insertedReceptions = await batchInsert(client, "dispatch_receptions", recCols, recRows, 400);
      console.log(`Recepciones en despacho insertadas: ${insertedReceptions}`);
    } else {
      console.log(`dispatch_receptions ya contiene ${recCount[0].c} registros.`);
    }

    // 5. Seed pos_directory (Sheet 5: BDDIC25)
    const { rows: dirCount } = await client.query("SELECT COUNT(*)::int AS c FROM pos_directory");
    let insertedDir = 0;
    if (dirCount[0].c === 0) {
      const s5 = XLSX.utils.sheet_to_json(wb.Sheets["BDDIC25"], { header: 1, defval: "" });
      const dirRows = [];

      for (let i = 1; i < s5.length; i++) {
        const r = s5[i] || [];
        const serial = cleanStr(r[0]);
        if (!serial || serial.toUpperCase() === "SERIAL") continue;
        const rif = cleanStr(r[1]);
        const razon = cleanStr(r[2]);
        const banco = cleanStr(r[3]);
        const proc = cleanStr(r[4]);
        const fecha = cleanDate(r[5]);
        const plan = cleanStr(r[6]);
        const estatus = cleanStr(r[7]);

        dirRows.push([
          serial.toUpperCase(),
          rif ? rif.toUpperCase() : null,
          razon,
          banco,
          proc ? proc.toUpperCase() : null,
          fecha,
          plan,
          estatus,
        ]);
      }

      const dirCols = [
        "serial",
        "rif_cliente",
        "razon_social",
        "banco",
        "procesadora",
        "fecha",
        "plan",
        "estatus",
      ];

      insertedDir = await batchInsert(client, "pos_directory", dirCols, dirRows, 1000);
      console.log(`Directorio Maestro POS (BDDIC25) insertado: ${insertedDir}`);
    } else {
      console.log(`pos_directory ya contiene ${dirCount[0].c} registros.`);
    }

    if (insertedDispatches > 0 || insertedReceptions > 0 || insertedDir > 0) {
      await client.query(
        `INSERT INTO activity_logs (entity_type, department, action, summary, user_name, user_email, details)
         VALUES ('SISTEMA', 'DESPACHO', 'MIGRACION', $1, 'Sistema', 'admin@vatc.com', $2)`,
        [
          `Importación inicial desde Google Drive: ${insertedDispatches} despachos, ${insertedReceptions} recepciones y ${insertedDir} terminales en BDDIC25.`,
          JSON.stringify({
            dispatches: insertedDispatches,
            receptions: insertedReceptions,
            pos_directory: insertedDir,
          }),
        ]
      );
    }

    await client.query("COMMIT");
    console.log("Migración completada exitosamente en Neon.");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Error en migración:", err);
  process.exit(1);
});
