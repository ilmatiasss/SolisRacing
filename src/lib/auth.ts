import "server-only";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { adminUsers, settings } from "./db/schema";

export const SESSION_COOKIE = "sr_admin";
const SESSION_DAYS = 7;

export type AdminUser = { id: number; email: string; name: string };

let secretPromise: Promise<Uint8Array> | null = null;

/**
 * Clave para firmar las sesiones. Usa AUTH_SECRET si existe; si no, genera una
 * aleatoria y la guarda en la base de datos (así el panel funciona sin configurar nada).
 */
function getSecret(): Promise<Uint8Array> {
  secretPromise ??= (async () => {
    const fromEnv = process.env.AUTH_SECRET;
    if (fromEnv && fromEnv.length >= 16) return new TextEncoder().encode(fromEnv);
    const generated = randomBytes(32).toString("base64url");
    await db
      .insert(settings)
      .values({ key: "auth_secret", value: generated })
      .onConflictDoNothing();
    const [row] = await db.select().from(settings).where(eq(settings.key, "auth_secret"));
    return new TextEncoder().encode(String(row?.value ?? generated));
  })().catch((error) => {
    secretPromise = null;
    throw error;
  });
  return secretPromise;
}

export async function verifyCredentials(email: string, password: string): Promise<AdminUser | null> {
  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email.trim().toLowerCase()));
  // Se compara igual aunque el usuario no exista, para no revelar qué correos son válidos.
  const hash = user?.passwordHash ?? "$2b$12$2hhLbnW4ILz2f9/nxNbWUOMrx9.59H1df.OxTIBNbixMvoS25ajZe";
  const valid = await bcrypt.compare(password, hash);
  if (!user || !valid) return null;
  await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));
  return { id: user.id, email: user.email, name: user.name };
}

export async function createSession(user: AdminUser) {
  const token = await new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(await getSecret());
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Usuario de la sesión actual, verificado contra la base de datos. */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, await getSecret(), { algorithms: ["HS256"] });
    const id = Number(payload.sub);
    if (!Number.isInteger(id)) return null;
    const [user] = await db
      .select({ id: adminUsers.id, email: adminUsers.email, name: adminUsers.name })
      .from(adminUsers)
      .where(eq(adminUsers.id, id));
    return user ?? null;
  } catch {
    return null;
  }
}

/** Úsalo al inicio de cada página y acción del panel. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getCurrentAdmin();
  if (!user) redirect("/admin/login");
  return user;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function checkPassword(userId: number, password: string) {
  const [user] = await db
    .select({ passwordHash: adminUsers.passwordHash })
    .from(adminUsers)
    .where(eq(adminUsers.id, userId));
  return user ? bcrypt.compare(password, user.passwordHash) : false;
}
