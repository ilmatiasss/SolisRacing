/**
 * Prepara una base de datos LIMPIA para las pruebas end-to-end:
 * la crea si no existe, borra todo su contenido, aplica migraciones y carga el catálogo de ejemplo.
 * Por seguridad, solo funciona si el nombre de la base de datos contiene "test".
 */
import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";
import { Client } from "pg";
import { closeDatabase, getDb, type Database } from "../src/lib/db";
import { categories, productFitments, products, vehicleModels } from "../src/lib/db/schema";
import { rebuildProductSearchText } from "../src/lib/db/search-text";
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
  await addTestFixtures(getDb());
  console.log(`✓ Base de datos de pruebas lista: ${database}`);
}

/** Datos solo para las pruebas: el catálogo inicial no trae piezas con compatibilidad por auto. */
async function addTestFixtures(db: Database) {
  // Una sola unidad para comprobar que un pago fallido devuelve el stock.
  await db.update(products).set({ stock: 1 }).where(eq(products.slug, "fueltech-ft550"));

  const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, "varios"));
  const models = await db.select({ id: vehicleModels.id, slug: vehicleModels.slug }).from(vehicleModels);
  const modelId = (slug: string) => {
    const model = models.find((row) => row.slug === slug);
    if (!model) throw new Error(`Falta el modelo ${slug} en los datos iniciales`);
    return model.id;
  };
  const fixtures = [
    { name: "Pieza de prueba para Honda Civic", model: "civic", yearFrom: 1992, yearTo: 2000 },
    { name: "Pieza de prueba para Lancer Evolution", model: "lancer-evolution", yearFrom: 1996, yearTo: 2007 },
  ];
  for (const [index, fixture] of fixtures.entries()) {
    const [product] = await db
      .insert(products)
      .values({
        name: fixture.name,
        slug: `pieza-de-prueba-${index + 1}`,
        categoryId: category?.id ?? null,
        price: 10000,
        stock: 5,
        status: "active",
      })
      .returning({ id: products.id });
    await db.insert(productFitments).values({
      productId: product.id,
      modelId: modelId(fixture.model),
      yearFrom: fixture.yearFrom,
      yearTo: fixture.yearTo,
    });
  }
  await rebuildProductSearchText(db);
}

main()
  .catch((error: unknown) => {
    console.error("✗", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => closeDatabase());
