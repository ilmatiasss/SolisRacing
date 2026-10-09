"use server";

import { eq } from "drizzle-orm";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { inquiries, services } from "@/lib/db/schema";
import { readStoreSettings } from "@/lib/data/settings";
import { sendEmail } from "@/lib/email";
import { inquiryAdminEmail } from "@/lib/email-templates";

export type InquiryFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
};

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Máximo ${max} caracteres` })
    .transform((value) => value || null);

const inquirySchema = z.object({
  kind: z.enum(["service", "contact", "part"]),
  serviceId: z.coerce.number().int().positive().optional().catch(undefined),
  name: z.string().trim().min(2, { error: "Ingresa tu nombre" }).max(100),
  email: z.email({ error: "Ingresa un correo válido" }).max(200),
  phone: optionalText(30),
  vehicle: optionalText(120),
  preferredDate: z
    .string()
    .trim()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, { error: "Fecha inválida" })
    .transform((value) => value || null),
  message: optionalText(2000),
});

export async function submitInquiry(_prev: InquiryFormState, formData: FormData): Promise<InquiryFormState> {
  // Campo trampa para bots: las personas no lo ven ni lo completan.
  if (formData.get("website")) return { ok: true };

  const parsed = inquirySchema.safeParse({
    kind: formData.get("kind"),
    serviceId: formData.get("serviceId") || undefined,
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    vehicle: formData.get("vehicle") ?? "",
    preferredDate: formData.get("preferredDate") ?? "",
    message: formData.get("message") ?? "",
  });
  if (!parsed.success) {
    return { error: "Revisa los campos marcados.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const data = parsed.data;
  if (data.kind === "contact" && !data.message) {
    return { error: "Revisa los campos marcados.", fieldErrors: { message: ["Escribe tu mensaje"] } };
  }
  if (data.kind === "part") {
    const fieldErrors: Record<string, string[]> = {};
    if (!data.message) fieldErrors.message = ["Cuéntanos qué repuesto buscas"];
    if (!data.vehicle) fieldErrors.vehicle = ["Indica tu auto"];
    if (!data.phone) fieldErrors.phone = ["Déjanos un teléfono o WhatsApp"];
    if (Object.keys(fieldErrors).length > 0) return { error: "Revisa los campos marcados.", fieldErrors };
  }

  let serviceName: string | null = null;
  if (data.serviceId) {
    const [service] = await db
      .select({ name: services.name })
      .from(services)
      .where(eq(services.id, data.serviceId));
    serviceName = service?.name ?? null;
  }

  const [inquiry] = await db
    .insert(inquiries)
    .values({
      kind: data.kind,
      serviceId: serviceName ? data.serviceId : null,
      serviceName,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      vehicle: data.vehicle,
      preferredDate: data.preferredDate,
      message: data.message,
    })
    .returning();

  after(async () => {
    const settings = await readStoreSettings();
    const email = inquiryAdminEmail(inquiry, settings);
    if (settings.email) await sendEmail({ to: settings.email, replyTo: inquiry.email, ...email });
  });

  return { ok: true };
}
