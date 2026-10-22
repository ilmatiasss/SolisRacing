import type { DeliveryMethod, OrderStatus } from "./db/schema";

/*
 * «Qué hacer ahora» en el detalle de un pedido del panel: en qué etapa va y cuál es el siguiente
 * paso, en palabras simples.
 */

export type OrderGuideInput = {
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
  /** Pagado en el ambiente de pruebas o simulación de Webpay (no es dinero real). */
  testPayment?: boolean;
};

export type OrderNextStep = { title: string; text: string; tone: "action" | "wait" | "done" | "warning" };

export type OrderStage = { label: string; state: "done" | "current" | "todo" };

/** Etapas del pedido para la barra de avance (vacía si está cancelado). */
export function orderStages({ status, deliveryMethod }: Pick<OrderGuideInput, "status" | "deliveryMethod">): OrderStage[] {
  if (status === "cancelled") return [];
  const pickup = deliveryMethod === "pickup";
  const labels = ["Pago", "Preparación", pickup ? "Listo para retiro" : "Enviado", pickup ? "Retirado" : "Entregado"];
  const current = { pending: 0, paid: 1, processing: 1, shipped: 3, delivered: 4 }[status];
  return labels.map((label, index) => ({
    label,
    state: index < current ? "done" : index === current ? "current" : "todo",
  }));
}

export function orderNextStep({ status, deliveryMethod, testPayment }: OrderGuideInput): OrderNextStep {
  const pickup = deliveryMethod === "pickup";
  if (testPayment && status !== "cancelled") {
    return {
      tone: "warning",
      title: "Pedido de prueba: no lo despaches",
      text: "Se pagó con las tarjetas de prueba de Webpay, no con dinero real. Cámbialo a «Cancelado» para devolver el stock al catálogo.",
    };
  }
  switch (status) {
    case "pending":
      return {
        tone: "wait",
        title: "Esperando el pago en Webpay",
        text: "El cliente está pagando o dejó el pago a medias. No tienes que hacer nada: si no paga, el pedido se cancela solo.",
      };
    case "paid":
    case "processing":
      return pickup
        ? {
            tone: "action",
            title: status === "paid" ? "Prepara el pedido para retiro" : "Avísale que puede retirar",
            text: "Junta los productos y, cuando estén listos, cambia el estado a «Listo para retiro»: el cliente recibe el aviso para ir a la tienda.",
          }
        : {
            tone: "action",
            title: status === "paid" ? "Prepara y despacha el pedido" : "Despacha el pedido",
            text:
              "Empaca los productos y llévalos al courier. Luego cambia el estado a «Enviado», elige el courier y escribe el n° de seguimiento: el cliente lo recibe por correo." +
              (deliveryMethod === "shipping_collect" ? " Este despacho es por pagar: lo paga el cliente al recibir." : ""),
          };
    case "shipped":
      return {
        tone: "wait",
        title: pickup ? "Esperando que lo retire" : "En camino al cliente",
        text: pickup
          ? "Cuando el cliente pase a buscarlo, cambia el estado a «Retirado»."
          : "Cuando el cliente lo reciba (o el courier lo marque entregado), cambia el estado a «Entregado».",
      };
    case "delivered":
      return {
        tone: "done",
        title: "Pedido terminado",
        text: "No hay nada pendiente. Si el cliente devuelve productos, elige «Cancelado» para registrar la devolución y reponer el stock.",
      };
    case "cancelled":
      return {
        tone: "done",
        title: "Pedido cancelado",
        text: "El stock ya volvió al catálogo. Si el cliente había pagado, recuerda devolverle el dinero desde el portal de Transbank.",
      };
  }
}
