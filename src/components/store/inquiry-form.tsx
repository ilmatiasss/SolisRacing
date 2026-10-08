"use client";

import { CheckCircle2, Send } from "lucide-react";
import { startTransition, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { submitInquiry, type InquiryFormState } from "@/lib/actions/inquiries";

type ServiceOption = { id: number; name: string };

export function InquiryForm({
  kind,
  services = [],
  defaultServiceId,
}: {
  kind: "service" | "contact";
  services?: ServiceOption[];
  defaultServiceId?: number;
}) {
  const [state, action, pending] = useActionState<InquiryFormState, FormData>(submitInquiry, {});
  const errors = state.fieldErrors ?? {};

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center" role="status">
        <CheckCircle2 className="mx-auto size-10 text-emerald-400" />
        <p className="mt-4 font-display text-2xl font-bold uppercase italic">¡Mensaje enviado!</p>
        <p className="mt-2 text-sm text-zinc-300">
          {kind === "service"
            ? "Te contactaremos a la brevedad para confirmar la hora y el presupuesto."
            : "Te responderemos lo antes posible."}
        </p>
      </div>
    );
  }

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        // Invocación manual: así los campos no se borran si hay errores de validación.
        startTransition(() => action(formData));
      }}
    >
      <input type="hidden" name="kind" value={kind} />
      <div className="hidden" aria-hidden="true">
        <label htmlFor={`${kind}-website`}>No completes este campo</label>
        <input id={`${kind}-website`} name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {kind === "service" && services.length > 0 && (
        <Field label="Servicio" htmlFor="serviceId" className="sm:col-span-2">
          <Select id="serviceId" name="serviceId" defaultValue={defaultServiceId ?? services[0]?.id}>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Nombre" htmlFor={`${kind}-name`} error={errors.name}>
        <Input id={`${kind}-name`} name="name" autoComplete="name" required aria-invalid={!!errors.name} />
      </Field>
      <Field label="Correo" htmlFor={`${kind}-email`} error={errors.email}>
        <Input
          id={`${kind}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={!!errors.email}
        />
      </Field>
      <Field label="Teléfono / WhatsApp" htmlFor={`${kind}-phone`} optional={kind === "contact"} error={errors.phone}>
        <Input id={`${kind}-phone`} name="phone" type="tel" autoComplete="tel" placeholder="+56 9 …" />
      </Field>
      <Field label="Auto (marca, modelo y año)" htmlFor={`${kind}-vehicle`} optional error={errors.vehicle}>
        <Input id={`${kind}-vehicle`} name="vehicle" placeholder="Ej: Subaru WRX 2018" />
      </Field>
      {kind === "service" && (
        <Field label="Fecha preferida" htmlFor="preferredDate" optional error={errors.preferredDate}>
          <Input id="preferredDate" name="preferredDate" type="date" />
        </Field>
      )}
      <Field
        label={kind === "service" ? "Cuéntanos de tu auto y lo que buscas" : "Mensaje"}
        htmlFor={`${kind}-message`}
        optional={kind === "service"}
        error={errors.message}
        className="sm:col-span-2"
      >
        <Textarea
          id={`${kind}-message`}
          name="message"
          rows={4}
          placeholder={
            kind === "service"
              ? "Modificaciones instaladas, uso (calle, pista), objetivos de potencia…"
              : "¿En qué te podemos ayudar?"
          }
          aria-invalid={!!errors.message}
        />
      </Field>
      {state.error && (
        <p className="text-sm text-red-400 sm:col-span-2" role="alert">
          {state.error}
        </p>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          <Send className="size-4.5" />
          {pending ? "Enviando…" : kind === "service" ? "Solicitar hora" : "Enviar mensaje"}
        </Button>
      </div>
    </form>
  );
}
