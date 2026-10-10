/*
 * Cotizador de ramales (arneses) a medida. Los precios se editan en el panel (Configuración →
 * Cotizador de ramales) como listas de texto `nombre | precio`, una opción por línea.
 * El valor que ve el cliente es referencial: un rango alrededor del cálculo.
 */

export type PricedOption = { name: string; price: number };

export type HarnessPricing = {
  makes: string[];
  ecus: PricedOption[];
  sensors: PricedOption[];
  extras: PricedOption[];
  perCylinder: number;
  originalSensorExtra: number;
  /** Margen del rango, en porcentaje (15 = ±15 %). */
  margin: number;
};

export type HarnessSettings = {
  harnessMakes: string;
  harnessEcus: string;
  harnessSensors: string;
  harnessExtras: string;
  harnessPerCylinder: string;
  harnessOriginalSensorExtra: string;
  harnessMargin: string;
};

export const HARNESS_CYLINDERS = [3, 4, 5, 6, 8] as const;
export const DEFAULT_SENSOR_COUNT = 6;

/** "$12.000", "12.000" o "12000" → 12000; vacío o inválido → null. */
export function parseAmount(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  const value = Number(digits);
  return Number.isSafeInteger(value) ? value : null;
}

/** Lista `nombre | precio`, una por línea; las líneas sin precio válido se ignoran. */
export function parsePricedOptions(text: string): PricedOption[] {
  const options: PricedOption[] = [];
  for (const line of text.split("\n")) {
    const [name = "", rawPrice = ""] = line.split("|").map((part) => part.trim());
    const price = parseAmount(rawPrice);
    if (name && price !== null && !options.some((option) => option.name === name)) options.push({ name, price });
  }
  return options;
}

/** Líneas con texto que no siguen el formato `nombre | precio` (para avisar en el panel). */
export function invalidPricedLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      const [name = "", rawPrice = ""] = line.split("|").map((part) => part.trim());
      return !name || parseAmount(rawPrice) === null;
    });
}

export function harnessPricing(settings: HarnessSettings): HarnessPricing {
  return {
    makes: settings.harnessMakes
      .split("\n")
      .map((make) => make.trim())
      .filter(Boolean),
    ecus: parsePricedOptions(settings.harnessEcus),
    sensors: parsePricedOptions(settings.harnessSensors),
    extras: parsePricedOptions(settings.harnessExtras),
    perCylinder: parseAmount(settings.harnessPerCylinder) ?? 0,
    originalSensorExtra: parseAmount(settings.harnessOriginalSensorExtra) ?? 0,
    margin: Math.min(parseAmount(settings.harnessMargin) ?? 0, 50),
  };
}

export type HarnessChoice = {
  ecu: string;
  cylinders: number;
  originalSensors: boolean;
  sensors: string[];
  extras: string[];
};

export type HarnessEstimate = {
  lines: { label: string; amount: number }[];
  total: number;
  min: number;
  max: number;
};

const roundTo5000 = (value: number) => Math.round(value / 5000) * 5000;

/** Calcula el valor aproximado; devuelve null si la computadora elegida no existe en la lista. */
export function estimateHarness(pricing: HarnessPricing, choice: HarnessChoice): HarnessEstimate | null {
  const ecu = pricing.ecus.find((option) => option.name === choice.ecu);
  if (!ecu || !HARNESS_CYLINDERS.includes(choice.cylinders as (typeof HARNESS_CYLINDERS)[number])) return null;
  const sensors = pricing.sensors.filter((sensor) => choice.sensors.includes(sensor.name));
  const extras = pricing.extras.filter((extra) => choice.extras.includes(extra.name));
  const sensorTotal = sensors.reduce((sum, sensor) => sum + sensor.price, 0);
  const lines = [
    { label: `Ramal base para ${ecu.name}`, amount: ecu.price },
    { label: `${choice.cylinders} cilindros (inyectores y bobinas)`, amount: choice.cylinders * pricing.perCylinder },
    { label: `${sensors.length} sensores`, amount: sensorTotal },
  ];
  if (choice.originalSensors && sensors.length > 0 && pricing.originalSensorExtra > 0) {
    lines.push({ label: "Conectores para sensores originales", amount: sensors.length * pricing.originalSensorExtra });
  }
  for (const extra of extras) lines.push({ label: extra.name, amount: extra.price });
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  // En enteros (× (100 ± margen) / 100) para no arrastrar decimales de punto flotante al redondear.
  return {
    lines,
    total,
    min: roundTo5000((total * (100 - pricing.margin)) / 100),
    max: roundTo5000((total * (100 + pricing.margin)) / 100),
  };
}
