"use server";

import { and, eq, inArray, ne } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/data/catalog";
import { db } from "@/lib/db";
import { productFitments, productImages, products } from "@/lib/db/schema";
import { rebuildProductSearchText } from "@/lib/db/search-text";
import { parseCLP } from "@/lib/format";
import { deleteStoredImage, storeImage } from "@/lib/storage";
import { slugify } from "@/lib/text";

export type ProductFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
};

const money = (label: string, required: boolean) =>
  z
    .string()
    .optional()
    .transform((value, ctx) => {
      const parsed = value ? parseCLP(value) : null;
      if (parsed === null && required) {
        ctx.addIssue({ code: "custom", message: `Ingresa el ${label}` });
        return z.NEVER;
      }
      return parsed;
    });

const jsonArray = <T extends z.ZodType>(item: T) =>
  z
    .string()
    .optional()
    .transform((value, ctx) => {
      try {
        return JSON.parse(value || "[]") as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "Datos inválidos" });
        return z.NEVER;
      }
    })
    .pipe(z.array(item));

const yearSchema = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((value) => {
    const year = Number(value);
    return value === "" || value === null || value === undefined || !Number.isInteger(year) ? null : year;
  })
  .refine((year) => year === null || (year >= 1950 && year <= 2100), { message: "Año inválido" });

const productSchema = z
  .object({
    id: z.coerce.number().int().positive().optional().catch(undefined),
    name: z.string().trim().min(3, { error: "Ingresa el nombre del producto" }).max(200),
    slug: z.string().trim().max(80).optional(),
    sku: z
      .string()
      .trim()
      .max(60)
      .optional()
      .transform((value) => value || null),
    brandId: z.coerce.number().int().positive().nullable().catch(null),
    categoryId: z.coerce.number().int().positive().nullable().catch(null),
    price: money("precio", true),
    compareAtPrice: money("precio anterior", false),
    stock: z.coerce.number({ error: "Ingresa el stock" }).int({ error: "El stock debe ser un número entero" }).min(0, { error: "El stock no puede ser negativo" }),
    status: z.enum(["active", "draft", "archived"]),
    featured: z.literal("on").optional().transform(Boolean),
    universal: z.literal("on").optional().transform(Boolean),
    shortDescription: z.string().trim().max(300).optional().transform((value) => value || null),
    description: z.string().trim().max(10000).optional().transform((value) => value || null),
    specs: jsonArray(z.object({ label: z.string().trim().max(80), value: z.string().trim().max(200) })),
    fitments: jsonArray(
      z.object({
        modelId: z.coerce.number().int().positive(),
        yearFrom: yearSchema,
        yearTo: yearSchema,
        notes: z.string().trim().max(120).optional().nullable(),
      }),
    ),
    images: jsonArray(z.object({ url: z.string().min(1).max(1000), alt: z.string().trim().max(200).optional().nullable() })),
  })
  .superRefine((data, ctx) => {
    if (data.status === "active" && !(data.price && data.price > 0)) {
      ctx.addIssue({ code: "custom", path: ["price"], message: "Para publicar el producto, ingresa un precio mayor a $0." });
    }
    if (data.compareAtPrice !== null && data.price !== null && data.compareAtPrice <= data.price) {
      ctx.addIssue({
        code: "custom",
        path: ["compareAtPrice"],
        message: "El precio anterior debe ser mayor al precio actual (o déjalo vacío).",
      });
    }
    data.fitments.forEach((fitment, index) => {
      if (fitment.yearFrom && fitment.yearTo && fitment.yearFrom > fitment.yearTo) {
        ctx.addIssue({ code: "custom", path: ["fitments"], message: `Compatibilidad ${index + 1}: el año "desde" es mayor que "hasta".` });
      }
    });
    data.images.forEach((image) => {
      if (!image.url.startsWith("/uploads/") && !image.url.startsWith("https://")) {
        ctx.addIssue({ code: "custom", path: ["images"], message: "URL de imagen inválida" });
      }
    });
  });

export async function saveProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin();
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { fieldErrors, formErrors } = z.flattenError(parsed.error);
    return { error: formErrors[0] ?? "Revisa los campos marcados.", fieldErrors };
  }
  const data = parsed.data;
  const baseSlug = slugify(data.slug || data.name);
  if (!baseSlug) return { error: "Revisa los campos marcados.", fieldErrors: { slug: ["La URL no puede quedar vacía"] } };

  const slugInUse = async (candidate: string) => {
    const [row] = await db
      .select({ id: products.id })
      .from(products)
      .where(data.id ? and(eq(products.slug, candidate), ne(products.id, data.id)) : eq(products.slug, candidate));
    return Boolean(row);
  };
  let slug = baseSlug;
  if (await slugInUse(slug)) {
    if (data.id) {
      return { error: "Revisa los campos marcados.", fieldErrors: { slug: ["Ya existe otro producto con esta URL"] } };
    }
    // Producto nuevo con nombre repetido: se numera la URL (…-2, …-3).
    for (let n = 2; await slugInUse(slug); n++) slug = `${baseSlug.slice(0, 75)}-${n}`;
  }
  if (data.sku) {
    const [skuTaken] = await db
      .select({ id: products.id })
      .from(products)
      .where(data.id ? and(eq(products.sku, data.sku), ne(products.id, data.id)) : eq(products.sku, data.sku));
    if (skuTaken) return { error: "Revisa los campos marcados.", fieldErrors: { sku: ["Ese SKU ya está en uso"] } };
  }

  const values = {
    name: data.name,
    slug,
    sku: data.sku,
    brandId: data.brandId,
    categoryId: data.categoryId,
    price: data.price!,
    compareAtPrice: data.compareAtPrice,
    stock: data.stock,
    status: data.status,
    featured: data.featured,
    universal: data.universal,
    shortDescription: data.shortDescription,
    description: data.description,
    specs: data.specs.filter((spec) => spec.label && spec.value),
  };

  let previousImages: string[] = [];
  const productId = await db.transaction(async (tx) => {
    let id = data.id;
    if (id) {
      previousImages = (
        await tx.select({ url: productImages.url }).from(productImages).where(eq(productImages.productId, id))
      ).map((image) => image.url);
      const [updated] = await tx.update(products).set(values).where(eq(products.id, id)).returning({ id: products.id });
      if (!updated) throw new Error("El producto ya no existe.");
      await tx.delete(productImages).where(eq(productImages.productId, id));
      await tx.delete(productFitments).where(eq(productFitments.productId, id));
    } else {
      const [created] = await tx.insert(products).values(values).returning({ id: products.id });
      id = created.id;
    }
    if (data.images.length) {
      await tx.insert(productImages).values(
        data.images.map((image, index) => ({ productId: id!, url: image.url, alt: image.alt || null, sortOrder: index })),
      );
    }
    if (data.fitments.length) {
      await tx.insert(productFitments).values(
        data.fitments.map((fitment) => ({
          productId: id!,
          modelId: fitment.modelId,
          yearFrom: fitment.yearFrom,
          yearTo: fitment.yearTo,
          notes: fitment.notes?.trim() || null,
        })),
      );
    }
    return id;
  });

  const kept = new Set(data.images.map((image) => image.url));
  await Promise.all(previousImages.filter((url) => !kept.has(url)).map(deleteStoredImage));
  await rebuildProductSearchText(db, [productId]);
  updateTag(CATALOG_TAG);

  if (!data.id) redirect(`/admin/productos/${productId}?creado=1`);
  return { ok: true };
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  const images = await db.select({ url: productImages.url }).from(productImages).where(eq(productImages.productId, id));
  await db.delete(products).where(eq(products.id, id));
  await Promise.all(images.map((image) => deleteStoredImage(image.url)));
  updateTag(CATALOG_TAG);
  redirect("/admin/productos?eliminado=1");
}

export async function setProductsStatus(formData: FormData) {
  await requireAdmin();
  const ids = formData
    .getAll("ids")
    .map(Number)
    .filter((id) => Number.isInteger(id));
  const status = z.enum(["active", "draft", "archived"]).safeParse(formData.get("status"));
  if (!ids.length || !status.success) return;
  await db.update(products).set({ status: status.data }).where(inArray(products.id, ids));
  updateTag(CATALOG_TAG);
}

export type UploadResult = { url?: string; error?: string };

export async function uploadProductImage(formData: FormData): Promise<UploadResult> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No se recibió ninguna imagen." };
  try {
    return { url: await storeImage(file) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo subir la imagen." };
  }
}
