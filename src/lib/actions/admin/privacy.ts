"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { BOOKINGS_TAG } from "@/lib/data/booking";
import { deleteInquiriesByEmail } from "@/lib/data/privacy";

/** Supresión: borra las solicitudes y mensajes de un correo (los pedidos se conservan por ley). */
export async function deletePersonInquiries(formData: FormData) {
  await requireAdmin();
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim());
  if (!email.success) redirect("/admin/privacidad");
  const count = await deleteInquiriesByEmail(email.data);
  updateTag(BOOKINGS_TAG);
  redirect(`/admin/privacidad?correo=${encodeURIComponent(email.data)}&eliminadas=${count}`);
}
