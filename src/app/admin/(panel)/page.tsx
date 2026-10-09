import { ArrowRight, Plus, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader, Card, EmptyState, Notice, StatCard, Table, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/admin";
import { readStoreSettings } from "@/lib/data/settings";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { formatCLP, formatDateTime, formatOrderNumber } from "@/lib/format";
import { ORDER_STATUS_TONES, orderStatusLabel, PAYMENT_METHOD_SHORT } from "@/lib/order-status";
import { expireAbandonedWebpayOrders } from "@/lib/orders";
import { webpayEnvironment } from "@/lib/payments/webpay";

export const metadata: Metadata = { title: "Resumen" };

// Página del panel: siempre se consulta la base de datos al momento (no se prerenderiza).
export const instant = false;

export default async function DashboardPage() {
  const user = await requireAdmin();
  await expireAbandonedWebpayOrders().catch(() => 0);
  const [data, settings] = await Promise.all([getDashboardData(), readStoreSettings()]);
  const env = webpayEnvironment();
  const pending = [
    !settings.email && "el correo de la tienda (ahí llegan los avisos de pedidos y solicitudes)",
    settings.payments.transferAccountNumber === DEFAULT_SETTINGS.payments.transferAccountNumber &&
      "los datos bancarios para transferencias",
  ].filter((item): item is string => Boolean(item));

  return (
    <>
      <AdminPageHeader
        title={`Hola, ${user.name.split(" ")[0]}`}
        description="Así va la tienda."
        actions={
          <Link href="/admin/productos/nuevo" className={buttonClasses({ size: "sm" })}>
            <Plus className="size-4" />
            Nuevo producto
          </Link>
        }
      />

      {env !== "production" && (
        <Notice tone="warning" className="mb-6 flex gap-3">
          <TriangleAlert className="mt-0.5 size-4.5 shrink-0" />
          <span>
            <strong>Webpay está en modo {env === "mock" ? "simulador" : "de pruebas (integración)"}.</strong> Los pagos con
            tarjeta no son reales. Cuando Transbank te entregue tu código de comercio y API Key, configura{" "}
            <code className="font-mono">WEBPAY_ENVIRONMENT=production</code> (ver README).
          </span>
        </Notice>
      )}

      {pending.length > 0 && (
        <Notice tone="info" className="mb-6">
          <strong>Completa los datos de tu tienda:</strong> {pending.length > 1 ? "faltan" : "falta"}{" "}
          {new Intl.ListFormat("es", { type: "conjunction" }).format(pending)}.{" "}
          <Link href="/admin/configuracion" className="font-semibold underline">
            Ir a Configuración
          </Link>
        </Notice>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ventas del mes" value={formatCLP(data.monthSales)} hint={`${data.monthOrders} pedidos pagados`} tone="success" />
        <StatCard label="Últimos 30 días" value={formatCLP(data.last30Sales)} />
        <StatCard
          label="Por despachar"
          value={data.toShip}
          hint="Pagados o en preparación"
          tone={data.toShip ? "brand" : "neutral"}
        />
        <StatCard
          label="Transferencias pendientes"
          value={data.pendingTransfers}
          hint="Revisa si llegó el pago"
          tone={data.pendingTransfers ? "warning" : "neutral"}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card
          title="Últimos pedidos"
          bodyClassName="p-0"
          actions={
            <Link href="/admin/pedidos" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
              Ver todos <ArrowRight className="size-4" />
            </Link>
          }
        >
          {data.recentOrders.length === 0 ? (
            <EmptyState title="Aún no hay pedidos" description="Cuando alguien compre, lo verás aquí." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Pedido</Th>
                  <Th>Cliente</Th>
                  <Th>Estado</Th>
                  <Th>Pago</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-2">
                    <Td>
                      <Link href={`/admin/pedidos/${order.id}`} className="font-semibold text-brand-600 hover:underline">
                        {formatOrderNumber(order.id)}
                      </Link>
                      <p className="text-xs text-muted">{formatDateTime(order.createdAt)}</p>
                    </Td>
                    <Td>{order.customerName}</Td>
                    <Td>
                      <Badge tone={ORDER_STATUS_TONES[order.status]}>
                        {orderStatusLabel(order.status, order.deliveryMethod === "pickup")}
                      </Badge>
                    </Td>
                    <Td>{PAYMENT_METHOD_SHORT[order.paymentMethod]}</Td>
                    <Td className="text-right font-semibold tabular-nums">{formatCLP(order.total)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Stock bajo" description="Productos activos con 3 unidades o menos." bodyClassName="p-0">
            {data.lowStock.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">Todo el catálogo tiene stock suficiente. 👌</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.lowStock.map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <Link href={`/admin/productos/${product.id}`} className="min-w-0 truncate hover:text-brand-600">
                      {product.name}
                    </Link>
                    <Badge tone={product.stock === 0 ? "danger" : "warning"}>
                      {product.stock === 0 ? "Agotado" : `${product.stock} u.`}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card
            title="Solicitudes nuevas"
            bodyClassName="p-0"
            actions={
              <Link href="/admin/solicitudes" className="text-sm font-semibold text-brand-600 hover:underline">
                Ver
              </Link>
            }
          >
            {data.newInquiries.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">No hay solicitudes sin responder.</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.newInquiries.map((inquiry) => (
                  <li key={inquiry.id} className="px-5 py-3 text-sm">
                    <p className="font-medium">{inquiry.name}</p>
                    <p className="text-xs text-muted">
                      {inquiry.kind === "service" ? inquiry.serviceName ?? "Servicio" : inquiry.kind === "part" ? "Repuesto" : "Contacto"} ·{" "}
                      {formatDateTime(inquiry.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
