import "server-only";
import { readStoreSettings } from "./data/settings";
import { sendEmail } from "./email";
import { newOrderAdminEmail, orderReceivedEmail, orderStatusEmail } from "./email-templates";
import { getOrderById } from "./orders";

/** Correo al cliente ("pedido recibido" o "pago confirmado") y aviso a la tienda. */
export async function notifyNewOrder(orderId: number) {
  const [order, settings] = await Promise.all([getOrderById(orderId), readStoreSettings()]);
  if (!order) return;
  const customer = orderReceivedEmail(order, settings);
  const admin = newOrderAdminEmail(order, settings);
  await Promise.all([
    sendEmail({ to: order.customerEmail, replyTo: settings.email || undefined, ...customer }),
    settings.email ? sendEmail({ to: settings.email, replyTo: order.customerEmail, ...admin }) : null,
  ]);
}

/** Correo al cliente cuando la tienda cambia el estado del pedido. */
export async function notifyOrderStatus(orderId: number) {
  const [order, settings] = await Promise.all([getOrderById(orderId), readStoreSettings()]);
  if (!order) return;
  const email = orderStatusEmail(order, settings);
  if (email) await sendEmail({ to: order.customerEmail, replyTo: settings.email || undefined, ...email });
}
