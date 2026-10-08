import "server-only";
import { cacheLife } from "next/cache";

/** Año actual, cacheado por un día (sirve para listas de años sin romper el prerender). */
export async function getCurrentYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
