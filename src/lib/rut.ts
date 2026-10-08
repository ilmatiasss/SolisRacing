/**
 * Utilidades para el RUT chileno (Rol Único Tributario).
 * El dígito verificador se calcula con el algoritmo módulo 11.
 */

/** Quita puntos, guion y espacios; deja el dígito verificador en mayúscula. */
export function cleanRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, "").toUpperCase();
}

export function computeRutVerifier(body: string): string {
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  if (remainder === 11) return "0";
  if (remainder === 10) return "K";
  return String(remainder);
}

export function isValidRut(rut: string): boolean {
  const clean = cleanRut(rut);
  if (clean.length < 2) return false;
  const body = clean.slice(0, -1);
  const verifier = clean.slice(-1);
  if (!/^\d{1,8}$/.test(body)) return false;
  if (Number(body) < 1_000_000) return false;
  return computeRutVerifier(body) === verifier;
}

/** "123456785" → "12.345.678-5" */
export function formatRut(rut: string): string {
  const clean = cleanRut(rut);
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const verifier = clean.slice(-1);
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${withDots}-${verifier}`;
}
