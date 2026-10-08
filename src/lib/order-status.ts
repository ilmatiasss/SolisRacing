import type { InquiryStatus, OrderStatus, PaymentMethod } from "./db/schema";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente de pago",
  paid: "Pagado",
  processing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

/** Etiqueta para clientes de retiro en taller ("Listo para retiro" en vez de "Enviado"). */
export function orderStatusLabel(status: OrderStatus, isPickup: boolean): string {
  if (isPickup && status === "shipped") return "Listo para retiro";
  if (isPickup && status === "delivered") return "Retirado";
  return ORDER_STATUS_LABELS[status];
}

export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "brand";

export const ORDER_STATUS_TONES: Record<OrderStatus, Tone> = {
  pending: "warning",
  paid: "success",
  processing: "info",
  shipped: "brand",
  delivered: "success",
  cancelled: "danger",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  webpay: "Webpay (débito, crédito o prepago)",
  transfer: "Transferencia bancaria",
};

export const PAYMENT_METHOD_SHORT: Record<PaymentMethod, string> = {
  webpay: "Webpay",
  transfer: "Transferencia",
};

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "Nueva",
  contacted: "Contactado",
  scheduled: "Agendado",
  closed: "Cerrada",
};

export const INQUIRY_STATUS_TONES: Record<InquiryStatus, Tone> = {
  new: "brand",
  contacted: "info",
  scheduled: "warning",
  closed: "neutral",
};

/** Transiciones permitidas desde el panel de administración. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["processing", "shipped", "delivered", "cancelled"],
  processing: ["shipped", "delivered", "cancelled"],
  shipped: ["delivered", "cancelled"],
  // Cancelar un pedido entregado sirve para registrar devoluciones (repone el stock).
  delivered: ["cancelled"],
  cancelled: [],
};

/** Tipos de pago informados por Webpay (payment_type_code). */
export const WEBPAY_PAYMENT_TYPES: Record<string, string> = {
  VD: "Venta débito",
  VN: "Venta normal (crédito)",
  VC: "Venta en cuotas",
  SI: "3 cuotas sin interés",
  S2: "2 cuotas sin interés",
  NC: "N cuotas sin interés",
  VP: "Venta prepago",
};
