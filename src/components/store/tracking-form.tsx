"use client";

import { Search } from "lucide-react";
import { startTransition, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { trackOrder, type TrackingState } from "@/lib/actions/tracking";

export function TrackingForm() {
  const [state, action, pending] = useActionState<TrackingState, FormData>(trackOrder, {});
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
      }}
    >
      <Field label="Número de pedido" htmlFor="number" hint="Lo encuentras en el correo de confirmación (ej: SR-1001).">
        <Input id="number" name="number" placeholder="SR-1001" required autoComplete="off" />
      </Field>
      <Field label="Correo de la compra" htmlFor="email">
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </Field>
      {state.error && (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        <Search className="size-4.5" />
        {pending ? "Buscando…" : "Ver mi pedido"}
      </Button>
    </form>
  );
}
