/**
 * Si este servidor es el sitio publicado que ven los clientes. Decide cosas sensibles, como no
 * ofrecer Webpay de pruebas a clientes ni permitir el simulador de pagos.
 *
 * - En Vercel lo indica la plataforma (VERCEL_ENV: production, preview o development).
 * - En otro hosting (por ejemplo Hostinger) se puede fijar con APP_ENV=production | preview | test.
 * - Sin ninguna de las dos, un servidor de producción (`next start`) cuenta como sitio publicado:
 *   ante la duda, se protege a los clientes.
 */
export function isLiveSite(env: Record<string, string | undefined> = process.env): boolean {
  if (env.VERCEL_ENV) return env.VERCEL_ENV === "production";
  const appEnv = env.APP_ENV?.trim().toLowerCase();
  if (appEnv) return appEnv === "production";
  return env.NODE_ENV === "production";
}
