import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, asc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "./db";
import {
  orderEvents,
  orderItems,
  orders,
  productImages,
  products,
  type DeliveryMethod,
  type DocumentType,
  type OrderStatus,
  type PaymentMethod,
  type WebpayCommitData,
} from "./db/schema";
import { formatOrderNumber } from "./format";
import { ORDER_STATUS_LABELS, ORDER_TRANSITIONS } from "./order-status";

export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;

export type StockIssue = { productId: number; name: string; requested: number; available: number };

export class StockError extends Error {
  constructor(public issues: StockIssue[]) {
    super("Stock insuficiente");
    this.name = "StockError";
  }
}

export type CreateOrderInput = {
  lines: { productId: number; quantity: number }[];
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  shippingCost: number;
  customer: { name: string; email: string; phone: string; rut: string | null };
  document: {
    type: DocumentType;
    companyName: string | null;
    companyRut: string | null;
    companyGiro: string | null;
    companyAddress: string | null;
  };
  shipping: {
    region: string | null;
    commune: string | null;
    address: string | null;
    address2: string | null;
  };
  notes: string | null;
};

/** Carga los productos del carrito con sus precios vigentes (nunca se confía en el precio del navegador). */
export async function loadCheckoutProducts(productIds: number[]) {
  if (productIds.length === 0) return [];
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      price: products.price,
      stock: products.stock,
      status: products.status,
    })
    .from(products)
    .where(inArray(products.id, productIds));
  const images = await db
    .select({ productId: productImages.productId, url: productImages.url })
    .from(productImages)
    .where(inArray(productImages.productId, productIds))
    .orderBy(asc(productImages.sortOrder), asc(productImages.id));
  const firstImage = new Map<number, string>();
  for (const image of images) if (!firstImage.has(image.productId)) firstImage.set(image.productId, image.url);
  return rows.map((row) => ({ ...row, imageUrl: firstImage.get(row.id) ?? null }));
}

/**
 * Crea el pedido y descuenta el stock en una sola transacción. Si algún producto no
 * tiene stock suficiente, no se crea nada y se lanza StockError con el detalle.
 */
export async function createOrder(input: CreateOrderInput) {
  const quantities = new Map<number, number>();
  for (const line of input.lines) {
    quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);
  }
  const productRows = await loadCheckoutProducts([...quantities.keys()]);
  const byId = new Map(productRows.map((p) => [p.id, p]));

  const issues: StockIssue[] = [];
  for (const [productId, quantity] of quantities) {
    const product = byId.get(productId);
    if (!product || product.status !== "active") {
      issues.push({ productId, name: product?.name ?? "Producto no disponible", requested: quantity, available: 0 });
    } else if (product.stock < quantity) {
      issues.push({ productId, name: product.name, requested: quantity, available: product.stock });
    }
  }
  if (issues.length) throw new StockError(issues);

  const items = [...quantities].map(([productId, quantity]) => {
    const product = byId.get(productId)!;
    return {
      productId,
      productName: product.name,
      productSku: product.sku,
      productSlug: product.slug,
      imageUrl: product.imageUrl,
      unitPrice: product.price,
      quantity,
      lineTotal: product.price * quantity,
    };
  });
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return db.transaction(async (tx) => {
    const raceIssues: StockIssue[] = [];
    for (const item of items) {
      // Descuento condicional: si otro cliente compró las últimas unidades, no se actualiza.
      const [updated] = await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${item.quantity}` })
        .where(
          and(
            eq(products.id, item.productId),
            eq(products.status, "active"),
            gte(products.stock, item.quantity),
          ),
        )
        .returning({ id: products.id });
      if (!updated) {
        const [current] = await tx
          .select({ stock: products.stock })
          .from(products)
          .where(eq(products.id, item.productId));
        raceIssues.push({
          productId: item.productId,
          name: item.productName,
          requested: item.quantity,
          available: current?.stock ?? 0,
        });
      }
    }
    if (raceIssues.length) throw new StockError(raceIssues);

    const [order] = await tx
      .insert(orders)
      .values({
        publicToken: randomBytes(24).toString("base64url"),
        status: "pending",
        paymentMethod: input.paymentMethod,
        deliveryMethod: input.deliveryMethod,
        customerName: input.customer.name,
        customerEmail: input.customer.email,
        customerPhone: input.customer.phone,
        customerRut: input.customer.rut,
        documentType: input.document.type,
        companyName: input.document.companyName,
        companyRut: input.document.companyRut,
        companyGiro: input.document.companyGiro,
        companyAddress: input.document.companyAddress,
        shippingRegion: input.shipping.region,
        shippingCommune: input.shipping.commune,
        shippingAddress: input.shipping.address,
        shippingAddress2: input.shipping.address2,
        customerNotes: input.notes,
        subtotal,
        shippingCost: input.shippingCost,
        total: subtotal + input.shippingCost,
      })
      .returning();

    await tx.insert(orderItems).values(items.map((item) => ({ ...item, orderId: order.id })));
    await tx.insert(orderEvents).values({
      orderId: order.id,
      status: "pending",
      message:
        input.paymentMethod === "webpay"
          ? "Pedido creado. Esperando el pago con Webpay."
          : "Pedido creado. Esperando la transferencia bancaria.",
    });
    return { order, items };
  });
}

export function webpayBuyOrder(orderId: number) {
  return formatOrderNumber(orderId);
}

/** Identificador de sesión para Webpay, derivado del token secreto del pedido. */
export function webpaySessionId(order: Pick<Order, "publicToken">) {
  return createHash("sha256").update(`webpay:${order.publicToken}`).digest("hex").slice(0, 40);
}

export function safeEqual(a: string, b: string) {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

export async function setWebpayToken(orderId: number, token: string) {
  await db.update(orders).set({ webpayToken: token }).where(eq(orders.id, orderId));
}

export async function getOrderById(orderId: number) {
  return db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      items: { orderBy: [asc(orderItems.id)] },
      events: { orderBy: [asc(orderEvents.createdAt), asc(orderEvents.id)] },
    },
  });
}

export type OrderWithItems = NonNullable<Awaited<ReturnType<typeof getOrderById>>>;

/** Pedido visible para el cliente solo si el token secreto coincide. */
export async function getOrderForCustomer(orderId: number, token: string) {
  const order = await getOrderById(orderId);
  if (!order || !token || !safeEqual(order.publicToken, token)) return null;
  return { ...order, events: order.events.filter((event) => event.public) };
}

export async function findOrderByWebpayToken(token: string) {
  const [order] = await db.select().from(orders).where(eq(orders.webpayToken, token));
  return order ?? null;
}

/** Marca un pedido como pagado. Es idempotente: si ya no está pendiente, no hace nada. */
export async function markOrderPaid(orderId: number, details: { webpay?: WebpayCommitData; message?: string }) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
    if (!order) throw new Error(`Pedido ${orderId} no existe`);
    if (order.status !== "pending") return { order, changed: false };
    const [updated] = await tx
      .update(orders)
      .set({ status: "paid", paidAt: new Date(), webpayResponse: details.webpay ?? order.webpayResponse })
      .where(eq(orders.id, orderId))
      .returning();
    await tx.insert(orderEvents).values({
      orderId,
      status: "paid",
      message: details.message ?? "Pago confirmado.",
    });
    return { order: updated, changed: true };
  });
}

/** Cancela un pedido y devuelve el stock reservado. Idempotente. */
export async function cancelOrder(
  orderId: number,
  reason: string,
  options: { webpay?: WebpayCommitData; publicMessage?: string } = {},
) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
    if (!order) throw new Error(`Pedido ${orderId} no existe`);
    if (order.status === "cancelled") return { order, changed: false };

    const items = await tx
      .select({ productId: orderItems.productId, quantity: orderItems.quantity })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
    for (const item of items) {
      if (!item.productId) continue;
      await tx
        .update(products)
        .set({ stock: sql`${products.stock} + ${item.quantity}` })
        .where(eq(products.id, item.productId));
    }

    const [updated] = await tx
      .update(orders)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: reason,
        webpayResponse: options.webpay ?? order.webpayResponse,
      })
      .where(eq(orders.id, orderId))
      .returning();
    await tx.insert(orderEvents).values({
      orderId,
      status: "cancelled",
      message: options.publicMessage ?? `Pedido cancelado: ${reason}.`,
    });
    return { order: updated, changed: true };
  });
}

/**
 * Cambia el estado desde el panel respetando las transiciones permitidas.
 * Cancelar repone stock; pasar a "pagado" registra la fecha de pago.
 */
export async function changeOrderStatus(
  orderId: number,
  status: OrderStatus,
  options: { note?: string | null; trackingCourier?: string | null; trackingNumber?: string | null } = {},
) {
  const current = await getOrderById(orderId);
  if (!current) throw new Error("El pedido no existe.");
  if (current.status === status) return { order: current, changed: false };
  if (!ORDER_TRANSITIONS[current.status].includes(status)) {
    throw new Error(
      `No se puede pasar de "${ORDER_STATUS_LABELS[current.status]}" a "${ORDER_STATUS_LABELS[status]}".`,
    );
  }
  if (status === "cancelled") {
    return cancelOrder(orderId, options.note?.trim() || "Cancelado por la tienda");
  }
  if (status === "paid") {
    return markOrderPaid(orderId, { message: options.note?.trim() || "Pago confirmado por la tienda." });
  }

  return db.transaction(async (tx) => {
    const now = new Date();
    const [updated] = await tx
      .update(orders)
      .set({
        status,
        shippedAt: status === "shipped" ? now : undefined,
        deliveredAt: status === "delivered" ? now : undefined,
        trackingCourier: options.trackingCourier ?? undefined,
        trackingNumber: options.trackingNumber ?? undefined,
      })
      .where(and(eq(orders.id, orderId), eq(orders.status, current.status)))
      .returning();
    if (!updated) throw new Error("El pedido cambió mientras lo editabas. Recarga la página.");
    const pickup = current.deliveryMethod === "pickup";
    const defaultMessages: Partial<Record<OrderStatus, string>> = {
      processing: "Estamos preparando tu pedido.",
      shipped: pickup
        ? "Tu pedido está listo para retiro en la tienda."
        : updated.trackingNumber
          ? `Pedido enviado por ${updated.trackingCourier ?? "courier"}. N° de seguimiento: ${updated.trackingNumber}.`
          : "Pedido enviado.",
      delivered: pickup ? "Pedido retirado." : "Pedido entregado.",
    };
    await tx.insert(orderEvents).values({
      orderId,
      status,
      message: options.note?.trim() || defaultMessages[status] || ORDER_STATUS_LABELS[status],
    });
    return { order: updated, changed: true };
  });
}

/**
 * Cancela pedidos con Webpay que quedaron pendientes (el cliente cerró la ventana de pago).
 * Transbank anula automáticamente las transacciones no confirmadas, así que es seguro.
 */
export async function expireAbandonedWebpayOrders(olderThanMinutes = 45) {
  const limit = new Date(Date.now() - olderThanMinutes * 60_000);
  const stale = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.status, "pending"), eq(orders.paymentMethod, "webpay"), lt(orders.createdAt, limit)));
  for (const { id } of stale) {
    await cancelOrder(id, "Pago con Webpay no completado", {
      publicMessage: "El pago con Webpay no se completó y el pedido fue cancelado.",
    });
  }
  return stale.length;
}
