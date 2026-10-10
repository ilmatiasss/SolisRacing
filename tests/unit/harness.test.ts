import { describe, expect, it } from "vitest";
import { estimateHarness, harnessPricing, invalidPricedLines, parseAmount, parsePricedOptions } from "@/lib/harness";
import { DEFAULT_SETTINGS } from "@/lib/settings";

const pricing = harnessPricing(DEFAULT_SETTINGS);

describe("cotizador de ramales", () => {
  it("lee montos y listas «nombre | precio» del panel", () => {
    expect(parseAmount("$12.000")).toBe(12000);
    expect(parseAmount("abc")).toBeNull();
    expect(parsePricedOptions("FT450 | 180.000\nsin precio\nFT550 | $230.000")).toEqual([
      { name: "FT450", price: 180000 },
      { name: "FT550", price: 230000 },
    ]);
    expect(invalidPricedLines("FT450 | 180000\n\nFT600")).toEqual(["FT600"]);
  });

  it("suma base, cilindros, sensores, recargo por originales y extras, con un rango redondeado", () => {
    const estimate = estimateHarness(pricing, {
      ecu: "FT550",
      cylinders: 4,
      originalSensors: true,
      sensors: ["Rotación (CKP)", "Fase (CMP)", "No existe"],
      extras: ["Acelerador electrónico"],
    });
    // 230.000 + 4 × 12.000 + (10.000 + 10.000) + 2 × 4.000 + 40.000 = 346.000
    expect(estimate?.total).toBe(346000);
    expect(estimate?.min).toBe(295000); // 346.000 × 0,85 = 294.100 → 295.000
    expect(estimate?.max).toBe(400000); // 346.000 × 1,15 = 397.900 → 400.000
    expect(estimate?.lines.map((line) => line.label)).toContain("Conectores para sensores originales");
  });

  it("redondea los extremos del rango sin errores de decimales", () => {
    // 350.000 × 1,15 = 402.500 exacto → 405.000 (con punto flotante daba 402.499,99… → 400.000).
    const estimate = estimateHarness(pricing, {
      ecu: "FT550",
      cylinders: 4,
      originalSensors: true,
      sensors: pricing.sensors.slice(0, 6).map((sensor) => sensor.name),
      extras: [],
    });
    expect([estimate?.total, estimate?.min, estimate?.max]).toEqual([350000, 300000, 405000]);
  });

  it("sin recargo con sensores nuevos y nulo si la computadora no existe", () => {
    const base = { ecu: "FT450", cylinders: 6, sensors: ["Velocidad"], extras: [] };
    expect(estimateHarness(pricing, { ...base, originalSensors: false })?.total).toBe(180000 + 72000 + 8000);
    expect(estimateHarness(pricing, { ...base, ecu: "Otra ECU", originalSensors: false })).toBeNull();
    expect(estimateHarness(pricing, { ...base, cylinders: 7, originalSensors: false })).toBeNull();
  });
});
