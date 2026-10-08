import { ExternalLink, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, ActionSubmit } from "@/components/admin/action-form";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { AdminPageHeader, Card, Notice } from "@/components/admin/ui";
import { WhatsAppIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { saveOrderNotes } from "@/lib/actions/admin/orders";
import { requireAdmin } from "@/lib/auth";
import { getRegion } from "@/lib/chile";
import { readStoreSettings } from "@/lib/data/settings";
import { formatCLP, formatDateTime, formatOrderNumber, whatsappLink } from "@/lib/format";
import {
  ORDER_STATUS_TONES,
  ORDER_TRANSITIONS,
  orderStatusLabel,
  PAYMENT_METHOD_LABELS,
  WEBPAY_PAYMENT_TYPES,
} from "@/lib/order-status";
import { getOrderById } from "@/lib/orders";
import { DELIVERY_METHOD_LABELS } from "@/lib/shipping";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Pedido" };

// Página del panel: siempre se consulta la base de datos al momento (no se prerenderiza).
export const instant = false;

export default async function OrderAdminPage({ params }: PageProps<"/admin/pedidos/[id]">) {
  await requireAdmin();
  const orderId = Number((await params).id);
  if (!Number.isInteger(orderId)) notFound();
  const [order, settings] = await Promise.all([getOrderById(orderId), readStoreSettings()]);
  if (!order) notFound();

  const number = formatOrderNumber(order.id);
  const pickup = order.deliveryMethod === "pickup";
  const webpay = order.webpayResponse;
  const testPayment = webpay?.environment && webpay.environment !== "production";
  const customerLink = `${siteUrl()}/pedido/${order.id}?t=${order.publicToken}`;
  const region = getRegion(order.shippingRegion);

  return (
    <>
      <Link href="/admin/pedidos" className="text-sm text-muted hover:text-fg">
        ← Pedidos
      </Link>
      <AdminPageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            Pedido {number}
            <Badge tone={ORDER_STATUS_TONES[order.status]} className="text-sm">
              {orderStatusLabel(order.status, pickup)}
            </Badge>
          </span>
        }
        description={`Creado el ${formatDateTime(order.createdAt)}`}
        actions={
          <>
            <a
              href={whatsappLink(order.customerPhone, `Hola ${order.customerName.split(" ")[0]}, te escribimos de ${settings.storeName} por tu pedido ${number}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: "outline", size: "sm" })}
            >
              <WhatsAppIcon className="size-4 text-emerald-600" /> WhatsApp
            </a>
            <a href={customerLink} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: "outline", size: "sm" })}>
              <ExternalLink className="size-4" /> Vista del cliente
            </a>
          </>
        }
      />

      {order.adminNotes?.startsWith("⚠️") && <Notice tone="danger" className="mb-4">{order.adminNotes}</Notice>}
      {testPayment && (
        <Notice tone="warning" className="mb-4">
          Este pago se hizo en el ambiente de <strong>{webpay?.environment === "mock" ? "simulación" : "pruebas de Transbank"}</strong>:
          no corresponde a dinero real. No despaches este pedido.
        </Notice>
      )}
      {order.status === "pending" && order.paymentMethod === "transfer" && (
        <Notice tone="info" className="mb-4">
          Esperando transferencia por <strong>{formatCLP(order.total)}</strong>. Cuando confirmes el depósito en tu banco, cambia el
          estado a «Pagado».
        </Notice>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <Card title="Productos" bodyClassName="p-0">
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-5 py-3">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
                    {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="48px" className="object-contain p-0.5" />}
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                    {item.productId ? (
                      <Link href={`/admin/productos/${item.productId}`} className="font-medium hover:text-brand-600">
                        {item.productName}
                      </Link>
                    ) : (
                      <p className="font-medium">{item.productName}</p>
                    )}
                    <p className="text-xs text-muted">
                      {item.productSku ?? "Sin SKU"} · {item.quantity} × {formatCLP(item.unitPrice)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{formatCLP(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-line px-5 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="tabular-nums">{formatCLP(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Despacho ({DELIVERY_METHOD_LABELS[order.deliveryMethod]})</dt>
                <dd className="tabular-nums">
                  {order.deliveryMethod === "shipping_collect" ? "Por pagar" : order.shippingCost ? formatCLP(order.shippingCost) : "Gratis"}
                </dd>
              </div>
              <div className="flex justify-between pt-1 text-base font-bold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatCLP(order.total)}</dd>
              </div>
            </dl>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card title="Cliente">
              <div className="space-y-2 text-sm">
                <p className="font-semibold">{order.customerName}</p>
                <p className="flex items-center gap-2">
                  <Mail className="size-4 text-muted" />
                  <a href={`mailto:${order.customerEmail}`} className="hover:underline">
                    {order.customerEmail}
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-muted" />
                  <a href={`tel:${order.customerPhone.replace(/\s/g, "")}`} className="hover:underline">
                    {order.customerPhone}
                  </a>
                </p>
                {order.customerRut && <p>RUT: {order.customerRut}</p>}
                <div className="mt-3 rounded-lg bg-surface-2 p-3">
                  <p className="font-medium">{order.documentType === "factura" ? "Factura" : "Boleta"}</p>
                  {order.documentType === "factura" && (
                    <p className="mt-1 text-muted">
                      {order.companyName}
                      <br />
                      RUT {order.companyRut} · Giro: {order.companyGiro}
                      {order.companyAddress && (
                        <>
                          <br />
                          {order.companyAddress}
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </Card>
            <Card title="Entrega">
              <div className="space-y-2 text-sm">
                <p className="font-semibold">{DELIVERY_METHOD_LABELS[order.deliveryMethod]}</p>
                {pickup ? (
                  <p className="text-muted">El cliente retira en el taller.</p>
                ) : (
                  <p>
                    {order.shippingAddress}
                    {order.shippingAddress2 && `, ${order.shippingAddress2}`}
                    <br />
                    {order.shippingCommune}, {region?.name ?? order.shippingRegion}
                  </p>
                )}
                {order.customerNotes && (
                  <p className="rounded-lg bg-amber-50 p-3 text-amber-900">
                    <strong>Nota del cliente:</strong> {order.customerNotes}
                  </p>
                )}
              </div>
            </Card>
          </div>

          <Card title="Pago">
            <div className="text-sm">
              <p className="font-semibold">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
              {order.paidAt && <p className="text-muted">Pagado el {formatDateTime(order.paidAt)}</p>}
              {webpay && (
                <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                  <Data label="Respuesta" value={webpay.response_code === 0 ? "Aprobada" : `Rechazada (código ${webpay.response_code})`} />
                  <Data label="Código de autorización" value={webpay.authorization_code} />
                  <Data label="Monto" value={formatCLP(webpay.amount)} />
                  <Data label="Tarjeta" value={webpay.card_detail?.card_number ? `**** ${webpay.card_detail.card_number}` : undefined} />
                  <Data label="Tipo" value={WEBPAY_PAYMENT_TYPES[webpay.payment_type_code ?? ""] ?? webpay.payment_type_code} />
                  <Data label="Cuotas" value={webpay.installments_number ? String(webpay.installments_number) : "Sin cuotas"} />
                  <Data label="Orden de compra" value={webpay.buy_order} />
                  <Data label="Fecha" value={webpay.transaction_date ? formatDateTime(webpay.transaction_date) : undefined} />
                </dl>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Cambiar estado">
            <OrderStatusForm
              orderId={order.id}
              transitions={ORDER_TRANSITIONS[order.status]}
              deliveryMethod={order.deliveryMethod}
              trackingCourier={order.trackingCourier}
              trackingNumber={order.trackingNumber}
            />
          </Card>

          <Card title="Seguimiento y notas internas">
            <ActionForm action={saveOrderNotes} className="space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              {!pickup && (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <Field label="Courier" htmlFor="notes-courier">
                    <Input id="notes-courier" name="trackingCourier" defaultValue={order.trackingCourier ?? ""} />
                  </Field>
                  <Field label="N° de seguimiento" htmlFor="notes-tracking">
                    <Input id="notes-tracking" name="trackingNumber" defaultValue={order.trackingNumber ?? ""} />
                  </Field>
                </div>
              )}
              <Field label="Notas internas" htmlFor="adminNotes" hint="Solo las ve el equipo de la tienda.">
                <Textarea id="adminNotes" name="adminNotes" rows={3} defaultValue={order.adminNotes ?? ""} />
              </Field>
              <ActionSubmit variant="outline">Guardar</ActionSubmit>
            </ActionForm>
          </Card>

          <Card title="Historial" bodyClassName="p-0">
            <ol className="divide-y divide-line">
              {[...order.events].reverse().map((event) => (
                <li key={event.id} className="px-5 py-3 text-sm">
                  <p className={event.public ? "" : "text-muted italic"}>{event.message}</p>
                  <p className="text-xs text-muted">
                    {formatDateTime(event.createdAt)}
                    {!event.public && " · interno"}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}

function Data({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-medium">{value || "—"}</dd>
    </div>
  );
}
