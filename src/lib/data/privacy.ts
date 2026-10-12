import "server-only";
import { and, asc, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { db } from "../db";
import { inquiries, orderItems, orders } from "../db/schema";
import { INQUIRY_RETENTION_MONTHS, ORDER_RETENTION_YEARS } from "../privacy";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Todo lo que la tienda guarda de una persona, buscado por su correo (para acceso y portabilidad). */
export async function findPersonalData(email: string) {
  const address = normalizeEmail(email);
  const [orderRows, inquiryRows] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(eq(sql`lower(${orders.customerEmail})`, address))
      .orderBy(desc(orders.createdAt)),
    db.select().from(inquiries).where(eq(sql`lower(${inquiries.email})`, address)).orderBy(desc(inquiries.createdAt)),
  ]);
  const items =
    orderRows.length > 0
      ? await db
          .select()
          .from(orderItems)
          .where(inArray(orderItems.orderId, orderRows.map((order) => order.id)))
          .orderBy(asc(orderItems.id))
      : [];
  return { orders: orderRows, items, inquiries: inquiryRows };
}

/** Elimina las solicitudes y mensajes de una persona (los pedidos se conservan por ley tributaria). */
export async function deleteInquiriesByEmail(email: string) {
  const deleted = await db
    .delete(inquiries)
    .where(eq(sql`lower(${inquiries.email})`, normalizeEmail(email)))
    .returning({ id: inquiries.id });
  return deleted.length;
}

/**
 * Aplica los plazos de conservación de la política de privacidad: borra las solicitudes cerradas hace
 * más de INQUIRY_RETENTION_MONTHS y anonimiza los pedidos de más de ORDER_RETENTION_YEARS (se
 * conservan montos y productos para las estadísticas, sin datos de la persona).
 */
export async function purgeExpiredPersonalData() {
  const inquiryCutoff = sql`now() - make_interval(months => ${INQUIRY_RETENTION_MONTHS})`;
  const orderCutoff = sql`now() - make_interval(years => ${ORDER_RETENTION_YEARS})`;
  const [removed, anonymized] = await Promise.all([
    db
      .delete(inquiries)
      .where(and(eq(inquiries.status, "closed"), lt(inquiries.updatedAt, inquiryCutoff)))
      .returning({ id: inquiries.id }),
    db
      .update(orders)
      .set({
        customerName: "Cliente anonimizado",
        customerEmail: "anonimizado@invalid",
        customerPhone: "",
        customerRut: null,
        companyName: null,
        companyRut: null,
        companyGiro: null,
        companyAddress: null,
        shippingAddress: null,
        shippingAddress2: null,
        customerNotes: null,
        webpayResponse: null,
      })
      .where(and(lt(orders.createdAt, orderCutoff), sql`${orders.customerEmail} <> 'anonimizado@invalid'`))
      .returning({ id: orders.id }),
  ]);
  return { inquiries: removed.length, orders: anonymized.length };
}
