import { revalidateTag } from "next/cache";
import { after, NextResponse, type NextRequest } from "next/server";
import { CATALOG_TAG } from "@/lib/data/catalog";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { parseOrderNumber } from "@/lib/format";
import { notifyNewOrder } from "@/lib/order-notifications";
import {
  cancelOrder,
  findOrderByWebpayToken,
  markOrderPaid,
  safeEqual,
  webpayBuyOrder,
  webpaySessionId,
  type Order,
} from "@/lib/orders";
import {
  commitWebpayTransaction,
  getWebpayTransactionStatus,
  isApproved,
} from "@/lib/payments/webpay";
import { eq } from "drizzle-orm";

/**
 * Retorno desde Webpay Plus. Transbank redirige al cliente aquí (GET o POST) en 4 casos:
 *  1. Pago finalizado:              token_ws
 *  2. Pago anulado por el cliente:  TBK_TOKEN + TBK_ORDEN_COMPRA + TBK_ID_SESION
 *  3. Tiempo agotado en el form:    TBK_ORDEN_COMPRA + TBK_ID_SESION
 *  4. Error en el formulario:       token_ws + TBK_TOKEN + TBK_ORDEN_COMPRA + TBK_ID_SESION
 */
export async function GET(request: NextRequest) {
  return handleReturn(request, request.nextUrl.searchParams);
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const params = new URLSearchParams();
  for (const [key, value] of form) if (typeof value === "string") params.set(key, value);
  return handleReturn(request, params);
}

function orderPage(request: NextRequest, order: Pick<Order, "id" | "publicToken">, result?: string) {
  const url = new URL(`/pedido/${order.id}`, request.url);
  url.searchParams.set("t", order.publicToken);
  if (result) url.searchParams.set("pago", result);
  return NextResponse.redirect(url, 303);
}

function errorPage(request: NextRequest) {
  return NextResponse.redirect(new URL("/pago/error", request.url), 303);
}

async function handleReturn(request: NextRequest, params: URLSearchParams) {
  const tokenWs = params.get("token_ws");
  const tbkToken = params.get("TBK_TOKEN");
  const tbkOrder = params.get("TBK_ORDEN_COMPRA");
  const tbkSession = params.get("TBK_ID_SESION");

  // Casos 2 y 4: el cliente anuló o hubo un error en el formulario de pago.
  if (tbkToken) {
    const order = await findOrderByWebpayToken(tbkToken);
    if (!order) return errorPage(request);
    if (order.status === "pending") {
      await cancelOrder(order.id, "Pago anulado en Webpay", {
        publicMessage: "El pago fue anulado en Webpay y el pedido se canceló.",
      });
      revalidateTag(CATALOG_TAG, "max");
    }
    return orderPage(request, order, "anulado");
  }

  // Caso 3: tiempo agotado. Se valida que la sesión corresponda al pedido.
  if (!tokenWs) {
    const orderId = tbkOrder ? parseOrderNumber(tbkOrder) : null;
    if (!orderId || !tbkSession) return errorPage(request);
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order || !safeEqual(webpaySessionId(order), tbkSession)) return errorPage(request);
    if (order.status === "pending") {
      await cancelOrder(order.id, "Tiempo de pago agotado en Webpay", {
        publicMessage: "Se agotó el tiempo para pagar en Webpay y el pedido se canceló.",
      });
      revalidateTag(CATALOG_TAG, "max");
    }
    return orderPage(request, order, "expirado");
  }

  // Caso 1: pago finalizado, hay que confirmarlo (commit) con Transbank.
  const order = await findOrderByWebpayToken(tokenWs);
  if (!order) return errorPage(request);
  if (order.status !== "pending") {
    // El cliente recargó la página de retorno: el pedido ya fue procesado.
    return orderPage(request, order);
  }

  let result;
  try {
    result = await commitWebpayTransaction(tokenWs);
  } catch (commitError) {
    // Puede pasar si el commit ya se realizó: consultamos el estado real.
    try {
      result = await getWebpayTransactionStatus(tokenWs);
    } catch (statusError) {
      console.error("Webpay commit/status falló:", commitError, statusError);
      return orderPage(request, order, "error");
    }
  }

  const matches =
    result.amount === order.total &&
    result.buy_order === webpayBuyOrder(order.id) &&
    safeEqual(result.session_id ?? "", webpaySessionId(order));

  if (isApproved(result) && matches) {
    const { changed } = await markOrderPaid(order.id, {
      webpay: result,
      message: "Pago aprobado con Webpay.",
    });
    if (changed) after(() => notifyNewOrder(order.id));
    return orderPage(request, order, "aprobado");
  }

  if (isApproved(result) && !matches) {
    // Nunca debería ocurrir: se deja pendiente para revisión manual en el panel.
    console.error("Webpay aprobó un pago que no coincide con el pedido", order.id, result);
    await db
      .update(orders)
      .set({
        webpayResponse: result,
        adminNotes: "⚠️ Webpay aprobó un pago cuyo monto u orden no coincide. Revisar en el portal de Transbank.",
      })
      .where(eq(orders.id, order.id));
    return orderPage(request, order, "revision");
  }

  await cancelOrder(order.id, "Pago rechazado por Webpay", {
    webpay: result,
    publicMessage: "El pago fue rechazado por Webpay y el pedido se canceló.",
  });
  revalidateTag(CATALOG_TAG, "max");
  return orderPage(request, order, "rechazado");
}
