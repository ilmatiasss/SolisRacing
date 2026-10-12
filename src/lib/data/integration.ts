import "server-only";
import { desc, lt, sql } from "drizzle-orm";
import { db } from "../db";
import { integrationRequests } from "../db/schema";

const KEEP = 200;
const MAX_BODY = 4000;

/** Oculta credenciales: deja ver solo el comienzo (sirve para reconocer cuál se usó). */
export function maskSecret(value: string) {
  return value.length <= 4 ? "****" : `${value.slice(0, 3)}…(${value.length})`;
}

/** Encabezados útiles para entender al cliente, con la autorización enmascarada. */
export function pickHeaders(headers: Headers): Record<string, string> {
  const picked: Record<string, string> = {};
  for (const name of ["user-agent", "content-type", "accept"]) {
    const value = headers.get(name);
    if (value) picked[name] = value.slice(0, 300);
  }
  const auth = headers.get("authorization");
  if (auth) {
    const [scheme = "", credentials = ""] = auth.split(" ");
    if (scheme.toLowerCase() === "basic") {
      const decoded = Buffer.from(credentials, "base64").toString("utf8");
      const [login = "", token = ""] = decoded.split(":");
      picked.authorization = `Basic usuario=${login.slice(0, 80)} token=${maskSecret(token)}`;
    } else {
      picked.authorization = `${scheme} ${maskSecret(credentials)}`;
    }
  }
  return picked;
}

/** Parámetros de la consulta, legibles, con las credenciales enmascaradas (authtoken, token, password…). */
export function maskQuery(search: URLSearchParams): string {
  return [...search]
    .map(([key, value]) => `${key.slice(0, 60)}=${/token|pass|secret|key/i.test(key) ? maskSecret(value) : value.slice(0, 200)}`)
    .join("&");
}

export async function recordIntegrationRequest(entry: {
  method: string;
  path: string;
  query: string;
  headers: Record<string, string>;
  body: string;
}) {
  await db.insert(integrationRequests).values({
    method: entry.method,
    path: entry.path.slice(0, 500),
    query: entry.query || null,
    headers: entry.headers,
    body: entry.body ? entry.body.slice(0, MAX_BODY) : null,
  });
  // Solo las últimas KEEP.
  await db.execute(
    sql`delete from ${integrationRequests} where ${integrationRequests.id} not in (select id from ${integrationRequests} order by id desc limit ${KEEP})`,
  );
}

export async function listIntegrationRequests() {
  return db.select().from(integrationRequests).orderBy(desc(integrationRequests.id)).limit(KEEP);
}

export async function clearIntegrationRequests() {
  await db.delete(integrationRequests).where(lt(integrationRequests.id, Number.MAX_SAFE_INTEGER));
}
