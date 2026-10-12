"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { normalizeBookingConfig } from "@/lib/booking";
import { BOOKINGS_TAG } from "@/lib/data/booking";
import { readStoreSettings, saveStoreSettings, SETTINGS_TAG } from "@/lib/data/settings";

export type BookingState = { ok?: boolean; error?: string; message?: string };

/** Guarda la disponibilidad de la agenda (Panel → Agenda). Llega como JSON desde el formulario. */
export async function saveBooking(_prev: BookingState, formData: FormData): Promise<BookingState> {
  await requireAdmin();
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("booking") ?? ""));
  } catch {
    return { error: "No se pudo leer la agenda. Recarga la página e intenta de nuevo." };
  }
  const sent = (raw as { locations?: { name?: unknown }[] } | null)?.locations ?? [];
  const names = sent.map((location) => (typeof location?.name === "string" ? location.name.trim() : ""));
  if (names.length === 0) return { error: "Agrega al menos un lugar de atención." };
  if (names.some((name) => !name)) return { error: "Cada lugar necesita un nombre." };
  if (new Set(names).size !== names.length) return { error: "Hay dos lugares con el mismo nombre." };

  const booking = normalizeBookingConfig(raw);
  for (const location of booking.locations) {
    if (location.times.length === 0) return { error: `${location.name}: agrega al menos un horario.` };
    if (location.mode === "weekly" && location.weekdays.length === 0) {
      return { error: `${location.name}: marca los días de la semana que atiendes.` };
    }
  }

  const settings = await readStoreSettings();
  await saveStoreSettings({ ...settings, booking });
  updateTag(SETTINGS_TAG);
  updateTag(BOOKINGS_TAG);
  return { ok: true, message: "Agenda guardada. La página de servicios ya muestra la nueva disponibilidad." };
}
