import { describe, expect, it } from "vitest";
import { REGIONS, isValidCommune } from "@/lib/chile";
import { DEFAULT_SETTINGS, mergeSettings } from "@/lib/settings";
import { quoteShipping } from "@/lib/shipping";

const shipping = DEFAULT_SETTINGS.shipping;

describe("regiones y comunas", () => {
  it("incluye las 16 regiones y 346 comunas", () => {
    expect(REGIONS).toHaveLength(16);
    expect(REGIONS.reduce((sum, region) => sum + region.communes.length, 0)).toBe(346);
  });

  it("valida que la comuna pertenezca a la región", () => {
    expect(isValidCommune("RM", "Providencia")).toBe(true);
    expect(isValidCommune("VS", "Providencia")).toBe(false);
    expect(isValidCommune("XX", "Providencia")).toBe(false);
  });
});

describe("cálculo de despacho", () => {
  it("cobra la tarifa de la región", () => {
    expect(quoteShipping(shipping, "shipping", "AN", 50000)).toEqual({ ok: true, cost: 3990, free: false });
    expect(quoteShipping(shipping, "shipping", "RM", 50000)).toEqual({ ok: true, cost: 7990, free: false });
    expect(quoteShipping(shipping, "shipping", "MA", 50000)).toEqual({ ok: true, cost: 14990, free: false });
  });

  it("es gratis desde el monto mínimo configurado", () => {
    expect(quoteShipping(shipping, "shipping", "AN", 150000)).toEqual({ ok: true, cost: 0, free: true });
  });

  it("no cobra retiro en taller ni envío por pagar", () => {
    expect(quoteShipping(shipping, "pickup", null, 1000)).toEqual({ ok: true, cost: 0, free: false });
    expect(quoteShipping(shipping, "shipping_collect", "RM", 1000)).toEqual({ ok: true, cost: 0, free: false });
  });

  it("exige región válida para despacho", () => {
    expect(quoteShipping(shipping, "shipping", null, 1000).ok).toBe(false);
    expect(quoteShipping(shipping, "shipping", "ZZ", 1000).ok).toBe(false);
  });

  it("rechaza métodos deshabilitados", () => {
    expect(quoteShipping({ ...shipping, pickupEnabled: false }, "pickup", null, 1000).ok).toBe(false);
  });

  it("sin despacho gratis cuando el umbral es 0", () => {
    expect(quoteShipping({ ...shipping, freeShippingThreshold: 0 }, "shipping", "RM", 10_000_000)).toEqual({
      ok: true,
      cost: 7990,
      free: false,
    });
  });
});

describe("configuración de la tienda", () => {
  it("combina valores guardados con los valores por defecto", () => {
    const merged = mergeSettings({ storeName: "Mi Tienda", shipping: { rates: { RM: 3990 } }, campoViejo: 1 });
    expect(merged.storeName).toBe("Mi Tienda");
    expect(merged.shipping.rates.RM).toBe(3990);
    expect(merged.shipping.rates.VS).toBe(DEFAULT_SETTINGS.shipping.rates.VS);
    expect(merged.payments.webpayEnabled).toBe(true);
    expect("campoViejo" in merged).toBe(false);
  });

  it("ignora tipos incorrectos y datos inválidos", () => {
    expect(mergeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(mergeSettings({ storeName: 123 }).storeName).toBe(DEFAULT_SETTINGS.storeName);
  });
});
