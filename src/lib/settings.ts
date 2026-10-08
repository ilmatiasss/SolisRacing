import type { RegionCode } from "./chile";

export type PaymentSettings = {
  webpayEnabled: boolean;
  transferEnabled: boolean;
  transferBank: string;
  transferAccountType: string;
  transferAccountNumber: string;
  transferHolder: string;
  transferRut: string;
  transferEmail: string;
  transferInstructions: string;
};

export type ShippingSettings = {
  pickupEnabled: boolean;
  pickupAddress: string;
  pickupInstructions: string;
  shippingEnabled: boolean;
  /** Tarifas de despacho por región, en CLP. */
  rates: Record<RegionCode, number>;
  /** Monto desde el cual el despacho es gratis. 0 = sin despacho gratis. */
  freeShippingThreshold: number;
  shippingNote: string;
  collectEnabled: boolean;
  collectNote: string;
};

export type StoreSettings = {
  storeName: string;
  tagline: string;
  announcement: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  mapsUrl: string;
  openingHours: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  legalName: string;
  legalRut: string;
  payments: PaymentSettings;
  shipping: ShippingSettings;
};

export const DEFAULT_SHIPPING_RATES: Record<RegionCode, number> = {
  AP: 10990,
  TA: 10990,
  AN: 9990,
  AT: 8990,
  CO: 7990,
  VS: 6990,
  RM: 4990,
  LI: 6990,
  ML: 7990,
  NB: 7990,
  BI: 7990,
  AR: 8990,
  LR: 8990,
  LL: 9990,
  AI: 14990,
  MA: 14990,
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Solis Racing Parts",
  tagline: "Partes de performance y seteos para tu auto",
  announcement: "Despachos a todo Chile · Paga con Webpay o transferencia",
  // Sin correo por defecto: se configura en el panel (Configuración).
  email: "",
  phone: "+56 9 7147 4939",
  whatsapp: "+56 9 7147 4939",
  address: "Av. Ejemplo 1234",
  city: "Santiago, Chile",
  mapsUrl: "",
  openingHours: "Lunes a viernes: 9:30 a 18:30\nSábado: 10:00 a 14:00",
  instagram: "https://www.instagram.com/solis_racingparts/",
  facebook: "",
  tiktok: "",
  youtube: "",
  legalName: "Solis Racing Parts",
  legalRut: "",
  payments: {
    webpayEnabled: true,
    transferEnabled: true,
    transferBank: "Banco de Chile",
    transferAccountType: "Cuenta corriente",
    transferAccountNumber: "00-000-00000-00",
    transferHolder: "Solis Racing Parts",
    transferRut: "",
    transferEmail: "",
    transferInstructions:
      "Envíanos el comprobante por WhatsApp o correo indicando tu número de pedido. Despachamos una vez confirmado el pago.",
  },
  shipping: {
    pickupEnabled: true,
    pickupAddress: "Av. Ejemplo 1234, Santiago",
    pickupInstructions: "Te avisaremos por correo o WhatsApp cuando tu pedido esté listo para retiro.",
    shippingEnabled: true,
    rates: DEFAULT_SHIPPING_RATES,
    freeShippingThreshold: 150000,
    shippingNote: "Despacho en 2 a 5 días hábiles mediante courier.",
    collectEnabled: true,
    collectNote:
      "Ideal para piezas grandes (escapes, suspensiones, llantas). Pagas el envío al recibir.",
  },
};

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Combina la configuración guardada con los valores por defecto (campos nuevos incluidos). */
export function mergeSettings(stored: unknown): StoreSettings {
  const merge = (base: Record<string, unknown>, override: unknown): Record<string, unknown> => {
    if (!isPlainObject(override)) return base;
    const result: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(override)) {
      if (!(key in base)) continue;
      const baseValue = base[key];
      if (isPlainObject(baseValue)) {
        result[key] = merge(baseValue, value);
      } else if (value !== undefined && value !== null && typeof value === typeof baseValue) {
        result[key] = value;
      }
    }
    return result;
  };
  return merge(DEFAULT_SETTINGS as unknown as Record<string, unknown>, stored) as StoreSettings;
}

export type StoreSettingsInput = DeepPartial<StoreSettings>;
