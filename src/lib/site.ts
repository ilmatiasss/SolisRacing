/**
 * URL pública del sitio, sin "/" final. Usa NEXT_PUBLIC_SITE_URL o, en Vercel, el dominio de
 * producción del proyecto. Tolera que la variable se escriba sin "https://" (ej. "tienda.cl").
 */
export function siteUrl(): string {
  for (const raw of [process.env.NEXT_PUBLIC_SITE_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) {
    const value = raw?.trim();
    if (!value) continue;
    try {
      const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
      return `${url.origin}${url.pathname}`.replace(/\/+$/, "");
    } catch {
      // Valor inválido: se prueba la siguiente opción.
    }
  }
  return "http://localhost:3000";
}
