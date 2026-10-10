"use server";

import { eq } from "drizzle-orm";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { inquiries, services } from "@/lib/db/schema";
import { ALL_BOOKING_TIMES, isBookableDate, parseServiceLocations, todayInChile } from "@/lib/booking";
import { readStoreSettings } from "@/lib/data/settings";
import { estimateHarness, harnessPricing } from "@/lib/harness";
import { formatCLP } from "@/lib/format";
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
  preferredTime: optionalText(5),
  location: optionalText(80),
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
    preferredTime: formData.get("preferredTime") ?? "",
    location: formData.get("location") ?? "",
    message: formData.get("message") ?? "",
  });
  if (!parsed.success) {
    return { error: "Revisa los campos marcados.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const data = parsed.data;
  if (data.kind === "contact" && !data.message) {
    return { error: "Revisa los campos marcados.", fieldErrors: { message: ["Escribe tu mensaje"] } };
  }
  if (data.kind === "service") {
    // Agenda: lugar de los configurados, día disponible y hora ofrecida (se confirma por WhatsApp).
    const settings = await readStoreSettings();
    const fieldErrors: Record<string, string[]> = {};
    const locations = parseServiceLocations(settings.serviceLocations).map((location) => location.name);
    if (!data.location || !locations.includes(data.location)) fieldErrors.location = ["Elige dónde quieres atenderte"];
    if (!data.preferredDate || !isBookableDate(data.preferredDate, todayInChile())) {
      fieldErrors.preferredDate = ["Elige un día disponible en el calendario"];
    }
    if (!data.preferredTime || !ALL_BOOKING_TIMES.includes(data.preferredTime)) fieldErrors.preferredTime = ["Elige una hora"];
    if (!data.phone) fieldErrors.phone = ["Déjanos un teléfono o WhatsApp para confirmar"];
    if (Object.keys(fieldErrors).length > 0) return { error: "Revisa los campos marcados.", fieldErrors };
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
      preferredTime: data.kind === "service" ? data.preferredTime : null,
      location: data.kind === "service" ? data.location : null,
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

const harnessSchema = z.object({
  make: z.string().trim().min(1, { error: "Elige la marca del motor" }).max(60),
  model: z.string().trim().min(2, { error: "Indica el modelo o motor" }).max(120),
  cylinders: z.coerce.number().int(),
  ecu: z.string().trim().min(1, { error: "Elige la computadora" }).max(60),
  originalSensors: z.enum(["si", "no"], { error: "Indica si los sensores son originales" }),
  name: z.string().trim().min(2, { error: "Ingresa tu nombre" }).max(100),
  email: z.email({ error: "Ingresa un correo válido" }).max(200),
  phone: z.string().trim().min(8, { error: "Déjanos un teléfono o WhatsApp" }).max(30),
  message: optionalText(2000),
});

/**
 * Cotización de ramal: recalcula el valor aproximado con los precios del panel (no confía en el
 * navegador) y lo guarda como solicitud con todo el detalle.
 */
export async function submitHarnessQuote(_prev: InquiryFormState, formData: FormData): Promise<InquiryFormState> {
  if (formData.get("website")) return { ok: true };
  const parsed = harnessSchema.safeParse({
    make: formData.get("make") ?? "",
    model: formData.get("model") ?? "",
    cylinders: formData.get("cylinders") ?? "",
    ecu: formData.get("ecu") ?? "",
    originalSensors: formData.get("originalSensors") ?? "",
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    message: formData.get("message") ?? "",
  });
  if (!parsed.success) {
    return { error: "Revisa los campos marcados.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const data = parsed.data;
  const settings = await readStoreSettings();
  const pricing = harnessPricing(settings);
  const sensors = formData.getAll("sensors").map(String);
  const extras = formData.getAll("extras").map(String);
  const estimate = estimateHarness(pricing, {
    ecu: data.ecu,
    cylinders: data.cylinders,
    originalSensors: data.originalSensors === "si",
    sensors,
    extras,
  });
  if (!estimate) return { error: "Revisa la computadora y los cilindros elegidos." };

  const chosenSensors = pricing.sensors.filter((sensor) => sensors.includes(sensor.name)).map((sensor) => sensor.name);
  const chosenExtras = pricing.extras.filter((extra) => extras.includes(extra.name)).map((extra) => extra.name);
  const summary = [
    `Computadora: ${data.ecu}`,
    `Cilindros: ${data.cylinders}`,
    `Sensores (${data.originalSensors === "si" ? "originales del auto" : "nuevos / universales"}): ${chosenSensors.join(", ") || "ninguno"}`,
    `Extras: ${chosenExtras.join(", ") || "ninguno"}`,
    `Valor aproximado mostrado: ${formatCLP(estimate.min)} a ${formatCLP(estimate.max)}`,
    data.message ? `Comentarios: ${data.message}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const [inquiry] = await db
    .insert(inquiries)
    .values({
      kind: "harness",
      serviceName: `Ramal a medida · ${data.ecu}`,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      vehicle: `${data.make} ${data.model}`,
      message: summary,
    })
    .returning();

  after(async () => {
    const email = inquiryAdminEmail(inquiry, settings);
    if (settings.email) await sendEmail({ to: settings.email, replyTo: inquiry.email, ...email });
  });

  return { ok: true };
}
