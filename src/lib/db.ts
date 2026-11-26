import { Pool, QueryResultRow } from "pg";

declare global {
  var __neonDespachoPool: Pool | undefined;
}

function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está definida en las variables de entorno.");
  }
  if (!global.__neonDespachoPool) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 25000,
      keepAlive: true,
    });
    pool.on("error", (err) => {
      console.error("Neon pool idle client error:", err.message);
    });
    global.__neonDespachoPool = pool;
  }
  return global.__neonDespachoPool;
}

function isTransientDbError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const msg = String((err as { message?: string }).message || "").toLowerCase();
  const code = String((err as { code?: string }).code || "").toUpperCase();
  return (
    msg.includes("connection terminated") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("timeout") ||
    msg.includes("closed") ||
    msg.includes("server closed the connection") ||
    code === "ECONNRESET" ||
    code === "57P01" ||
    code === "57P03"
  );
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const pool = getPool();
      return await pool.query<T>(text, params);
    } catch (err) {
      lastError = err;
      if (attempt < 3 && isTransientDbError(err)) {
        try {
          await global.__neonDespachoPool?.end();
        } catch {
          // ignore
        }
        global.__neonDespachoPool = undefined;
        await new Promise((r) => setTimeout(r, 400 * attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
