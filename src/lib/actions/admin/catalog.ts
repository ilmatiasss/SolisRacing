"use server";

import { and, eq, inArray, ne } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/data/catalog";
import { db } from "@/lib/db";
import { brands, categories, productFitments, products, vehicleMakes, vehicleModels } from "@/lib/db/schema";
import { rebuildProductSearchText } from "@/lib/db/search-text";
import { slugify } from "@/lib/text";

export type SimpleFormState = { ok?: boolean; error?: string; message?: string };

const nameSchema = z.string().trim().min(1, { error: "Ingresa un nombre" }).max(100);
const idSchema = z.coerce.number().int().positive().optional().catch(undefined);

async function productIdsWhere(condition: ReturnType<typeof eq>) {
  const rows = await db.select({ id: products.id }).from(products).where(condition);
  return rows.map((row) => row.id);
}

/* -------------------------------- Categorías ------------------------------ */

export async function saveCategory(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdmin();
  const parsed = z
    .object({
      id: idSchema,
      name: nameSchema,
      description: z.string().trim().max(300).optional().transform((v) => v || null),
      icon: z.string().trim().max(40).default("wrench"),
      sortOrder: z.coerce.number().int().min(0).max(9999).catch(0),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const { id, ...data } = parsed.data;
  const slug = slugify(data.name);
  const [conflict] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(id ? and(eq(categories.slug, slug), ne(categories.id, id)) : eq(categories.slug, slug));
  if (conflict) return { error: "Ya existe una categoría con ese nombre." };

  if (id) {
    await db.update(categories).set({ ...data, slug }).where(eq(categories.id, id));
    await rebuildProductSearchText(db, await productIdsWhere(eq(products.categoryId, id)));
  } else {
    await db.insert(categories).values({ ...data, slug });
  }
  updateTag(CATALOG_TAG);
  return { ok: true, message: id ? "Categoría actualizada." : "Categoría creada." };
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  const affected = await productIdsWhere(eq(products.categoryId, id));
  await db.delete(categories).where(eq(categories.id, id));
  await rebuildProductSearchText(db, affected);
  updateTag(CATALOG_TAG);
}

/* ---------------------------------- Marcas -------------------------------- */

export async function saveBrand(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdmin();
  const parsed = z.object({ id: idSchema, name: nameSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const { id, name } = parsed.data;
  const slug = slugify(name);
  const [conflict] = await db
    .select({ id: brands.id })
    .from(brands)
    .where(id ? and(eq(brands.slug, slug), ne(brands.id, id)) : eq(brands.slug, slug));
  if (conflict) return { error: "Ya existe una marca con ese nombre." };

  if (id) {
    await db.update(brands).set({ name, slug }).where(eq(brands.id, id));
    await rebuildProductSearchText(db, await productIdsWhere(eq(products.brandId, id)));
  } else {
    await db.insert(brands).values({ name, slug });
  }
  updateTag(CATALOG_TAG);
  return { ok: true, message: id ? "Marca actualizada." : "Marca creada." };
}

export async function deleteBrand(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  const affected = await productIdsWhere(eq(products.brandId, id));
  await db.delete(brands).where(eq(brands.id, id));
  await rebuildProductSearchText(db, affected);
  updateTag(CATALOG_TAG);
}

/* --------------------------- Marcas y modelos de autos --------------------------- */

async function productIdsForModels(modelIds: number[]) {
  if (!modelIds.length) return [];
  const rows = await db
    .selectDistinct({ id: productFitments.productId })
    .from(productFitments)
    .where(inArray(productFitments.modelId, modelIds));
  return rows.map((row) => row.id);
}

export async function saveMake(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdmin();
  const parsed = z.object({ id: idSchema, name: nameSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const { id, name } = parsed.data;
  const slug = slugify(name);
  const [conflict] = await db
    .select({ id: vehicleMakes.id })
    .from(vehicleMakes)
    .where(id ? and(eq(vehicleMakes.slug, slug), ne(vehicleMakes.id, id)) : eq(vehicleMakes.slug, slug));
  if (conflict) return { error: "Esa marca de auto ya existe." };
  if (id) {
    await db.update(vehicleMakes).set({ name, slug }).where(eq(vehicleMakes.id, id));
    const models = await db.select({ id: vehicleModels.id }).from(vehicleModels).where(eq(vehicleModels.makeId, id));
    await rebuildProductSearchText(db, await productIdsForModels(models.map((model) => model.id)));
  } else {
    await db.insert(vehicleMakes).values({ name, slug });
  }
  updateTag(CATALOG_TAG);
  return { ok: true, message: id ? "Marca de auto actualizada." : "Marca de auto creada." };
}

export async function deleteMake(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  const models = await db.select({ id: vehicleModels.id }).from(vehicleModels).where(eq(vehicleModels.makeId, id));
  const affected = await productIdsForModels(models.map((model) => model.id));
  await db.delete(vehicleMakes).where(eq(vehicleMakes.id, id));
  await rebuildProductSearchText(db, affected);
  updateTag(CATALOG_TAG);
}

export async function saveModel(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdmin();
  const parsed = z
    .object({ id: idSchema, makeId: z.coerce.number().int().positive(), name: nameSchema })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const { id, makeId, name } = parsed.data;
  const slug = slugify(name);
  const [conflict] = await db
    .select({ id: vehicleModels.id })
    .from(vehicleModels)
    .where(
      id
        ? and(eq(vehicleModels.makeId, makeId), eq(vehicleModels.slug, slug), ne(vehicleModels.id, id))
        : and(eq(vehicleModels.makeId, makeId), eq(vehicleModels.slug, slug)),
    );
  if (conflict) return { error: "Ese modelo ya existe para esta marca." };
  if (id) {
    await db.update(vehicleModels).set({ name, slug }).where(eq(vehicleModels.id, id));
    await rebuildProductSearchText(db, await productIdsForModels([id]));
  } else {
    await db.insert(vehicleModels).values({ makeId, name, slug });
  }
  updateTag(CATALOG_TAG);
  return { ok: true, message: id ? "Modelo actualizado." : "Modelo agregado." };
}

export async function deleteModel(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  const affected = await productIdsForModels([id]);
  await db.delete(vehicleModels).where(eq(vehicleModels.id, id));
  await rebuildProductSearchText(db, affected);
  updateTag(CATALOG_TAG);
}
