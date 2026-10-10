/*
 * Agenda de servicios: fechas en formato YYYY-MM-DD según la hora de Chile.
 * Por ahora la disponibilidad es fija (lunes a sábado, horarios de abajo, hasta 60 días);
 * el cliente envía una solicitud y la tienda la confirma por WhatsApp.
 */

export const BOOKING_TIME_ZONE = "America/Santiago";
/** Días hacia adelante que se pueden pedir. */
export const BOOKING_MAX_DAYS = 60;
/** Horarios que se ofrecen (dentro del horario de atención de la tienda). */
export const BOOKING_TIMES = {
  "Mañana": ["10:00", "11:00", "12:00"],
  "Tarde": ["15:00", "16:00", "17:00"],
} as const;
export const ALL_BOOKING_TIMES: readonly string[] = Object.values(BOOKING_TIMES).flat();

export type ServiceLocation = { name: string; detail: string };

/** Lee los lugares de atención del panel: uno por línea, `nombre | detalle` (el detalle es opcional). */
export function parseServiceLocations(text: string): ServiceLocation[] {
  const locations: ServiceLocation[] = [];
  for (const line of text.split("\n")) {
    const [name = "", detail = ""] = line.split("|").map((part) => part.trim());
    if (name && !locations.some((location) => location.name === name)) locations.push({ name, detail });
  }
  return locations;
}

/** Fecha de hoy en Chile, como YYYY-MM-DD. */
export function todayInChile(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BOOKING_TIME_ZONE }).format(now);
}

function toUtc(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(iso: string, days: number): string {
  const date = toUtc(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Día de la semana: 0 = domingo … 6 = sábado. */
export function weekday(iso: string): number {
  return toUtc(iso).getUTCDay();
}

export function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && toUtc(value).toISOString().slice(0, 10) === value;
}

/** Se puede pedir desde mañana hasta BOOKING_MAX_DAYS días, salvo domingos. */
export function isBookableDate(iso: string, today: string): boolean {
  return isValidIsoDate(iso) && iso > today && iso <= addDays(today, BOOKING_MAX_DAYS) && weekday(iso) !== 0;
}

/** "sábado 17 de octubre" */
export function formatBookingDate(iso: string): string {
  return new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    toUtc(iso),
  );
}

/** Días del mes (YYYY-MM) para dibujar el calendario, con huecos (null) antes del día 1 para partir en lunes. */
export function monthGrid(month: string): (string | null)[] {
  const first = `${month}-01`;
  const offset = (weekday(first) + 6) % 7;
  const days: (string | null)[] = Array.from({ length: offset }, () => null);
  for (let day = first; day.startsWith(month); day = addDays(day, 1)) days.push(day);
  return days;
}

/** "Octubre de 2026" */
export function formatMonth(month: string): string {
  const text = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    toUtc(`${month}-01`),
  );
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function shiftMonth(month: string, delta: number): string {
  const date = toUtc(`${month}-01`);
  date.setUTCMonth(date.getUTCMonth() + delta);
  return date.toISOString().slice(0, 7);
}
