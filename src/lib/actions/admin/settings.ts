"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { REGIONS } from "@/lib/chile";
import { readStoreSettings, saveStoreSettings, SETTINGS_TAG } from "@/lib/data/settings";
import { parseCLP } from "@/lib/format";
import { isValidRut, formatRut } from "@/lib/rut";
import type { StoreSettings } from "@/lib/settings";

export type SettingsState = { ok?: boolean; error?: string; message?: string };

const BOOLEAN_FIELDS = [
  "payments.webpayEnabled",
  "payments.transferEnabled",
  "shipping.pickupEnabled",
  "shipping.shippingEnabled",
  "shipping.collectEnabled",
] as const;

/** Asigna un valor solo si la ruta ya existe en la configuración (ignora campos desconocidos). */
function setPath(target: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split(".");
  let node: Record<string, unknown> = target;
  for (const key of keys.slice(0, -1)) {
    const child = Object.hasOwn(node, key) ? node[key] : undefined;
    if (typeof child !== "object" || child === null || Array.isArray(child)) return;
    node = child as Record<string, unknown>;
  }
  const last = keys[keys.length - 1];
  if (!Object.hasOwn(node, last) || typeof node[last] !== typeof value) return;
  node[last] = value;
}

const urlOrEmpty = z.union([z.literal(""), z.url({ error: "Ingresa una URL completa (https://…)" })]);

export async function saveSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  await requireAdmin();
  const current = await readStoreSettings();
  const next = structuredClone(current) as unknown as Record<string, unknown>;

  for (const [key, raw] of formData) {
    if (typeof raw !== "string" || key.startsWith("$")) continue;
    if ((BOOLEAN_FIELDS as readonly string[]).includes(key)) continue;
    if (key.startsWith("shipping.rates.") || key === "shipping.freeShippingThreshold") {
      setPath(next, key, parseCLP(raw) ?? 0);
    } else {
      setPath(next, key, raw.trim());
    }
  }
  for (const key of BOOLEAN_FIELDS) setPath(next, key, formData.get(key) === "on");

  const settings = next as unknown as StoreSettings;
  if (!settings.storeName) return { error: "El nombre de la tienda no puede quedar vacío." };
  if (settings.email && !z.email().safeParse(settings.email).success) return { error: "Revisa el correo de la tienda." };
  if (settings.payments.transferEmail && !z.email().safeParse(settings.payments.transferEmail).success) {
    return { error: "Revisa el correo para enviar comprobantes de transferencia." };
  }
  for (const field of ["instagram", "facebook", "tiktok", "youtube", "mapsUrl"] as const) {
    const check = urlOrEmpty.safeParse(settings[field]);
    if (!check.success) return { error: `${field}: ${check.error.issues[0]?.message}` };
  }
  for (const field of ["legalRut", "payments.transferRut"] as const) {
    const value = field === "legalRut" ? settings.legalRut : settings.payments.transferRut;
    if (value && !isValidRut(value)) return { error: `El RUT ${value} no es válido.` };
  }
  if (settings.legalRut) settings.legalRut = formatRut(settings.legalRut);
  if (settings.payments.transferRut) settings.payments.transferRut = formatRut(settings.payments.transferRut);
  if (!settings.payments.webpayEnabled && !settings.payments.transferEnabled) {
    return { error: "Debes dejar al menos un medio de pago activo." };
  }
  if (!settings.shipping.pickupEnabled && !settings.shipping.shippingEnabled && !settings.shipping.collectEnabled) {
    return { error: "Debes dejar al menos un método de entrega activo." };
  }
  for (const region of REGIONS) {
    const rate = settings.shipping.rates[region.code];
    if (!Number.isInteger(rate) || rate < 0) return { error: `Revisa la tarifa de ${region.shortName}.` };
  }

  await saveStoreSettings(settings);
  updateTag(SETTINGS_TAG);
  return { ok: true, message: "Configuración guardada. La tienda ya muestra los cambios." };
}
