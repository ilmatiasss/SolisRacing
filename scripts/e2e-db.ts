/**
 * Prepara una base de datos LIMPIA para las pruebas end-to-end:
 * la crea si no existe, borra todo su contenido, aplica migraciones y carga el catálogo de ejemplo.
 * Por seguridad, solo funciona si el nombre de la base de datos contiene "test".
 */
import { loadEnvConfig } from "@next/env";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";
import { Client } from "pg";
import { closeDatabase, getDb } from "../src/lib/db";
import { ensureAdminUser, seedDemoData } from "../src/lib/db/seed";

loadEnvConfig(process.cwd());

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL");
  const target = new URL(url);
  const database = target.pathname.slice(1);
  if (!database.includes("test")) {
    throw new Error(`Por seguridad, las pruebas e2e solo usan bases de datos con "test" en el nombre (recibido: ${database}).`);
  }

  const maintenance = new URL(url);
  maintenance.pathname = "/postgres";
  const admin = new Client({ connectionString: maintenance.toString() });
  await admin.connect();
  const exists = await admin.query("select 1 from pg_database where datname = $1", [database]);
  if (exists.rowCount === 0) await admin.query(`create database "${database.replace(/"/g, "")}"`);
  await admin.end();

  const client = new Client({ connectionString: url });
  await client.connect();
  await client.query("drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;");
  await client.end();

  await migrate(getDb(), { migrationsFolder: path.join(process.cwd(), "drizzle") });
  await ensureAdminUser(getDb(), {
    email: process.env.ADMIN_EMAIL ?? "admin@example.com",
    password: process.env.ADMIN_PASSWORD ?? "clave-de-prueba",
  });
  await seedDemoData(getDb());
  console.log(`✓ Base de datos de pruebas lista: ${database}`);
}

main()
  .catch((error: unknown) => {
    console.error("✗", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => closeDatabase());
