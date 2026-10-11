import { CheckCircle2, CircleX, Clock, Landmark, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { ClearCartOnMount, PrintButton } from "@/components/store/order/clear-cart";
import { ProductImage } from "@/components/store/product-image";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getRegion } from "@/lib/chile";
import { getStoreSettings } from "@/lib/data/settings";
import { formatCLP, formatDateTime, formatOrderNumber, whatsappLink } from "@/lib/format";
import {
  ORDER_STATUS_TONES,
  orderStatusLabel,
  PAYMENT_METHOD_LABELS,
  WEBPAY_PAYMENT_TYPES,
} from "@/lib/order-status";
import { getOrderForCustomer } from "@/lib/orders";
import { DELIVERY_METHOD_LABELS } from "@/lib/shipping";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false, follow: false } };

type Props = PageProps<"/pedido/[id]">;

export default function OrderPage({ params, searchParams }: Props) {
  return (
    <Suspense
      fallback={
        <Container className="py-16">
          <div className="h-64 animate-pulse rounded-2xl bg-surface" />
        </Container>
      }
    >
      <OrderView params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const RESULT_MESSAGES: Record<string, { tone: "success" | "danger" | "warning"; title: string; text: string }> = {
  aprobado: { tone: "success", title: "¡Pago aprobado!", text: "Gracias por tu compra. Te enviamos la confirmación por correo." },
  rechazado: {
    tone: "danger",
    title: "El pago fue rechazado",
    text: "Tu banco o Webpay rechazó la transacción y no se realizó ningún cargo. Tu carrito sigue guardado para que lo intentes de nuevo.",
  },
  anulado: {
    tone: "warning",
    title: "Pago anulado",
    text: "Anulaste el pago en Webpay. Tu carrito sigue guardado si quieres intentarlo otra vez.",
  },
  expirado: {
    tone: "warning",
    title: "Se agotó el tiempo para pagar",
    text: "El formulario de Webpay expiró antes de completar el pago. Tu carrito sigue guardado.",
  },
  error: {
    tone: "warning",
    title: "No pudimos confirmar el pago",
    text: "Hubo un problema de comunicación con Webpay. Si se realizó un cargo, contáctanos y lo revisamos de inmediato.",
  },
  revision: {
    tone: "warning",
    title: "Estamos revisando tu pago",
    text: "Recibimos una respuesta de Webpay que debemos verificar. Te contactaremos a la brevedad.",
  },
};

async function OrderView({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const token = typeof query.t === "string" ? query.t : "";
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) notFound();
  const [order, settings] = await Promise.all([getOrderForCustomer(orderId, token), getStoreSettings()]);
  if (!order) notFound();

  const number = formatOrderNumber(order.id);
  const pickup = order.deliveryMethod === "pickup";
  const result = typeof query.pago === "string" ? RESULT_MESSAGES[query.pago] : undefined;
  const confirmed =
    ["paid", "processing", "shipped", "delivered"].includes(order.status) ||
    (order.status === "pending" && order.paymentMethod === "transfer");
  const awaitingTransfer = order.status === "pending" && order.paymentMethod === "transfer";
  const webpay = order.webpayResponse;
  const region = getRegion(order.shippingRegion);

  return (
    <Container className="py-10 sm:py-14">
      {confirmed && <ClearCartOnMount />}

      <div className="mx-auto max-w-4xl space-y-6">
        {result && (
          <Banner tone={result.tone} title={result.title}>
            {result.text}
            {(query.pago === "rechazado" || query.pago === "anulado" || query.pago === "expirado") && (
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/checkout" className={buttonClasses({ size: "sm" })}>
                  Intentar nuevamente
                </Link>
                <Link href="/carrito" className={buttonClasses({ size: "sm", variant: "outline" })}>
                  Ver carrito
                </Link>
              </div>
            )}
          </Banner>
        )}
        {!result && awaitingTransfer && (
          <Banner tone="warning" title="¡Pedido recibido! Falta tu transferencia">
            Reservamos tus productos. Transfiere el total con los datos de abajo para confirmar tu compra.
          </Banner>
        )}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Pedido</p>
            <h1 className="font-display text-5xl font-extrabold tracking-normal uppercase italic">{number}</h1>
            <p className="mt-1 text-sm text-muted">Realizado el {formatDateTime(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <Badge tone={ORDER_STATUS_TONES[order.status]} className="px-3 py-1 text-sm">
              {orderStatusLabel(order.status, pickup)}
            </Badge>
            <PrintButton />
          </div>
        </div>

        {awaitingTransfer && (
          <section className="rounded-2xl border border-signal-400/30 bg-surface p-6">
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase italic">
              <Landmark className="size-6 text-signal-400" /> Datos para transferir
            </h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <DataRow label="Banco" value={settings.payments.transferBank} />
              <DataRow label="Tipo de cuenta" value={settings.payments.transferAccountType} />
              <DataRow label="N° de cuenta" value={settings.payments.transferAccountNumber} />
              <DataRow label="Titular" value={settings.payments.transferHolder} />
              {settings.payments.transferRut && <DataRow label="RUT" value={settings.payments.transferRut} />}
              {settings.payments.transferEmail && <DataRow label="Correo" value={settings.payments.transferEmail} />}
              <DataRow label="Monto a transferir" value={formatCLP(order.total)} strong />
              <DataRow label="Comentario" value={number} strong />
            </dl>
            {settings.payments.transferInstructions && (
              <p className="mt-4 text-sm text-muted">{settings.payments.transferInstructions}</p>
            )}
            <a
              href={whatsappLink(settings.whatsapp, `Hola, envío el comprobante de transferencia del pedido ${number}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ size: "sm", className: "mt-5 bg-[#25d366] hover:bg-[#1fb757] print:hidden" })}
            >
              <WhatsAppIcon className="size-4" />
              Enviar comprobante por WhatsApp
            </a>
          </section>
        )}

        {webpay && order.paymentMethod === "webpay" && order.status !== "cancelled" && webpay.response_code === 0 && (
          <section className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="font-display text-2xl font-bold uppercase italic">Comprobante de pago</h2>
            {webpay.environment && webpay.environment !== "production" && (
              <p className="mt-2 text-xs font-semibold text-signal-400">
                Transacción de prueba ({webpay.environment === "mock" ? "simulador" : "ambiente de integración"}): no
                corresponde a un cobro real.
              </p>
            )}
            <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <DataRow label="Comercio" value={settings.legalName || settings.storeName} />
              <DataRow label="Orden de compra" value={webpay.buy_order} />
              <DataRow label="Monto pagado" value={formatCLP(webpay.amount)} strong />
              <DataRow label="Código de autorización" value={webpay.authorization_code ?? "—"} />
              <DataRow
                label="Fecha de la transacción"
                value={webpay.transaction_date ? formatDateTime(webpay.transaction_date) : "—"}
              />
              <DataRow
                label="Tipo de pago"
                value={WEBPAY_PAYMENT_TYPES[webpay.payment_type_code ?? ""] ?? webpay.payment_type_code ?? "—"}
              />
              <DataRow
                label="Cuotas"
                value={webpay.installments_number ? String(webpay.installments_number) : "Sin cuotas"}
              />
              <DataRow
                label="Tarjeta"
                value={webpay.card_detail?.card_number ? `**** **** **** ${webpay.card_detail.card_number}` : "—"}
              />
            </dl>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="font-display text-2xl font-bold uppercase italic">Productos</h2>
            <ul className="mt-4 divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-3">
                  <ProductImage src={item.imageUrl} alt={item.productName} sizes="56px" className="size-14 shrink-0 rounded-lg border border-line" />
                  <div className="min-w-0 flex-1">
                    {item.productSlug ? (
                      <Link href={`/productos/${item.productSlug}`} className="line-clamp-2 text-sm font-medium hover:text-brand-400">
                        {item.productName}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium">{item.productName}</p>
                    )}
                    <p className="text-xs text-muted">
                      {item.quantity} × {formatCLP(item.unitPrice)}
                      {item.productSku && ` · ${item.productSku}`}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{formatCLP(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="tabular-nums">{formatCLP(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Despacho</dt>
                <dd className="tabular-nums">
                  {order.deliveryMethod === "shipping"
                    ? order.shippingCost > 0
                      ? formatCLP(order.shippingCost)
                      : "Gratis"
                    : order.deliveryMethod === "shipping_collect"
                      ? "Por pagar"
                      : "Retiro gratis"}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <dt className="font-semibold">Total</dt>
                <dd className="font-display text-3xl font-bold tabular-nums">{formatCLP(order.total)}</dd>
              </div>
            </dl>
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border border-line bg-surface p-6 text-sm">
              <h2 className="font-display text-2xl font-bold uppercase italic">Entrega</h2>
              <p className="mt-3 font-semibold">{DELIVERY_METHOD_LABELS[order.deliveryMethod]}</p>
              {pickup ? (
                <p className="mt-1 text-muted">{settings.shipping.pickupAddress}</p>
              ) : (
                <p className="mt-1 text-muted">
                  {order.shippingAddress}
                  {order.shippingAddress2 && `, ${order.shippingAddress2}`}
                  <br />
                  {order.shippingCommune}, {region?.name ?? order.shippingRegion}
                </p>
              )}
              {order.trackingNumber && (
                <p className="mt-3 rounded-xl bg-surface-2 p-3">
                  <span className="text-muted">Seguimiento:</span>{" "}
                  <strong>
                    {order.trackingCourier} · {order.trackingNumber}
                  </strong>
                </p>
              )}
              <h3 className="mt-5 font-semibold">Pago</h3>
              <p className="mt-1 text-muted">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
              <h3 className="mt-5 font-semibold">Documento</h3>
              <p className="mt-1 text-muted">
                {order.documentType === "factura" ? `Factura a ${order.companyName} (${order.companyRut})` : "Boleta"}
              </p>
            </section>

            <section className="rounded-2xl border border-line bg-surface p-6">
              <h2 className="font-display text-2xl font-bold uppercase italic">Seguimiento</h2>
              <ol className="mt-4 space-y-4">
                {[...order.events].reverse().map((event) => (
                  <li key={event.id} className="flex gap-3 text-sm">
                    <Clock className="mt-0.5 size-4 shrink-0 text-brand-500" />
                    <div>
                      <p>{event.message}</p>
                      <p className="text-xs text-muted">{formatDateTime(event.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>

        <p className="text-center text-sm text-muted print:hidden">
          ¿Dudas con tu pedido?{" "}
          <a
            href={whatsappLink(settings.whatsapp, `Hola, tengo una consulta sobre mi pedido ${number}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-400 hover:underline"
          >
            Escríbenos por WhatsApp
          </a>
          {settings.email && <> o a {settings.email}</>}. Guarda este enlace para revisar el estado de tu pedido.
        </p>
      </div>
    </Container>
  );
}

function Banner({ tone, title, children }: { tone: "success" | "danger" | "warning"; title: string; children: ReactNode }) {
  const styles = {
    success: { box: "border-emerald-500/30 bg-emerald-500/10", icon: <CheckCircle2 className="size-6 text-emerald-400" /> },
    danger: { box: "border-red-500/30 bg-red-500/10", icon: <CircleX className="size-6 text-red-400" /> },
    warning: { box: "border-signal-400/30 bg-signal-400/10", icon: <TriangleAlert className="size-6 text-signal-400" /> },
  }[tone];
  return (
    <div className={`flex gap-4 rounded-2xl border p-5 ${styles.box}`} role="status">
      <div className="shrink-0">{styles.icon}</div>
      <div className="text-sm text-zinc-200">
        <p className="font-display text-2xl font-bold text-white uppercase italic">{title}</p>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}

function DataRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line pb-2 sm:block sm:border-0 sm:pb-0">
      <dt className="text-muted">{label}</dt>
      <dd className={strong ? "font-bold text-white" : "font-medium"}>{value}</dd>
    </div>
  );
}
