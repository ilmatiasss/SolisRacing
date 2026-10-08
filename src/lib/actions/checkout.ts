"use server";

import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { isValidCommune } from "@/lib/chile";
import { CATALOG_TAG } from "@/lib/data/catalog";
import { readStoreSettings } from "@/lib/data/settings";
import { notifyNewOrder } from "@/lib/order-notifications";
import {
  cancelOrder,
  createOrder,
  expireAbandonedWebpayOrders,
  loadCheckoutProducts,
  setWebpayToken,
  StockError,
  webpayBuyOrder,
  webpaySessionId,
  type StockIssue,
} from "@/lib/orders";
import { createWebpayTransaction } from "@/lib/payments/webpay";
import { formatRut, isValidRut } from "@/lib/rut";
import { quoteShipping } from "@/lib/shipping";

export type CheckoutState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  stockIssues?: StockIssue[];
  /** Los precios cambiaron desde que se armó el carrito: hay que refrescarlo. */
  pricesChanged?: boolean;
  webpay?: { url: string; token: string };
};

const text = (max: number) => z.string().trim().max(max, { error: `Máximo ${max} caracteres` });
// Los campos ocultos (por ejemplo, los de factura cuando se elige boleta) no vienen en el formulario.
const optional = (max: number) =>
  text(max)
    .optional()
    .transform((value) => value || null);

const lineSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(99),
});

const checkoutSchema = z.object({
  name: text(100).min(3, { error: "Ingresa tu nombre y apellido" }),
  email: z.email({ error: "Ingresa un correo válido" }).max(200),
  phone: text(30).refine((value) => value.replace(/\D/g, "").length >= 8, { error: "Ingresa un teléfono válido" }),
  rut: optional(15),
  documentType: z.enum(["boleta", "factura"]),
  companyName: optional(150),
  companyRut: optional(15),
  companyGiro: optional(150),
  companyAddress: optional(200),
  deliveryMethod: z.enum(["pickup", "shipping", "shipping_collect"], { error: "Elige cómo recibir tu pedido" }),
  region: optional(5),
  commune: optional(60),
  address: optional(200),
  address2: optional(100),
  notes: optional(500),
  paymentMethod: z.enum(["webpay", "transfer"], { error: "Elige un medio de pago" }),
  acceptTerms: z.literal("on", { error: "Debes aceptar los términos y condiciones" }),
  expectedTotal: z.coerce.number().int().nonnegative(),
  items: z
    .string()
    .transform((value, ctx) => {
      try {
        return JSON.parse(value) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "Carrito inválido" });
        return z.NEVER;
      }
    })
    .pipe(z.array(lineSchema).min(1, { error: "Tu carrito está vacío" }).max(50)),
});

/**
 * Reglas que dependen de otros campos (factura, dirección) o del formato del RUT. Se evalúan
 * aparte para mostrar todos los errores de una vez, aunque otros campos también fallen.
 */
function crossFieldErrors(raw: Record<string, FormDataEntryValue>) {
  const get = (key: string) => (typeof raw[key] === "string" ? (raw[key] as string).trim() : "");
  const errors: Record<string, string[]> = {};
  const add = (key: string, message: string) => (errors[key] = [message]);

  if (get("rut") && !isValidRut(get("rut"))) add("rut", "RUT inválido");
  if (get("documentType") === "factura") {
    if (!get("companyName")) add("companyName", "Ingresa la razón social");
    if (!isValidRut(get("companyRut"))) add("companyRut", "Ingresa un RUT de empresa válido");
    if (!get("companyGiro")) add("companyGiro", "Ingresa el giro");
  }
  const delivery = get("deliveryMethod");
  if (delivery === "shipping" || delivery === "shipping_collect") {
    const region = get("region");
    if (!region) add("region", "Selecciona una región");
    if (!region || !isValidCommune(region, get("commune"))) add("commune", "Selecciona una comuna");
    if (get("address").length < 5) add("address", "Ingresa la dirección (calle y número)");
  }
  return errors;
}

async function requestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto")?.split(",")[0] ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const raw = Object.fromEntries(formData);
  const parsed = checkoutSchema.safeParse(raw);
  const extraErrors = crossFieldErrors(raw);
  if (!parsed.success || Object.keys(extraErrors).length > 0) {
    const flattened = parsed.success ? { fieldErrors: {}, formErrors: [] } : z.flattenError(parsed.error);
    const fieldErrors: Partial<Record<string, string[]>> = { ...flattened.fieldErrors, ...extraErrors };
    return {
      error: fieldErrors.items?.[0] ?? flattened.formErrors[0] ?? "Revisa los datos marcados en el formulario.",
      fieldErrors,
    };
  }
  const data = parsed.data;
  const settings = await readStoreSettings();

  if (data.paymentMethod === "webpay" && !settings.payments.webpayEnabled) {
    return { error: "El pago con Webpay no está disponible en este momento." };
  }
  if (data.paymentMethod === "transfer" && !settings.payments.transferEnabled) {
    return { error: "El pago por transferencia no está disponible en este momento." };
  }

  // Limpieza oportunista: libera el stock de pagos con Webpay abandonados.
  await expireAbandonedWebpayOrders().catch((error) => console.error("No se pudieron expirar pedidos:", error));

  const products = await loadCheckoutProducts(data.items.map((line) => line.productId));
  const priceById = new Map(products.map((p) => [p.id, p.price]));
  const subtotal = data.items.reduce((sum, line) => sum + (priceById.get(line.productId) ?? 0) * line.quantity, 0);

  const quote = quoteShipping(settings.shipping, data.deliveryMethod, data.region, subtotal);
  if (!quote.ok) return { error: quote.error, fieldErrors: { deliveryMethod: [quote.error] } };

  if (subtotal + quote.cost !== data.expectedTotal) {
    return {
      error: "Los precios o el costo de despacho se actualizaron. Revisa el resumen antes de continuar.",
      pricesChanged: true,
    };
  }

  let created: Awaited<ReturnType<typeof createOrder>>;
  try {
    created = await createOrder({
      lines: data.items,
      paymentMethod: data.paymentMethod,
      deliveryMethod: data.deliveryMethod,
      shippingCost: quote.cost,
      customer: {
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        rut: data.rut ? formatRut(data.rut) : null,
      },
      document: {
        type: data.documentType,
        companyName: data.documentType === "factura" ? data.companyName : null,
        companyRut: data.documentType === "factura" && data.companyRut ? formatRut(data.companyRut) : null,
        companyGiro: data.documentType === "factura" ? data.companyGiro : null,
        companyAddress: data.documentType === "factura" ? data.companyAddress : null,
      },
      shipping:
        data.deliveryMethod === "pickup"
          ? { region: null, commune: null, address: null, address2: null }
          : { region: data.region, commune: data.commune, address: data.address, address2: data.address2 },
      notes: data.notes,
    });
  } catch (error) {
    if (error instanceof StockError) {
      return {
        error: "Algunos productos ya no tienen stock suficiente. Ajustamos tu carrito.",
        stockIssues: error.issues,
      };
    }
    throw error;
  }

  const { order } = created;
  revalidateTag(CATALOG_TAG, "max");

  if (data.paymentMethod === "transfer") {
    after(() => notifyNewOrder(order.id));
    redirect(`/pedido/${order.id}?t=${order.publicToken}`);
  }

  try {
    const origin = await requestOrigin();
    const transaction = await createWebpayTransaction({
      buyOrder: webpayBuyOrder(order.id),
      sessionId: webpaySessionId(order),
      amount: order.total,
      returnUrl: `${origin}/pago/webpay/retorno`,
      origin,
    });
    await setWebpayToken(order.id, transaction.token);
    return { webpay: transaction };
  } catch (error) {
    console.error("Error al crear la transacción Webpay:", error);
    await cancelOrder(order.id, "No se pudo iniciar el pago con Webpay", {
      publicMessage: "No pudimos conectar con Webpay. El pedido fue cancelado.",
    });
    return {
      error:
        "No pudimos conectar con Webpay. Intenta nuevamente en unos minutos o elige pagar por transferencia.",
    };
  }
}
