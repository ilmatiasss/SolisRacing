"use server";

import { eq } from "drizzle-orm";
import { refresh, revalidateTag } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/data/catalog";
import { db } from "@/lib/db";
import { orderEvents, orders } from "@/lib/db/schema";
import { notifyOrderStatus } from "@/lib/order-notifications";
import { changeOrderStatus } from "@/lib/orders";

export type OrderActionState = { ok?: boolean; error?: string; message?: string };

const statusSchema = z.object({
  orderId: z.coerce.number().int().positive(),
  status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled"]),
  note: z.string().trim().max(500).optional(),
  trackingCourier: z.string().trim().max(60).optional(),
  trackingNumber: z.string().trim().max(80).optional(),
  notify: z.literal("on").optional(),
});

export async function updateOrderStatus(_prev: OrderActionState, formData: FormData): Promise<OrderActionState> {
  const admin = await requireAdmin();
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Datos inválidos." };
  const { orderId, status, note, trackingCourier, trackingNumber, notify } = parsed.data;
  try {
    const result = await changeOrderStatus(orderId, status, {
      note: note || null,
      trackingCourier: trackingCourier || null,
      trackingNumber: trackingNumber || null,
    });
    if (!result.changed) return { error: "El pedido ya estaba en ese estado." };
    await db.insert(orderEvents).values({
      orderId,
      status,
      message: `Estado cambiado por ${admin.name}.`,
      public: false,
    });
    if (status === "cancelled") revalidateTag(CATALOG_TAG, "max");
    if (notify) after(() => notifyOrderStatus(orderId));
    refresh();
    return { ok: true, message: notify ? "Estado actualizado y cliente notificado." : "Estado actualizado." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo actualizar el pedido." };
  }
}

export async function saveOrderNotes(_prev: OrderActionState, formData: FormData): Promise<OrderActionState> {
  await requireAdmin();
  const parsed = z
    .object({
      orderId: z.coerce.number().int().positive(),
      adminNotes: z.string().trim().max(2000).optional(),
      trackingCourier: z.string().trim().max(60).optional(),
      trackingNumber: z.string().trim().max(80).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Datos inválidos." };
  const { orderId, adminNotes, trackingCourier, trackingNumber } = parsed.data;
  await db
    .update(orders)
    .set({
      adminNotes: adminNotes || null,
      trackingCourier: trackingCourier || null,
      trackingNumber: trackingNumber || null,
    })
    .where(eq(orders.id, orderId));
  refresh();
  return { ok: true, message: "Datos guardados." };
}
