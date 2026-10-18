import { getStoreSettings } from "@/lib/data/settings";
import { maskQuery, pickHeaders, recordIntegrationRequest } from "@/lib/data/integration";
import { rateLimit } from "@/lib/rate-limit";
import { siteUrl } from "@/lib/site";

/*
 * Prueba de integración con Fullpyme. Su conector de e-commerce solo habla con Jumpseller (pide
 * usuario, token y URL). Esta dirección imita la API de Jumpseller para ver si Fullpyme envía sus
 * consultas a la URL configurada y cuáles hace: registra cada consulta (Panel → Integraciones) y
 * responde con datos vacíos con la forma de Jumpseller. Aún no lee ni cambia nada de la tienda.
 */

async function handle(request: Request, { params }: RouteContext<"/api/jumpseller/[...path]">) {
  // Es público: se limita para que nadie llene el registro ni gaste la base de datos.
  if (!(await rateLimit("integration"))) return Response.json({ error: "Too many requests" }, { status: 429 });
  const { path } = await params;
  const url = new URL(request.url);
  let body = "";
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.text().catch(() => "");
    // Si el cuerpo trae credenciales en JSON, se enmascaran.
    body = body.replace(/("?(?:\w*token|password|secret|api_?key)"?\s*[:=]\s*"?)([^"&,}\s]+)/gi, "$1***");
  }
  await recordIntegrationRequest({
    method: request.method,
    path: `/${path.join("/")}`,
    query: maskQuery(url.searchParams),
    headers: pickHeaders(request.headers),
    body,
  }).catch(() => {});

  return Response.json(await fakeJumpsellerResponse(path, request.method), {
    headers: { "Cache-Control": "no-store" },
  });
}

/** Respuestas vacías con la forma de la API de Jumpseller v1, para que el conector siga avanzando. */
async function fakeJumpsellerResponse(path: string[], method: string) {
  const resource = path.filter((part) => part !== "v1").join("/").replace(/\.json$/, "");
  if (resource.startsWith("store")) {
    const settings = await getStoreSettings();
    return { store: { name: settings.storeName, code: "solisracingparts", currency: "CLP", country: "CL", url: siteUrl() } };
  }
  if (resource.endsWith("count")) return { count: 0 };
  // Listas (products, orders, categories, …) vacías; altas y cambios, un objeto vacío.
  if (method === "GET" && !/\/\d+$/.test(resource)) return [];
  return {};
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
