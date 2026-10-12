/*
 * Protección de datos personales (Ley 19.628, modificada por la Ley 21.719, vigente desde el
 * 1-12-2026). Derechos que el titular puede ejercer, plazos de respuesta y de conservación.
 * Estos plazos se muestran en la política de privacidad y en el panel: si cambian, cámbialos aquí.
 */

export const PRIVACY_RIGHTS = [
  { value: "acceso", label: "Acceso", description: "Saber qué datos tuyos tenemos, para qué y con quién los compartimos." },
  { value: "rectificacion", label: "Rectificación", description: "Corregir datos inexactos, desactualizados o incompletos." },
  { value: "supresion", label: "Supresión", description: "Que eliminemos tus datos, salvo los que la ley nos obliga a conservar." },
  { value: "oposicion", label: "Oposición", description: "Que dejemos de usar tus datos para un fin determinado." },
  { value: "portabilidad", label: "Portabilidad", description: "Recibir tus datos en un formato estructurado y de uso común." },
  { value: "bloqueo", label: "Bloqueo", description: "Suspender temporalmente el uso de tus datos mientras se resuelve otra solicitud." },
] as const;

export type PrivacyRight = (typeof PRIVACY_RIGHTS)[number]["value"];

/** Días corridos para responder una solicitud de derechos (prorrogables por igual plazo, avisando antes). */
export const PRIVACY_RESPONSE_DAYS = 30;
/** Las solicitudes y mensajes cerrados se eliminan solos pasado este plazo. */
export const INQUIRY_RETENTION_MONTHS = 24;
/** Los pedidos se conservan por las obligaciones tributarias (Código Tributario). */
export const ORDER_RETENTION_YEARS = 6;

export function privacyRightLabel(value: string): string {
  return PRIVACY_RIGHTS.find((right) => right.value === value)?.label ?? value;
}

/** Fecha límite para responder una solicitud de derechos recibida en `receivedAt`. */
export function privacyDeadline(receivedAt: Date): Date {
  return new Date(receivedAt.getTime() + PRIVACY_RESPONSE_DAYS * 86_400_000);
}
