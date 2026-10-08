import { isRegionCode } from "./chile";
import type { DeliveryMethod } from "./db/schema";
import type { ShippingSettings } from "./settings";

export type ShippingQuote =
  | { ok: true; cost: number; free: boolean }
  | { ok: false; error: string };

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  pickup: "Retiro en taller",
  shipping: "Despacho a domicilio",
  shipping_collect: "Envío por pagar",
};

export function isDeliveryMethodEnabled(settings: ShippingSettings, method: DeliveryMethod) {
  if (method === "pickup") return settings.pickupEnabled;
  if (method === "shipping") return settings.shippingEnabled;
  return settings.collectEnabled;
}

/** Calcula el costo de despacho que se cobra en el checkout. */
export function quoteShipping(
  settings: ShippingSettings,
  method: DeliveryMethod,
  regionCode: string | null | undefined,
  subtotal: number,
): ShippingQuote {
  if (!isDeliveryMethodEnabled(settings, method)) {
    return { ok: false, error: "Ese método de entrega no está disponible." };
  }
  // Retiro en taller y envío por pagar no suman costo al pedido.
  if (method !== "shipping") return { ok: true, cost: 0, free: false };

  if (!regionCode || !isRegionCode(regionCode)) {
    return { ok: false, error: "Selecciona una región de despacho." };
  }
  if (settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold) {
    return { ok: true, cost: 0, free: true };
  }
  const rate = settings.rates[regionCode];
  if (typeof rate !== "number" || rate < 0) {
    return { ok: false, error: "No tenemos tarifa de despacho para esa región." };
  }
  return { ok: true, cost: rate, free: false };
}
