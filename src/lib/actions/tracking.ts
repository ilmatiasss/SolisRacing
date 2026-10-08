"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { parseOrderNumber } from "@/lib/format";

export type TrackingState = { error?: string };

/** Busca el pedido por número + correo y lleva al cliente a su página de seguimiento. */
export async function trackOrder(_prev: TrackingState, formData: FormData): Promise<TrackingState> {
  const orderId = parseOrderNumber(String(formData.get("number") ?? ""));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!orderId || !email) return { error: "Ingresa tu número de pedido y el correo con que compraste." };

  const [order] = await db
    .select({ id: orders.id, publicToken: orders.publicToken })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.customerEmail, email)));
  if (!order) return { error: "No encontramos un pedido con esos datos. Revisa el número y el correo." };
  redirect(`/pedido/${order.id}?t=${order.publicToken}`);
}
