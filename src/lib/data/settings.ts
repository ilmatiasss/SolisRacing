import "server-only";
import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "../db";
import { settings } from "../db/schema";
import { mergeSettings, type StoreSettings } from "../settings";

export const SETTINGS_TAG = "settings";
const STORE_KEY = "store";

/** Configuración de la tienda (cacheada; se invalida al guardar en el panel). */
export async function getStoreSettings(): Promise<StoreSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag(SETTINGS_TAG);
  return readStoreSettings();
}

/** Lectura directa, sin caché: para cálculos de cobro en el checkout. */
export async function readStoreSettings(): Promise<StoreSettings> {
  const [row] = await db.select().from(settings).where(eq(settings.key, STORE_KEY));
  return mergeSettings(row?.value);
}

export async function saveStoreSettings(value: StoreSettings) {
  await db
    .insert(settings)
    .values({ key: STORE_KEY, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
}
