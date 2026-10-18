import "server-only";
import { createHash } from "node:crypto";
import { lt, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "./db";
import { rateLimits } from "./db/schema";

/**
 * Cuántos intentos se permiten por ventana de tiempo. Son holgados a propósito: en Chile muchos
 * celulares comparten IP (CGNAT), así que solo deben frenar a scripts, nunca a clientes reales.
 */
export const RATE_LIMITS = {
  /** Login del panel, por IP. */
  login: { limit: 10, windowSeconds: 15 * 60 },
  /** Login del panel, por correo (frena ataques repartidos entre muchas IP). */
  loginEmail: { limit: 10, windowSeconds: 15 * 60 },
  checkout: { limit: 10, windowSeconds: 60 * 60 },
  /** Contacto, agenda, pedido especial, cotizador de ramal y derechos sobre datos. */
  inquiry: { limit: 8, windowSeconds: 10 * 60 },
  tracking: { limit: 20, windowSeconds: 10 * 60 },
  /** Prueba de integración con Fullpyme (dirección pública que imita a Jumpseller). */
  integration: { limit: 60, windowSeconds: 10 * 60 },
} as const;

export type RateLimitBucket = keyof typeof RATE_LIMITS;

export const RATE_LIMIT_MESSAGE = "Demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo.";

async function clientIp() {
  const h = await headers();
  // En Vercel ambos encabezados los pone la plataforma (no se pueden falsificar desde el navegador).
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

/**
 * Registra un intento y devuelve `false` si se superó el límite de la ventana actual.
 * Sin IP conocida, o si la base de datos falla, deja pasar: nunca bloquea una venta por error.
 */
export async function rateLimit(bucket: RateLimitBucket, subject?: string): Promise<boolean> {
  if (process.env.RATE_LIMIT === "off") return true;
  const id = subject ?? (await clientIp());
  if (!id) return true;
  const rule = RATE_LIMITS[bucket];
  const key = createHash("sha256").update(`${bucket}:${id.toLowerCase()}`).digest("base64url");
  try {
    const [row] = await db
      .insert(rateLimits)
      .values({ key, count: 1, resetAt: new Date(Date.now() + rule.windowSeconds * 1000) })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          count: sql`case when ${rateLimits.resetAt} < now() then 1 else ${rateLimits.count} + 1 end`,
          resetAt: sql`case when ${rateLimits.resetAt} < now() then excluded.reset_at else ${rateLimits.resetAt} end`,
        },
      })
      .returning({ count: rateLimits.count });
    // Limpieza ocasional de ventanas vencidas.
    if (Math.random() < 0.02) await db.delete(rateLimits).where(lt(rateLimits.resetAt, new Date()));
    return row.count <= rule.limit;
  } catch (error) {
    console.error("No se pudo revisar el límite de intentos:", error);
    return true;
  }
}
