import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { formatCLP } from "@/lib/format";
import { getMockTransaction, isMockAllowed, webpayEnvironment } from "@/lib/payments/webpay";

export const metadata: Metadata = { title: "Simulador de Webpay", robots: { index: false } };

export default function MockWebpayPage({ searchParams }: PageProps<"/pago/simulado/pagar">) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-100 p-4 text-zinc-900">
      <Suspense fallback={<p>Cargando…</p>}>
        <MockPayment searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function MockPayment({ searchParams }: { searchParams: PageProps<"/pago/simulado/pagar">["searchParams"] }) {
  const { token_ws: token } = await searchParams;
  if (webpayEnvironment() !== "mock" || !isMockAllowed() || typeof token !== "string") notFound();
  const tx = getMockTransaction(token);
  if (!tx) notFound();

  const options = [
    { decision: "approve", label: "Aprobar pago", className: "bg-emerald-600 text-white hover:bg-emerald-700" },
    { decision: "reject", label: "Rechazar pago", className: "bg-red-600 text-white hover:bg-red-700" },
    { decision: "abort", label: "Anular y volver al comercio", className: "bg-zinc-200 hover:bg-zinc-300" },
    { decision: "timeout", label: "Simular tiempo agotado", className: "bg-zinc-200 hover:bg-zinc-300" },
  ];

  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
      <div className="bg-[#6b196b] px-6 py-4 text-white">
        <p className="text-lg font-bold">Webpay · Simulador</p>
        <p className="text-sm opacity-80">Modo de desarrollo: no se realiza ningún cobro.</p>
      </div>
      <div className="space-y-4 p-6">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-zinc-500">Orden de compra</dt>
          <dd className="text-right font-semibold">{tx.buyOrder}</dd>
          <dt className="text-zinc-500">Monto</dt>
          <dd className="text-right text-lg font-bold">{formatCLP(tx.amount)}</dd>
        </dl>
        <form method="POST" action="/pago/simulado/decidir" className="grid gap-2">
          <input type="hidden" name="token" value={token} />
          {options.map((option) => (
            <button
              key={option.decision}
              name="decision"
              value={option.decision}
              className={`h-11 cursor-pointer rounded-xl text-sm font-semibold ${option.className}`}
            >
              {option.label}
            </button>
          ))}
        </form>
      </div>
    </div>
  );
}
