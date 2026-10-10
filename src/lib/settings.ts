import type { RegionCode } from "./chile";
import type { HarnessSettings } from "./harness";

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

export type StoreSettings = HarnessSettings & {
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
  /** Lugares donde se atienden servicios, uno por línea: `nombre | detalle` (ver lib/booking). */
  serviceLocations: string;
  /** Videos de Instagram de «Quiénes somos»: uno por línea, `link | título | etiqueta` (ver lib/instagram). */
  instagramPosts: string;
  legalName: string;
  legalRut: string;
  payments: PaymentSettings;
  shipping: ShippingSettings;
};

/** Tarifas referenciales con origen en Antofagasta: ajústalas en el panel según tu courier. */
export const DEFAULT_SHIPPING_RATES: Record<RegionCode, number> = {
  AP: 6990,
  TA: 5990,
  AN: 3990,
  AT: 5990,
  CO: 6990,
  VS: 7990,
  RM: 7990,
  LI: 8990,
  ML: 8990,
  NB: 8990,
  BI: 8990,
  AR: 9990,
  LR: 9990,
  LL: 9990,
  AI: 14990,
  MA: 14990,
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Solis Racing Parts",
  tagline: "Tienda física de autopartes de performance en Antofagasta: FuelTech, combustible, sensores, fittings, relojería y lubricantes Red Line y VP. Despachos a todo Chile.",
  announcement: "Tienda física en Antofagasta · Despachos a todo Chile",
  // Sin correo por defecto: se configura en el panel (Configuración).
  email: "",
  phone: "+56 9 7147 4939",
  whatsapp: "+56 9 7147 4939",
  address: "Ausonia 244",
  city: "Antofagasta",
  mapsUrl: "",
  openingHours: "Mañana: 9:30 a 13:30\nTarde: 15:00 a 18:30",
  instagram: "https://www.instagram.com/solis_racingparts/",
  facebook: "",
  tiktok: "",
  youtube: "",
  // Cotizador de ramales: valores de ejemplo, la tienda los ajusta en el panel.
  harnessMakes: [
    "Honda",
    "Toyota",
    "Nissan",
    "Mitsubishi",
    "Subaru",
    "Mazda",
    "Suzuki",
    "Hyundai",
    "Kia",
    "Chevrolet",
    "Ford",
    "Volkswagen",
    "Peugeot",
    "BMW",
  ].join("\n"),
  harnessEcus: "FT450 | 180000\nFT550 | 230000\nFT600 | 280000",
  harnessSensors: [
    "Rotación (CKP) | 10000",
    "Fase (CMP) | 10000",
    "Posición de mariposa (TPS) | 8000",
    "Presión de admisión (MAP) | 8000",
    "Temperatura de motor | 6000",
    "Temperatura de aire | 6000",
    "Sonda lambda wideband | 12000",
    "Presión de combustible | 10000",
    "Presión de aceite | 10000",
    "Velocidad | 8000",
  ].join("\n"),
  harnessExtras: [
    "Acelerador electrónico | 40000",
    "Control de boost (solenoide) | 20000",
    "Relés de bomba y electroventiladores | 15000",
    "Botón de partida y corta corriente | 25000",
  ].join("\n"),
  harnessPerCylinder: "12000",
  harnessOriginalSensorExtra: "4000",
  harnessMargin: "15",
  serviceLocations: "Antofagasta | En la tienda, Ausonia 244\nRegión de Valparaíso | En visitas programadas a la Quinta Región",
  instagramPosts: [
    "https://www.instagram.com/reel/DcCqz8MR37D/",
    "https://www.instagram.com/reel/DbGiiSDxISO/",
    "https://www.instagram.com/reel/DbJhGT2OKmF/",
    "https://www.instagram.com/reel/DcckYUPRPH0/",
  ].join("\n"),
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
    pickupAddress: "Ausonia 244, Antofagasta",
    pickupInstructions: "Te avisaremos por correo o WhatsApp cuando tu pedido esté listo para retiro.",
    shippingEnabled: true,
    rates: DEFAULT_SHIPPING_RATES,
    freeShippingThreshold: 150000,
    shippingNote: "Despacho en 2 a 5 días hábiles mediante courier.",
    collectEnabled: true,
    collectNote:
      "Ideal para piezas grandes o pesadas (bidones de combustible, kits completos). Pagas el envío al recibir.",
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
