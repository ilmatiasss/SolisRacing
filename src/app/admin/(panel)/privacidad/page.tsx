import { Download, Search, ShieldCheck, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SubmitButton } from "@/components/admin/form-buttons";
import { AdminPageHeader, Card, EmptyState, Notice } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { deletePersonInquiries } from "@/lib/actions/admin/privacy";
import { requireAdmin } from "@/lib/auth";
import { findPersonalData, purgeExpiredPersonalData } from "@/lib/data/privacy";
import { formatCLP, formatDateTime, formatOrderNumber } from "@/lib/format";
import { INQUIRY_STATUS_LABELS, INQUIRY_STATUS_TONES, inquiryTitle, orderStatusLabel } from "@/lib/order-status";
import { INQUIRY_RETENTION_MONTHS, ORDER_RETENTION_YEARS, PRIVACY_RESPONSE_DAYS } from "@/lib/privacy";

export const metadata: Metadata = { title: "Privacidad" };

// Página del panel: siempre se consulta la base de datos al momento (no se prerenderiza).
export const instant = false;

export default async function PrivacyAdminPage({ searchParams }: PageProps<"/admin/privacidad">) {
  await requireAdmin();
  await purgeExpiredPersonalData().catch(() => null);
  const sp = await searchParams;
  const email = typeof sp.correo === "string" ? sp.correo.trim() : "";
  const data = email ? await findPersonalData(email) : null;
  const deleted = typeof sp.eliminadas === "string" ? Number(sp.eliminadas) : null;

  return (
    <>
      <AdminPageHeader
        title="Privacidad y datos personales"
        description="Responde las solicitudes de acceso, portabilidad o supresión de datos (Ley 21.719)."
      />

      <Notice tone="info" className="mb-6 flex gap-3">
        <ShieldCheck className="mt-0.5 size-4.5 shrink-0" />
        <span>
          Las solicitudes de derechos llegan a{" "}
          <Link href="/admin/solicitudes" className="font-semibold underline">
            Solicitudes
          </Link>{" "}
          con su fecha límite: hay {PRIVACY_RESPONSE_DAYS} días corridos para responder. Busca aquí a la persona por su correo
          para ver qué datos tenemos, descargarlos o eliminar sus mensajes. Los mensajes cerrados se borran solos a los{" "}
          {INQUIRY_RETENTION_MONTHS} meses y los pedidos se anonimizan a los {ORDER_RETENTION_YEARS} años.
        </span>
      </Notice>

      <Card className="mb-6">
        <form className="flex flex-col gap-3 sm:flex-row" action="/admin/privacidad">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
            <Input name="correo" type="email" defaultValue={email} placeholder="correo@cliente.cl" aria-label="Correo de la persona" className="pl-10" required />
          </div>
          <button type="submit" className={buttonClasses({ size: "md" })}>
            Buscar
          </button>
        </form>
      </Card>

      {deleted !== null && Number.isInteger(deleted) && (
        <Notice tone="success" className="mb-6">
          {deleted === 0 ? "No había solicitudes de ese correo." : deleted === 1 ? "Se eliminó 1 solicitud." : `Se eliminaron ${deleted} solicitudes.`}
        </Notice>
      )}

      {data && (
        <>
          {data.orders.length === 0 && data.inquiries.length === 0 ? (
            <Card>
              <EmptyState title="No hay datos de ese correo" description="No encontramos pedidos ni solicitudes asociados." />
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <a href={`/admin/privacidad/exportar?correo=${encodeURIComponent(email)}`} className={buttonClasses({ variant: "outline" })}>
                  <Download className="size-4" />
                  Descargar sus datos (JSON)
                </a>
              </div>

              <Card
                title={`Pedidos (${data.orders.length})`}
                description={`Se conservan ${ORDER_RETENTION_YEARS} años por obligación tributaria: no se pueden eliminar a pedido. Si un dato está mal, corrígelo en el pedido.`}
                bodyClassName={data.orders.length > 0 ? "p-0" : undefined}
              >
                {data.orders.length === 0 ? (
                  <p className="text-sm text-muted">Sin pedidos.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {data.orders.map((order) => (
                      <li key={order.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
                        <Link href={`/admin/pedidos/${order.id}`} className="font-semibold text-brand-500 hover:underline">
                          {formatOrderNumber(order.id)}
                        </Link>
                        <span className="text-muted">{formatDateTime(order.createdAt)}</span>
                        <span>{order.customerName}</span>
                        <span className="text-muted">{orderStatusLabel(order.status, order.deliveryMethod === "pickup")}</span>
                        <span className="ml-auto font-semibold tabular-nums">{formatCLP(order.total)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card
                title={`Solicitudes y mensajes (${data.inquiries.length})`}
                description="Pedidos de hora, cotizaciones, mensajes y solicitudes de derechos."
                bodyClassName={data.inquiries.length > 0 ? "p-0" : undefined}
              >
                {data.inquiries.length === 0 ? (
                  <p className="text-sm text-muted">Sin solicitudes.</p>
                ) : (
                  <>
                    <ul className="divide-y divide-line">
                      {data.inquiries.map((inquiry) => (
                        <li key={inquiry.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
                          <span className="font-medium">{inquiryTitle(inquiry.kind, inquiry.serviceName)}</span>
                          <span className="text-muted">{formatDateTime(inquiry.createdAt)}</span>
                          <Badge tone={INQUIRY_STATUS_TONES[inquiry.status]}>{INQUIRY_STATUS_LABELS[inquiry.status]}</Badge>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-line px-5 py-4">
                      <form action={deletePersonInquiries} className="flex flex-wrap items-center gap-3">
                        <input type="hidden" name="email" value={email} />
                        <SubmitButton
                          variant="danger"
                          size="md"
                          pendingText="Eliminando…"
                          confirm={`¿Eliminar todas las solicitudes y mensajes de ${email}? No se puede deshacer.`}
                        >
                          <Trash2 className="size-4" />
                          Eliminar sus solicitudes y mensajes
                        </SubmitButton>
                        <span className="text-xs text-muted">Para una solicitud de supresión. No se puede deshacer.</span>
                      </form>
                    </div>
                  </>
                )}
              </Card>
            </div>
          )}
        </>
      )}
    </>
  );
}
