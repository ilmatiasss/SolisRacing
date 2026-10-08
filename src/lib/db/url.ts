/**
 * URL de conexión a PostgreSQL. Además de DATABASE_URL acepta las variantes que crean las
 * integraciones de Vercel: POSTGRES_URL, o un prefijo propio (por ejemplo STORAGE_DATABASE_URL)
 * cuando la base de datos se conecta al proyecto con "Custom Prefix".
 */
export function databaseUrl(env: Record<string, string | undefined> = process.env): string | undefined {
  const direct = env.DATABASE_URL?.trim() || env.POSTGRES_URL?.trim();
  if (direct) return direct;
  const prefixed = Object.keys(env)
    .filter((key) => /^[A-Z][A-Z0-9_]*_(DATABASE_URL|POSTGRES_URL)$/.test(key) && key !== "E2E_DATABASE_URL")
    .sort();
  for (const key of prefixed) {
    const value = env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

/** Nombres (nunca valores) de variables que parecen de base de datos, para mensajes de error. */
export function databaseEnvNames(env: Record<string, string | undefined> = process.env): string[] {
  return Object.keys(env)
    .filter((key) => /DATABASE|POSTGRES|^PG[A-Z]/.test(key) && env[key])
    .sort();
}
