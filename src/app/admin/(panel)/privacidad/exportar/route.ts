import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import { findPersonalData } from "@/lib/data/privacy";

function omit<T extends object, K extends keyof T>(value: T, keys: K[]): Omit<T, K> {
  const copy = { ...value };
  for (const key of keys) delete copy[key];
  return copy;
}

/** Portabilidad / acceso: descarga en JSON todo lo que la tienda guarda de un correo (solo administradores). */
export async function GET(request: Request) {
  if (!(await getCurrentAdmin())) return new Response("No autorizado", { status: 401 });
  const email = z.email().safeParse(new URL(request.url).searchParams.get("correo")?.trim() ?? "");
  if (!email.success) return new Response("Correo inválido", { status: 400 });

  const data = await findPersonalData(email.data);
  const body = {
    titular: email.data,
    generado: new Date().toISOString(),
    pedidos: data.orders.map((order) => ({
      ...omit(order, ["webpayToken", "webpayResponse", "publicToken"]),
      productos: data.items
        .filter((item) => item.orderId === order.id)
        .map(({ productName, productSku, unitPrice, quantity, lineTotal }) => ({ productName, productSku, unitPrice, quantity, lineTotal })),
    })),
    solicitudes: data.inquiries.map((inquiry) => omit(inquiry, ["adminNotes"])),
  };
  const file = `datos-${email.data.replace(/[^a-z0-9]+/gi, "-")}.json`;
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "no-store",
    },
  });
}
