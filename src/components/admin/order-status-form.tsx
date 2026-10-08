"use client";

import { useState } from "react";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { updateOrderStatus } from "@/lib/actions/admin/orders";
import type { DeliveryMethod, OrderStatus } from "@/lib/db/schema";
import { orderStatusLabel } from "@/lib/order-status";
import { ActionForm, ActionSubmit } from "./action-form";

const COURIERS = ["Starken", "Chilexpress", "Blue Express", "Correos de Chile", "Despacho propio"];

export function OrderStatusForm({
  orderId,
  transitions,
  deliveryMethod,
  trackingCourier,
  trackingNumber,
}: {
  orderId: number;
  transitions: OrderStatus[];
  deliveryMethod: DeliveryMethod;
  trackingCourier: string | null;
  trackingNumber: string | null;
}) {
  const [selected, setStatus] = useState<OrderStatus | "">(transitions[0] ?? "");
  // Tras un cambio de estado cambian las transiciones posibles: se ajusta la selección.
  const status = selected && transitions.includes(selected) ? selected : (transitions[0] ?? "");
  const pickup = deliveryMethod === "pickup";

  if (transitions.length === 0) {
    return <p className="text-sm text-muted">Este pedido está cerrado: no admite más cambios de estado.</p>;
  }

  return (
    <ActionForm action={updateOrderStatus} className="space-y-4">
      <input type="hidden" name="orderId" value={orderId} />
      <Field label="Nuevo estado" htmlFor="status">
        <Select id="status" name="status" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
          {transitions.map((option) => (
            <option key={option} value={option}>
              {orderStatusLabel(option, pickup)}
            </option>
          ))}
        </Select>
      </Field>
      {status === "shipped" && !pickup && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Courier" htmlFor="trackingCourier">
            <Input id="trackingCourier" name="trackingCourier" list="couriers" defaultValue={trackingCourier ?? ""} />
            <datalist id="couriers">
              {COURIERS.map((courier) => (
                <option key={courier} value={courier} />
              ))}
            </datalist>
          </Field>
          <Field label="N° de seguimiento" htmlFor="trackingNumber">
            <Input id="trackingNumber" name="trackingNumber" defaultValue={trackingNumber ?? ""} />
          </Field>
        </div>
      )}
      <Field
        label="Mensaje para el historial"
        htmlFor="note"
        optional
        hint={status === "cancelled" ? "Se mostrará como motivo de la cancelación. El stock se repone automáticamente." : undefined}
      >
        <Textarea id="note" name="note" rows={2} placeholder="Se muestra al cliente en el seguimiento" />
      </Field>
      <Checkbox name="notify" defaultChecked label="Avisar al cliente por correo" />
      <ActionSubmit size="md" className="w-full" variant={status === "cancelled" ? "danger" : "primary"}>
        {status === "cancelled" ? "Cancelar pedido" : "Actualizar estado"}
      </ActionSubmit>
    </ActionForm>
  );
}
