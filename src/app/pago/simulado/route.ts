import { NextResponse, type NextRequest } from "next/server";

/** Simulador de Webpay (solo desarrollo): recibe el POST con token_ws como lo haría Transbank. */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const token = form.get("token_ws");
  const url = new URL("/pago/simulado/pagar", request.url);
  if (typeof token === "string") url.searchParams.set("token_ws", token);
  return NextResponse.redirect(url, 303);
}
