"use server";

import { and, eq, ne } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { SERVICES_TAG } from "@/lib/data/catalog";
import { db } from "@/lib/db";
import { inquiries, services } from "@/lib/db/schema";
import { parseCLP } from "@/lib/format";
import { slugify } from "@/lib/text";

export type ServiceActionState = { ok?: boolean; error?: string; message?: string };

const optionalText = (max: number) => z.string().trim().max(max).optional().transform((value) => value || null);

const serviceSchema = z.object({
  id: z.coerce.number().int().positive().optional().catch(undefined),
  name: z.string().trim().min(2, { error: "Ingresa el nombre del servicio" }).max(120),
  summary: optionalText(300),
  description: optionalText(3000),
  priceFrom: z.string().optional().transform((value) => (value ? parseCLP(value) : null)),
  duration: optionalText(60),
  icon: z.string().trim().max(40).default("gauge"),
  sortOrder: z.coerce.number().int().min(0).max(9999).catch(0),
  active: z.literal("on").optional().transform(Boolean),
});

export async function saveService(_prev: ServiceActionState, formData: FormData): Promise<ServiceActionState> {
  await requireAdmin();
  const parsed = serviceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const { id, ...data } = parsed.data;
  const slug = slugify(data.name);
  const [conflict] = await db
    .select({ id: services.id })
    .from(services)
    .where(id ? and(eq(services.slug, slug), ne(services.id, id)) : eq(services.slug, slug));
  if (conflict) return { error: "Ya existe un servicio con ese nombre." };
  if (id) {
    await db.update(services).set({ ...data, slug }).where(eq(services.id, id));
  } else {
    await db.insert(services).values({ ...data, slug });
  }
  updateTag(SERVICES_TAG);
  return { ok: true, message: id ? "Servicio actualizado." : "Servicio creado." };
}

export async function deleteService(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await db.delete(services).where(eq(services.id, id));
  updateTag(SERVICES_TAG);
}

export async function updateInquiry(_prev: ServiceActionState, formData: FormData): Promise<ServiceActionState> {
  await requireAdmin();
  const parsed = z
    .object({
      id: z.coerce.number().int().positive(),
      status: z.enum(["new", "contacted", "scheduled", "closed"]),
      adminNotes: optionalText(2000),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Datos inválidos" };
  const { id, ...data } = parsed.data;
  await db.update(inquiries).set(data).where(eq(inquiries.id, id));
  refresh();
  return { ok: true, message: "Guardado." };
}

export async function deleteInquiry(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await db.delete(inquiries).where(eq(inquiries.id, id));
  refresh();
}
