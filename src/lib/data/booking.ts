import "server-only";
import { and, asc, eq, gte, ne } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { addDays, todayInChile, type TakenSlot } from "../booking";
import { db } from "../db";
import { inquiries } from "../db/schema";

/** Se invalida al pedir una hora y al cambiar o borrar solicitudes en el panel. */
export const BOOKINGS_TAG = "bookings";

/** Horas ya pedidas desde ayer en adelante (cacheado para la página pública de servicios). */
export async function getTakenSlots(): Promise<TakenSlot[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(BOOKINGS_TAG);
  return readTakenSlots();
}

/** Lectura directa, sin caché: para validar una hora antes de guardarla. */
export async function readTakenSlots(): Promise<TakenSlot[]> {
  const rows = await db
    .select({ location: inquiries.location, date: inquiries.preferredDate, time: inquiries.preferredTime })
    .from(inquiries)
    .where(
      and(
        eq(inquiries.kind, "service"),
        ne(inquiries.status, "closed"),
        gte(inquiries.preferredDate, addDays(todayInChile(), -1)),
      ),
    );
  return rows.flatMap(({ location, date, time }) => (location && date && time ? [{ location, date, time }] : []));
}

/** Próximas horas pedidas (no cerradas), en orden, para el panel. */
export async function listUpcomingBookings() {
  return db
    .select({
      id: inquiries.id,
      date: inquiries.preferredDate,
      time: inquiries.preferredTime,
      location: inquiries.location,
      serviceName: inquiries.serviceName,
      name: inquiries.name,
      phone: inquiries.phone,
      vehicle: inquiries.vehicle,
      status: inquiries.status,
    })
    .from(inquiries)
    .where(and(eq(inquiries.kind, "service"), ne(inquiries.status, "closed"), gte(inquiries.preferredDate, todayInChile())))
    .orderBy(asc(inquiries.preferredDate), asc(inquiries.preferredTime))
    .limit(200);
}
