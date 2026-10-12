/*
 * Agenda de servicios: fechas en formato YYYY-MM-DD según la hora de Chile.
 * La disponibilidad se configura en el panel (Agenda): por lugar, todas las semanas en ciertos días
 * o solo en fechas de visita, con sus horarios y días bloqueados. Una hora pedida (solicitud no
 * cerrada) deja de ofrecerse. El cliente envía una solicitud y la tienda la confirma por WhatsApp.
 */

export const BOOKING_TIME_ZONE = "America/Santiago";
/** Días hacia adelante que se pueden pedir, por defecto. */
export const BOOKING_MAX_DAYS = 60;
export const DEFAULT_BOOKING_TIMES = ["10:00", "11:00", "12:00", "15:00", "16:00", "17:00"];
/** Lunes a sábado (0 = domingo … 6 = sábado). */
export const DEFAULT_BOOKING_WEEKDAYS = [1, 2, 3, 4, 5, 6];
export const WEEKDAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export type ServiceLocation = { name: string; detail: string };

export type BookingLocation = ServiceLocation & {
  /** `weekly`: todas las semanas en `weekdays`. `dates`: solo en las fechas de visita de `dates`. */
  mode: "weekly" | "dates";
  weekdays: number[];
  times: string[];
  dates: string[];
  /** Días sin atención (feriados, vacaciones, viajes). */
  blocked: string[];
};

export type BookingConfig = { maxDays: number; locations: BookingLocation[] };

/** Hora ya pedida: no se vuelve a ofrecer. */
export type TakenSlot = { location: string; date: string; time: string };

export function weeklyLocation(name: string, detail = ""): BookingLocation {
  return { name, detail, mode: "weekly", weekdays: [...DEFAULT_BOOKING_WEEKDAYS], times: [...DEFAULT_BOOKING_TIMES], dates: [], blocked: [] };
}

export const DEFAULT_BOOKING: BookingConfig = {
  maxDays: BOOKING_MAX_DAYS,
  locations: [
    weeklyLocation("Antofagasta", "En la tienda, Ausonia 244"),
    weeklyLocation("Región de Valparaíso", "En visitas programadas a la Quinta Región"),
  ],
};

/** Lee los lugares del formato antiguo (`nombre | detalle`, uno por línea). */
export function parseServiceLocations(text: string): ServiceLocation[] {
  const locations: ServiceLocation[] = [];
  for (const line of text.split("\n")) {
    const [name = "", detail = ""] = line.split("|").map((part) => part.trim());
    if (name && !locations.some((location) => location.name === name)) locations.push({ name, detail });
  }
  return locations;
}

/** "9:30" → "09:30"; inválida → null. */
export function normalizeTime(value: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

const uniqueSorted = <T,>(values: T[]) => [...new Set(values)].sort();
const stringList = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);

/** Limpia la configuración guardada (o enviada desde el panel): descarta lo inválido. */
export function normalizeBookingConfig(raw: unknown): BookingConfig {
  const source = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const maxDays = Number.isInteger(source.maxDays) ? Math.min(Math.max(source.maxDays as number, 7), 180) : BOOKING_MAX_DAYS;
  const locations: BookingLocation[] = [];
  for (const item of Array.isArray(source.locations) ? source.locations : []) {
    if (typeof item !== "object" || item === null) continue;
    const entry = item as Record<string, unknown>;
    const name = typeof entry.name === "string" ? entry.name.trim().slice(0, 80) : "";
    if (!name || locations.some((location) => location.name === name)) continue;
    locations.push({
      name,
      detail: typeof entry.detail === "string" ? entry.detail.trim().slice(0, 160) : "",
      mode: entry.mode === "dates" ? "dates" : "weekly",
      weekdays: uniqueSorted(
        (Array.isArray(entry.weekdays) ? entry.weekdays : []).filter(
          (day): day is number => Number.isInteger(day) && (day as number) >= 0 && (day as number) <= 6,
        ),
      ),
      times: uniqueSorted(stringList(entry.times).map(normalizeTime).filter((time): time is string => time !== null)),
      dates: uniqueSorted(stringList(entry.dates).filter(isValidIsoDate)),
      blocked: uniqueSorted(stringList(entry.blocked).filter(isValidIsoDate)),
    });
  }
  return { maxDays, locations: locations.length > 0 ? locations : DEFAULT_BOOKING.locations };
}

/** ¿El lugar atiende ese día? (sin contar horas tomadas) */
export function isDayOffered(location: BookingLocation, date: string, today: string, maxDays: number): boolean {
  if (!isValidIsoDate(date) || date <= today || date > addDays(today, maxDays)) return false;
  if (location.blocked.includes(date)) return false;
  return location.mode === "dates" ? location.dates.includes(date) : location.weekdays.includes(weekday(date));
}

/** Horas libres de un lugar en un día: las configuradas, menos las ya pedidas. */
export function availableTimes(
  location: BookingLocation,
  date: string,
  today: string,
  maxDays: number,
  taken: TakenSlot[],
): string[] {
  if (!isDayOffered(location, date, today, maxDays)) return [];
  const busy = new Set(taken.filter((slot) => slot.location === location.name && slot.date === date).map((slot) => slot.time));
  return location.times.filter((time) => !busy.has(time));
}

/** Separa las horas en mañana y tarde (desde las 14:00). */
export function groupTimes(times: string[]): { label: string; times: string[] }[] {
  return [
    { label: "Mañana", times: times.filter((time) => time < "14:00") },
    { label: "Tarde", times: times.filter((time) => time >= "14:00") },
  ].filter((group) => group.times.length > 0);
}

/** "lunes a sábado", "martes y jueves", "lunes, miércoles y viernes". */
export function describeWeekdays(days: number[]): string {
  const order = [1, 2, 3, 4, 5, 6, 0].filter((day) => days.includes(day));
  if (order.length === 0) return "";
  if (order.length === 7) return "todos los días";
  const positions = order.map((day) => (day + 6) % 7);
  const consecutive = order.length >= 3 && positions.every((position, index) => index === 0 || position === positions[index - 1] + 1);
  if (consecutive) return `${WEEKDAY_NAMES[order[0]]} a ${WEEKDAY_NAMES[order[order.length - 1]]}`;
  const names = order.map((day) => WEEKDAY_NAMES[day]);
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
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
