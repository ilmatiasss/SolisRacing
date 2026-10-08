import { attachDatabasePool } from "@vercel/functions";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { databaseUrl } from "./url";

export type Database = NodePgDatabase<typeof schema>;

type DbGlobal = { __solisDb?: { pool: Pool; db: Database } };
const globalForDb = globalThis as unknown as DbGlobal;

function createDatabase() {
  const connectionString = databaseUrl();
  if (!connectionString) {
    throw new Error(
      process.env.VERCEL
        ? "Falta conectar la base de datos: en Vercel, ve a Storage → Create Database → Neon, conéctala a este proyecto y vuelve a desplegar (Deployments → Redeploy)."
        : "Falta la variable de entorno DATABASE_URL. Copia .env.example a .env y configura la conexión a PostgreSQL (ver README).",
    );
  }
  const pool = new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    idleTimeoutMillis: 5_000,
  });
  // En Vercel (Fluid compute) libera las conexiones inactivas antes de suspender la función.
  attachDatabasePool(pool);
  const db = drizzle({ client: pool, schema, casing: "snake_case" });
  return { pool, db };
}

function getDatabase() {
  // Se guarda en globalThis para reutilizar el pool entre recargas en desarrollo
  // y entre invocaciones de una misma instancia en producción.
  globalForDb.__solisDb ??= createDatabase();
  return globalForDb.__solisDb;
}

/**
 * Cliente de Drizzle. La conexión se crea recién en la primera consulta, así importar
 * este módulo nunca falla aunque DATABASE_URL no esté definida (por ejemplo, en `lint`).
 */
export const db = new Proxy({} as Database, {
  get(_target, property) {
    const instance = getDatabase().db;
    const value = Reflect.get(instance, property, instance);
    if (typeof value !== "function" || property === "constructor" || typeof property === "symbol") {
      return value;
    }
    return value.bind(instance);
  },
});

/** Instancia real de Drizzle (para APIs que no aceptan el proxy, como el migrador). */
export function getDb(): Database {
  return getDatabase().db;
}

export async function closeDatabase() {
  const current = globalForDb.__solisDb;
  if (current) {
    globalForDb.__solisDb = undefined;
    await current.pool.end();
  }
}

export { schema };
