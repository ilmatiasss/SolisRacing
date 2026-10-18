"use client";

import { CheckCircle2, Send } from "lucide-react";
import { startTransition, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { submitPrivacyRequest, type InquiryFormState } from "@/lib/actions/inquiries";
import { PRIVACY_RESPONSE_DAYS, PRIVACY_RIGHTS } from "@/lib/privacy";

/** Formulario para ejercer los derechos sobre datos personales (Ley 21.719). */
export function PrivacyRequestForm() {
  const [state, action, pending] = useActionState<InquiryFormState, FormData>(submitPrivacyRequest, {});
  const errors = state.fieldErrors ?? {};

  if (state.ok) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-8 text-center" role="status">
        <CheckCircle2 className="mx-auto size-10 text-emerald-400" />
        <p className="mt-4 font-display text-2xl font-bold uppercase">Solicitud recibida</p>
        <p className="mt-2 text-sm text-zinc-300">
          Te responderemos al correo que indicaste dentro de {PRIVACY_RESPONSE_DAYS} días corridos. Si necesitamos confirmar tu
          identidad, te lo pediremos por ese medio.
        </p>
      </div>
    );
  }

  return (
    <form
      className="grid gap-5 sm:grid-cols-2"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
      }}
    >
      <div className="hidden" aria-hidden="true">
        <label htmlFor="privacy-website">No completes este campo</label>
        <input id="privacy-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className="sm:col-span-2">
        <legend className="mb-2 text-sm font-medium">¿Qué derecho quieres ejercer?</legend>
        <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
          {PRIVACY_RIGHTS.map((right) => (
            <label
              key={right.value}
              className="flex cursor-pointer gap-3 rounded-xl border border-line bg-surface-2 p-3.5 transition-colors hover:border-line-strong has-[:checked]:border-brand-500 has-[:checked]:bg-brand-600/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500"
            >
              <input type="radio" name="right" value={right.value} className="mt-1 accent-brand-600" />
              <span>
                <span className="block font-semibold">{right.label}</span>
                <span className="block text-xs text-muted">{right.description}</span>
              </span>
            </label>
          ))}
        </div>
        {errors.right?.[0] && (
          <p className="mt-2 text-sm text-red-400" role="alert">
            {errors.right[0]}
          </p>
        )}
      </fieldset>

      <Field label="Nombre completo" htmlFor="privacy-name" error={errors.name}>
        <Input id="privacy-name" name="name" autoComplete="name" aria-invalid={!!errors.name} />
      </Field>
      <Field label="Correo" htmlFor="privacy-email" error={errors.email} hint="El que usaste al comprar o escribirnos.">
        <Input id="privacy-email" name="email" type="email" autoComplete="email" aria-invalid={!!errors.email} />
      </Field>
      <Field label="Teléfono" htmlFor="privacy-phone" optional error={errors.phone}>
        <Input id="privacy-phone" name="phone" type="tel" autoComplete="tel" placeholder="+56 9 …" />
      </Field>
      <Field label="RUT" htmlFor="privacy-rut" optional error={errors.rut} hint="Nos ayuda a encontrar tus compras.">
        <Input id="privacy-rut" name="rut" placeholder="12.345.678-5" aria-invalid={!!errors.rut} />
      </Field>
      <Field label="Detalle de tu solicitud" htmlFor="privacy-message" error={errors.message} className="sm:col-span-2">
        <Textarea
          id="privacy-message"
          name="message"
          rows={4}
          placeholder="Ej: quiero saber qué datos tienen de mí / corregir mi dirección / que eliminen mis datos."
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
          {pending ? "Enviando…" : "Enviar solicitud"}
        </Button>
        <p className="mt-2 text-xs text-muted">
          Usaremos estos datos solo para responder tu solicitud y dejar registro de ella.
        </p>
      </div>
    </form>
  );
}
