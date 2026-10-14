"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { readStoreSettings, saveStoreSettings, SETTINGS_TAG } from "@/lib/data/settings";
import { type PricedOption } from "@/lib/harness";

export type HarnessActionState = { ok?: boolean; error?: string; message?: string };

type Sent = {
  makes?: unknown;
  ecus?: unknown;
  sensors?: unknown;
  extras?: unknown;
  perCylinder?: unknown;
  originalSensorExtra?: unknown;
  laborBase?: unknown;
  laborPerSensor?: unknown;
  margin?: unknown;
};

/** El nombre se guarda en una línea `nombre | precio`: sin saltos de línea ni barras verticales. */
const cleanName = (value: unknown) => (typeof value === "string" ? value.replace(/[|\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) : "");

function priced(raw: unknown, label: string): PricedOption[] | string {
  const rows = Array.isArray(raw) ? raw : [];
  const options: PricedOption[] = [];
  for (const row of rows) {
    const entry = (row ?? {}) as { name?: unknown; price?: unknown };
    const name = cleanName(entry.name);
    const price = Number(entry.price);
    if (!name && (entry.price === "" || entry.price === 0 || entry.price == null)) continue; // fila vacía
    if (!name) return `${label}: hay una fila sin nombre.`;
    if (!Number.isInteger(price) || price < 0 || price > 100_000_000) return `${label}: revisa el precio de «${name}».`;
    if (options.some((option) => option.name === name)) return `${label}: «${name}» está repetido.`;
    options.push({ name, price });
  }
  return options;
}

function amount(raw: unknown, label: string, max = 100_000_000): number | string {
  const value = Number(raw);
  if (raw === "" || raw == null || !Number.isInteger(value) || value < 0 || value > max) return `Revisa ${label}: debe ser un número entero, sin decimales.`;
  return value;
}

const serialize = (options: PricedOption[]) => options.map((option) => `${option.name} | ${option.price}`).join("\n");

/** Guarda los valores del cotizador de ramales (Panel → Ramales). Llegan como JSON desde el formulario. */
export async function saveHarness(_prev: HarnessActionState, formData: FormData): Promise<HarnessActionState> {
  await requireAdmin();
  let sent: Sent;
  try {
    sent = JSON.parse(String(formData.get("harness") ?? "")) as Sent;
  } catch {
    return { error: "No se pudo leer el formulario. Recarga la página e intenta de nuevo." };
  }

  const ecus = priced(sent.ecus, "Computadoras");
  if (typeof ecus === "string") return { error: ecus };
  if (ecus.length === 0) return { error: "Agrega al menos una computadora con su precio." };
  const sensors = priced(sent.sensors, "Sensores");
  if (typeof sensors === "string") return { error: sensors };
  const extras = priced(sent.extras, "Extras");
  if (typeof extras === "string") return { error: extras };

  const makes = [...new Set((Array.isArray(sent.makes) ? sent.makes : []).map(cleanName).filter(Boolean))];
  if (makes.length === 0) return { error: "Agrega al menos una marca de motor." };

  const perCylinder = amount(sent.perCylinder, "el valor por cilindro");
  if (typeof perCylinder === "string") return { error: perCylinder };
  const originalSensorExtra = amount(sent.originalSensorExtra, "el recargo por sensor original");
  if (typeof originalSensorExtra === "string") return { error: originalSensorExtra };
  const laborBase = amount(sent.laborBase, "la mano de obra base");
  if (typeof laborBase === "string") return { error: laborBase };
  const laborPerSensor = amount(sent.laborPerSensor, "la mano de obra por sensor");
  if (typeof laborPerSensor === "string") return { error: laborPerSensor };
  const margin = amount(sent.margin, "el margen del rango", 50);
  if (typeof margin === "string") return { error: margin.replace("sin decimales", "entre 0 y 50") };

  const settings = await readStoreSettings();
  await saveStoreSettings({
    ...settings,
    harnessMakes: makes.join("\n"),
    harnessEcus: serialize(ecus),
    harnessSensors: serialize(sensors),
    harnessExtras: serialize(extras),
    harnessPerCylinder: String(perCylinder),
    harnessOriginalSensorExtra: String(originalSensorExtra),
    harnessLaborBase: String(laborBase),
    harnessLaborPerSensor: String(laborPerSensor),
    harnessMargin: String(margin),
  });
  updateTag(SETTINGS_TAG);
  return { ok: true, message: "Valores guardados. El cotizador de la tienda ya usa los nuevos precios." };
}
