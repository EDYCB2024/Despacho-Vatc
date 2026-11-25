import { Pool, QueryResultRow } from "pg";

declare global {
  var __neonDespachoPool: Pool | undefined;
}

function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está definida en las variables de entorno.");
  }
  if (!global.__neonDespachoPool) {
    global.__neonDespachoPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return global.__neonDespachoPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  const pool = getPool();
  return pool.query<T>(text, params);
}
