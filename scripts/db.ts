/**
 * Tareas de base de datos:
 *   npm run db:migrate  → aplica las migraciones pendientes
 *   npm run db:seed     → carga el catálogo inicial si no hay productos
 *   npm run db:setup    → migraciones + usuario administrador + catálogo inicial (una sola vez, con la
 *                         base de datos vacía; SEED_DEMO_DATA=false lo desactiva)
 *
 * `db:setup` se ejecuta antes de compilar (script `build`), así cada deploy de Vercel deja la base
 * de datos lista: el prerender de las páginas ya consulta las tablas.
 */
import { loadEnvConfig } from "@next/env";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";
import { closeDatabase, getDb } from "../src/lib/db";
import { databaseEnvNames, databaseUrl } from "../src/lib/db/url";
import {
  countProducts,
  ensureAdminUser,
  initialCatalogLoaded,
  markInitialCatalogLoaded,
  seedDemoData,
} from "../src/lib/db/seed";

loadEnvConfig(process.cwd());

async function runMigrations() {
  if (!databaseUrl()) {
    const found = databaseEnvNames();
    throw new Error(
      [
        "No hay base de datos conectada (falta DATABASE_URL).",
        process.env.VERCEL
          ? "En Vercel: Storage → Create Database → Neon → conéctala a este proyecto (Production, Preview y Development) y luego Deployments → ⋯ → Redeploy."
          : "Copia .env.example a .env y configura DATABASE_URL (ver README).",
        found.length ? `Variables de base de datos encontradas: ${found.join(", ")}.` : "",
      ]
        .filter(Boolean)
        .join("\n  "),
    );
  }
  console.log("› Aplicando migraciones…");
  await migrate(getDb(), { migrationsFolder: path.join(process.cwd(), "drizzle") });
  console.log("✓ Migraciones al día");
}

async function runAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("! ADMIN_EMAIL / ADMIN_PASSWORD no están definidas: no se creó el usuario administrador.");
    return;
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD debe tener al menos 8 caracteres.");
  }
  const result = await ensureAdminUser(getDb(), { email, password });
  console.log(result === "created" ? `✓ Administrador creado: ${email}` : "✓ Ya existe un administrador");
}

async function runSeed({ automatic }: { automatic: boolean }) {
  const db = getDb();
  if (automatic) {
    // Por defecto se carga; SEED_DEMO_DATA=false permite partir con la tienda vacía.
    if (["false", "0", "no"].includes(process.env.SEED_DEMO_DATA?.trim().toLowerCase() ?? "")) {
      console.log("› SEED_DEMO_DATA=false: se omite el catálogo inicial");
      return;
    }
    if (await initialCatalogLoaded(db)) {
      console.log("› El catálogo inicial ya se cargó antes: no se vuelve a cargar");
      return;
    }
  }
  const total = await countProducts(db);
  if (total > 0) {
    console.log(`› La tienda ya tiene ${total} productos: no se carga el catálogo inicial`);
    await markInitialCatalogLoaded(db);
    return;
  }
  console.log("› Cargando catálogo inicial…");
  await seedDemoData(db);
  await markInitialCatalogLoaded(db);
  console.log("✓ Catálogo inicial cargado");
}

async function main() {
  const command = process.argv[2] ?? "setup";
  if (command === "migrate") {
    await runMigrations();
  } else if (command === "seed") {
    await runSeed({ automatic: false });
  } else if (command === "setup") {
    await runMigrations();
    await runAdmin();
    await runSeed({ automatic: true });
  } else {
    throw new Error(`Comando desconocido: ${command}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error("✗", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => closeDatabase());
