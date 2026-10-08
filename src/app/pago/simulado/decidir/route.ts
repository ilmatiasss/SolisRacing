import { NextResponse, type NextRequest } from "next/server";
import { getMockTransaction, isMockAllowed, setMockResult, webpayEnvironment } from "@/lib/payments/webpay";

/** Simulador de Webpay: aplica la decisión elegida y devuelve al cliente a la URL de retorno. */
export async function POST(request: NextRequest) {
  if (webpayEnvironment() !== "mock" || !isMockAllowed()) {
    return new NextResponse("Simulador deshabilitado", { status: 404 });
  }
  const form = await request.formData();
  const token = String(form.get("token") ?? "");
  const decision = String(form.get("decision") ?? "");
  const tx = getMockTransaction(token);
  if (!tx) return NextResponse.redirect(new URL("/pago/error", request.url), 303);

  const url = new URL(tx.returnUrl);
  if (decision === "approve" || decision === "reject") {
    setMockResult(token, decision === "approve" ? "approved" : "rejected");
    url.searchParams.set("token_ws", token);
  } else if (decision === "abort") {
    url.searchParams.set("TBK_TOKEN", token);
    url.searchParams.set("TBK_ORDEN_COMPRA", tx.buyOrder);
    url.searchParams.set("TBK_ID_SESION", tx.sessionId);
  } else {
    url.searchParams.set("TBK_ORDEN_COMPRA", tx.buyOrder);
    url.searchParams.set("TBK_ID_SESION", tx.sessionId);
  }
  return NextResponse.redirect(url, 303);
}
