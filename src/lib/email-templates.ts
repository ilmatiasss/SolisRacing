import "server-only";
import { getRegion } from "./chile";
import type { DeliveryMethod, InquiryKind, OrderStatus, PaymentMethod } from "./db/schema";
import { formatCLP, formatOrderNumber } from "./format";
import { inquiryTitle, orderStatusLabel } from "./order-status";
import type { StoreSettings } from "./settings";
import { DELIVERY_METHOD_LABELS } from "./shipping";
import { siteUrl } from "./site";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const e = escapeHtml;

type EmailContent = { subject: string; html: string; text: string };

function layout(settings: StoreSettings, title: string, body: string): string {
  return `<!doctype html>
<html lang="es">
<body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">
        <tr><td style="background:#09090b;padding:20px 28px;border-bottom:4px solid #e10600">
          <span style="font-size:22px;font-weight:800;font-style:italic;letter-spacing:1px;color:#ffffff;text-transform:uppercase">${e(settings.storeName.split(" ")[0] ?? settings.storeName)}</span>
          <span style="font-size:22px;font-weight:800;font-style:italic;letter-spacing:1px;color:#e10600;text-transform:uppercase"> ${e(settings.storeName.split(" ").slice(1).join(" "))}</span>
        </td></tr>
        <tr><td style="padding:28px">
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3">${e(title)}</h1>
          ${body}
        </td></tr>
        <tr><td style="background:#fafafa;padding:20px 28px;font-size:12px;color:#71717a;line-height:1.6">
          ${e(settings.storeName)} · ${e(settings.address)}, ${e(settings.city)}<br>
          ${[settings.email, settings.whatsapp && `WhatsApp ${settings.whatsapp}`].filter(Boolean).map((v) => e(String(v))).join(" · ")}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string) {
  return `<p style="margin:24px 0"><a href="${e(href)}" style="display:inline-block;background:#e10600;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px">${e(label)}</a></p>`;
}

function paragraph(text: string) {
  return `<p style="margin:0 0 12px;font-size:15px;line-height:1.6">${text}</p>`;
}

export type EmailOrder = {
  id: number;
  publicToken: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingRegion: string | null;
  shippingCommune: string | null;
  shippingAddress: string | null;
  shippingAddress2: string | null;
  subtotal: number;
  shippingCost: number;
  total: number;
  trackingCourier: string | null;
  trackingNumber: string | null;
  cancelReason?: string | null;
  items: { productName: string; quantity: number; unitPrice: number; lineTotal: number }[];
};

export function orderUrl(order: Pick<EmailOrder, "id" | "publicToken">) {
  return `${siteUrl()}/pedido/${order.id}?t=${order.publicToken}`;
}

function itemsTable(order: EmailOrder) {
  const rows = order.items
    .map(
      (item) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;font-size:14px">${e(item.productName)} × ${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;font-size:14px;text-align:right;white-space:nowrap">${formatCLP(item.lineTotal)}</td>
      </tr>`,
    )
    .join("");
  const shipping =
    order.deliveryMethod === "shipping"
      ? order.shippingCost > 0
        ? formatCLP(order.shippingCost)
        : "Gratis"
      : order.deliveryMethod === "shipping_collect"
        ? "Por pagar al recibir"
        : "Retiro en tienda";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0">
    ${rows}
    <tr><td style="padding:8px 0;font-size:14px;color:#71717a">Subtotal</td><td style="padding:8px 0;font-size:14px;text-align:right">${formatCLP(order.subtotal)}</td></tr>
    <tr><td style="padding:4px 0;font-size:14px;color:#71717a">Despacho</td><td style="padding:4px 0;font-size:14px;text-align:right">${e(shipping)}</td></tr>
    <tr><td style="padding:8px 0;font-size:16px;font-weight:bold">Total</td><td style="padding:8px 0;font-size:16px;font-weight:bold;text-align:right">${formatCLP(order.total)}</td></tr>
  </table>`;
}

function deliveryText(order: EmailOrder, settings: StoreSettings) {
  if (order.deliveryMethod === "pickup") {
    return `Retiro en tienda: ${settings.shipping.pickupAddress}`;
  }
  const region = getRegion(order.shippingRegion)?.name ?? order.shippingRegion ?? "";
  const address = [order.shippingAddress, order.shippingAddress2].filter(Boolean).join(", ");
  return `${DELIVERY_METHOD_LABELS[order.deliveryMethod]}: ${address}, ${order.shippingCommune ?? ""}, ${region}`;
}

export function orderReceivedEmail(order: EmailOrder, settings: StoreSettings): EmailContent {
  const number = formatOrderNumber(order.id);
  const subject = `Confirmación de tu pedido ${number}`;
  const intro = `Hola ${e(order.customerName)}, ¡gracias por tu compra! Tu pago fue aprobado y ya estamos preparando tu pedido <strong>${number}</strong>.`;
  const html = layout(
    settings,
    "¡Pago confirmado!",
    paragraph(intro) +
      itemsTable(order) +
      paragraph(e(deliveryText(order, settings))) +
      button(orderUrl(order), "Ver mi pedido"),
  );
  const text = `Pago confirmado · ${number}\nTotal: ${formatCLP(order.total)}\n${deliveryText(order, settings)}\nVer pedido: ${orderUrl(order)}`;
  return { subject, html, text };
}

export function orderStatusEmail(order: EmailOrder, settings: StoreSettings): EmailContent | null {
  const number = formatOrderNumber(order.id);
  const pickup = order.deliveryMethod === "pickup";
  const label = orderStatusLabel(order.status, pickup);
  let message: string;
  switch (order.status) {
    case "paid":
      message = `Confirmamos el pago de tu pedido <strong>${number}</strong>. Ya lo estamos preparando.`;
      break;
    case "processing":
      message = `Tu pedido <strong>${number}</strong> está en preparación.`;
      break;
    case "shipped":
      if (pickup) {
        message = `Tu pedido <strong>${number}</strong> está listo para retiro en ${e(settings.shipping.pickupAddress)}. ${e(settings.shipping.pickupInstructions)}`;
      } else {
        const tracking =
          order.trackingNumber && order.trackingCourier
            ? ` Lo enviamos por <strong>${e(order.trackingCourier)}</strong> con el número de seguimiento <strong>${e(order.trackingNumber)}</strong>.`
            : "";
        message = `¡Tu pedido <strong>${number}</strong> va en camino!${tracking}`;
      }
      break;
    case "delivered":
      message = `Tu pedido <strong>${number}</strong> fue entregado. ¡Gracias por confiar en nosotros! Si necesitas instalación o programación, escríbenos y lo coordinamos.`;
      break;
    case "cancelled":
      message = `Tu pedido <strong>${number}</strong> fue cancelado.${order.cancelReason ? ` Motivo: ${e(order.cancelReason)}.` : ""} Si tienes dudas, contáctanos.`;
      break;
    default:
      return null;
  }
  return {
    subject: `Pedido ${number}: ${label}`,
    html: layout(settings, label, paragraph(message) + button(orderUrl(order), "Ver mi pedido")),
    text: `Pedido ${number}: ${label}\n${message.replace(/<[^>]+>/g, "")}\n${orderUrl(order)}`,
  };
}

export function newOrderAdminEmail(order: EmailOrder, settings: StoreSettings): EmailContent {
  const number = formatOrderNumber(order.id);
  const status = order.status === "paid" ? "pagado con Webpay" : "pago pendiente";
  const adminUrl = `${siteUrl()}/admin/pedidos/${order.id}`;
  return {
    subject: `Nuevo pedido ${number} (${status}) · ${formatCLP(order.total)}`,
    html: layout(
      settings,
      `Nuevo pedido ${number}`,
      paragraph(
        `Cliente: <strong>${e(order.customerName)}</strong> · ${e(order.customerEmail)} · ${e(order.customerPhone)}`,
      ) +
        paragraph(`Estado: <strong>${e(status)}</strong>`) +
        itemsTable(order) +
        paragraph(e(deliveryText(order, settings))) +
        button(adminUrl, "Abrir en el panel"),
    ),
    text: `Nuevo pedido ${number} (${status})\n${order.customerName} · ${order.customerEmail}\nTotal: ${formatCLP(order.total)}\n${adminUrl}`,
  };
}

export function inquiryAdminEmail(
  inquiry: {
    id: number;
    kind: InquiryKind;
    serviceName: string | null;
    name: string;
    email: string;
    phone: string | null;
    vehicle: string | null;
    preferredDate: string | null;
    preferredTime: string | null;
    location: string | null;
    message: string | null;
  },
  settings: StoreSettings,
): EmailContent {
  const title =
    inquiry.kind === "service"
      ? `Solicitud de servicio: ${inquiry.serviceName ?? "Servicio"}`
      : inquiry.kind === "harness"
        ? "Cotización de ramal a medida"
        : inquiry.kind === "contact"
          ? "Nuevo mensaje de contacto"
          : inquiryTitle(inquiry.kind, inquiry.serviceName);
  const lines = [
    ["Nombre", inquiry.name],
    ["Correo", inquiry.email],
    ["Teléfono", inquiry.phone],
    ["Vehículo", inquiry.vehicle],
    ["Lugar", inquiry.location],
    ["Fecha pedida", inquiry.preferredDate],
    ["Hora pedida", inquiry.preferredTime],
    ["Mensaje", inquiry.message],
  ].filter((line): line is [string, string] => Boolean(line[1]));
  const adminUrl = `${siteUrl()}/admin/solicitudes`;
  return {
    subject: `${title} · ${inquiry.name}`,
    html: layout(
      settings,
      title,
      lines.map(([label, value]) => paragraph(`<strong>${e(label)}:</strong> ${e(value)}`)).join("") +
        button(adminUrl, "Ver en el panel"),
    ),
    text: `${title}\n${lines.map(([l, v]) => `${l}: ${v}`).join("\n")}\n${adminUrl}`,
  };
}
