"use server";

import { count, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { checkPassword, hashPassword, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";

export type UserActionState = { ok?: boolean; error?: string; message?: string };

const passwordSchema = z.string().min(8, { error: "La contraseña debe tener al menos 8 caracteres" }).max(100);

export async function createAdminUser(_prev: UserActionState, formData: FormData): Promise<UserActionState> {
  await requireAdmin();
  const parsed = z
    .object({
      name: z.string().trim().min(2, { error: "Ingresa el nombre" }).max(80),
      email: z.email({ error: "Correo inválido" }),
      password: passwordSchema,
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const email = parsed.data.email.toLowerCase();
  const [existing] = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.email, email));
  if (existing) return { error: "Ya existe un usuario con ese correo." };
  await db.insert(adminUsers).values({
    name: parsed.data.name,
    email,
    passwordHash: await hashPassword(parsed.data.password),
  });
  refresh();
  return { ok: true, message: `Usuario ${email} creado.` };
}

export async function deleteAdminUser(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id === admin.id) return;
  const [{ total }] = await db.select({ total: count() }).from(adminUsers);
  if (total <= 1) return;
  await db.delete(adminUsers).where(eq(adminUsers.id, id));
  refresh();
}

export async function changeOwnPassword(_prev: UserActionState, formData: FormData): Promise<UserActionState> {
  const admin = await requireAdmin();
  const parsed = z
    .object({ current: z.string().min(1, { error: "Ingresa tu contraseña actual" }), password: passwordSchema, confirm: z.string() })
    .refine((data) => data.password === data.confirm, { error: "Las contraseñas nuevas no coinciden", path: ["confirm"] })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  if (!(await checkPassword(admin.id, parsed.data.current))) return { error: "La contraseña actual no es correcta." };
  await db
    .update(adminUsers)
    .set({ passwordHash: await hashPassword(parsed.data.password) })
    .where(eq(adminUsers.id, admin.id));
  return { ok: true, message: "Contraseña actualizada." };
}
