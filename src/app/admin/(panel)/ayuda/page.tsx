import { Lightbulb } from "lucide-react";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { HELP_TOPICS } from "@/components/admin/guides";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import type { OrderStatus } from "@/lib/db/schema";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from "@/lib/order-status";

export const metadata: Metadata = { title: "Guía de uso" };

// Página del panel: siempre se consulta la base de datos al momento (no se prerenderiza).
export const instant = false;

/** Qué significa cada estado de un pedido y qué te toca hacer. */
const STATUS_HELP: Record<OrderStatus, string> = {
  pending: "El cliente está pagando en Webpay o dejó el pago a medias. No prepares nada: si no paga, se cancela solo.",
  paid: "Webpay aprobó el pago. Te toca preparar los productos.",
  processing: "Estás armando el pedido. Opcional, sirve para que el cliente vea que avanzas.",
  shipped: "Despachado con courier (o «Listo para retiro» si lo retira en la tienda).",
  delivered: "El cliente ya lo tiene. El pedido está terminado.",
  cancelled: "No se concretó o se devolvió. El stock ya volvió al catálogo.",
};

export default async function HelpPage() {
  await requireAdmin();
  return (
    <>
      <AdminPageHeader
        title="Guía de uso"
        description="Cómo hacer las tareas del día a día, paso a paso. En cada sección también encontrarás «¿Cómo funciona esta sección?» bajo el título."
      />

      <nav aria-label="Temas de la guía" className="mb-6 flex flex-wrap gap-2">
        {HELP_TOPICS.map((topic) => (
          <a
            key={topic.id}
            href={`#${topic.id}`}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-zinc-300 hover:border-brand-600 hover:text-white"
          >
            {topic.title}
          </a>
        ))}
      </nav>

      <div className="grid gap-6 lg:grid-cols-2">
        {HELP_TOPICS.map((topic) => (
          <div key={topic.id} id={topic.id} className="scroll-mt-6">
            <Card title={topic.title} className="h-full">
              <ol className="space-y-3 text-sm">
                {topic.steps.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="pt-0.5 text-zinc-300">{step}</span>
                  </li>
                ))}
              </ol>
              {topic.tip && (
                <p className="mt-4 flex gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden="true" />
                  {topic.tip}
                </p>
              )}
            </Card>
          </div>
        ))}
      </div>

      <Card title="¿Qué significa cada estado de un pedido?" className="mt-6" bodyClassName="p-0">
        <dl className="divide-y divide-line">
          {(Object.keys(STATUS_HELP) as OrderStatus[]).map((status) => (
            <div key={status} className="grid gap-1.5 px-5 py-3 sm:grid-cols-[11rem_1fr] sm:items-center">
              <dt>
                <Badge tone={ORDER_STATUS_TONES[status]}>{ORDER_STATUS_LABELS[status]}</Badge>
              </dt>
              <dd className="text-sm text-muted">{STATUS_HELP[status]}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </>
  );
}
