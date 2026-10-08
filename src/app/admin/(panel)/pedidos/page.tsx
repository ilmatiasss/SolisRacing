import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPagination, pageParam, stringParam } from "@/components/admin/pagination";
import { AdminPageHeader, Card, EmptyState, Table, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { requireAdmin } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { listOrdersAdmin } from "@/lib/data/admin";
import type { OrderStatus, PaymentMethod } from "@/lib/db/schema";
import { formatCLP, formatDateTime, formatOrderNumber } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES, orderStatusLabel, PAYMENT_METHOD_SHORT } from "@/lib/order-status";
import { expireAbandonedWebpayOrders } from "@/lib/orders";
import { DELIVERY_METHOD_LABELS } from "@/lib/shipping";

export const metadata: Metadata = { title: "Pedidos" };

// Página del panel: siempre se consulta la base de datos al momento (no se prerenderiza).
export const instant = false;

const TABS: { value?: OrderStatus; label: string }[] = [
  { label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "paid", label: "Pagados" },
  { value: "processing", label: "En preparación" },
  { value: "shipped", label: "Enviados" },
  { value: "delivered", label: "Entregados" },
  { value: "cancelled", label: "Cancelados" },
];

export default async function OrdersAdminPage({ searchParams }: PageProps<"/admin/pedidos">) {
  await requireAdmin();
  await expireAbandonedWebpayOrders().catch(() => 0);
  const sp = await searchParams;
  const statusParam = stringParam(sp.estado);
  const status = statusParam && statusParam in ORDER_STATUS_LABELS ? (statusParam as OrderStatus) : undefined;
  const paymentParam = stringParam(sp.pago);
  const payment = paymentParam === "webpay" || paymentParam === "transfer" ? (paymentParam as PaymentMethod) : undefined;
  const q = stringParam(sp.q);
  const page = pageParam(sp.pagina);
  const { rows, total, pageCount } = await listOrdersAdmin({ status, payment, q, page });

  const tabHref = (value?: OrderStatus) => {
    const params = new URLSearchParams();
    if (value) params.set("estado", value);
    if (payment) params.set("pago", payment);
    if (q) params.set("q", q);
    const query = params.toString();
    return query ? `/admin/pedidos?${query}` : "/admin/pedidos";
  };

  return (
    <>
      <AdminPageHeader title="Pedidos" description={`${total} ${total === 1 ? "pedido" : "pedidos"}`} />
      <div className="scrollbar-none mb-4 flex gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <Link
            key={tab.label}
            href={tabHref(tab.value)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium",
              status === tab.value ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-200/60",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <Card bodyClassName="p-0">
        <form action="/admin/pedidos" className="flex flex-wrap gap-2 border-b border-line p-4">
          {status && <input type="hidden" name="estado" value={status} />}
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <Input name="q" defaultValue={q} placeholder="N° de pedido, nombre, correo o teléfono…" className="h-10 pl-9" />
          </div>
          <Select name="pago" defaultValue={payment ?? ""} className="h-10 w-auto" aria-label="Medio de pago">
            <option value="">Todos los pagos</option>
            <option value="webpay">Webpay</option>
            <option value="transfer">Transferencia</option>
          </Select>
          <Button type="submit" variant="outline" size="sm" className="h-10">
            Buscar
          </Button>
        </form>
        {rows.length === 0 ? (
          <EmptyState title="No hay pedidos con estos filtros" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Pedido</Th>
                <Th>Cliente</Th>
                <Th>Entrega</Th>
                <Th>Pago</Th>
                <Th>Estado</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((order) => (
                <tr key={order.id} className="hover:bg-surface-2">
                  <Td>
                    <Link href={`/admin/pedidos/${order.id}`} className="font-semibold text-brand-600 hover:underline">
                      {formatOrderNumber(order.id)}
                    </Link>
                    <p className="text-xs text-muted">{formatDateTime(order.createdAt)}</p>
                  </Td>
                  <Td>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-xs text-muted">{order.customerEmail}</p>
                  </Td>
                  <Td className="text-muted">
                    {DELIVERY_METHOD_LABELS[order.deliveryMethod]}
                    {order.shippingCommune && <span className="block text-xs">{order.shippingCommune}</span>}
                  </Td>
                  <Td>
                    {PAYMENT_METHOD_SHORT[order.paymentMethod]}
                    {order.testPayment && order.paymentMethod === "webpay" && (
                      <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">PRUEBA</span>
                    )}
                  </Td>
                  <Td>
                    <Badge tone={ORDER_STATUS_TONES[order.status]}>
                      {orderStatusLabel(order.status, order.deliveryMethod === "pickup")}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <span className="font-semibold tabular-nums">{formatCLP(order.total)}</span>
                    <span className="block text-xs text-muted">
                      {order.itemCount} {order.itemCount === 1 ? "unidad" : "unidades"}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <AdminPagination basePath="/admin/pedidos" params={{ estado: status, pago: payment, q }} page={page} pageCount={pageCount} />
      </Card>
    </>
  );
}
