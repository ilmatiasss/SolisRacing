const clpFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("es-CL", {
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Santiago",
});

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "long",
  timeZone: "America/Santiago",
});

/** Formatea un monto en pesos chilenos: 1290000 → "$1.290.000". */
export function formatCLP(amount: number): string {
  return clpFormatter.format(Math.round(amount));
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatDateTime(value: Date | string): string {
  return dateTimeFormatter.format(new Date(value));
}

export function formatDate(value: Date | string): string {
  return dateFormatter.format(new Date(value));
}

/** Número de pedido visible para el cliente: 1001 → "SR-1001". */
export function formatOrderNumber(id: number): string {
  return `SR-${id}`;
}

/** Acepta "SR-1001", "sr1001" o "1001" y devuelve 1001. */
export function parseOrderNumber(input: string): number | null {
  const match = input.trim().match(/^(?:sr-?)?(\d{1,9})$/i);
  return match ? Number(match[1]) : null;
}

/** Porcentaje de descuento entre el precio anterior y el actual. */
export function discountPercent(price: number, compareAtPrice: number | null | undefined): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

/** Parsea montos escritos por personas: "$1.290.000", "1290000", "1.290.000". */
export function parseCLP(input: string): number | null {
  const digits = input.replace(/[^\d]/g, "");
  if (!digits) return null;
  const value = Number(digits);
  return Number.isSafeInteger(value) ? value : null;
}

/** Deja solo dígitos de un teléfono chileno y agrega el 56 si falta. */
export function normalizeChileanPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("56") && digits.length > 9) return digits;
  return `56${digits}`;
}

export function whatsappLink(phone: string, message?: string): string {
  const number = normalizeChileanPhone(phone);
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${text}`;
}
