"use client";

import { CalendarCheck, ChevronLeft, ChevronRight, MapPin, Send } from "lucide-react";
import { startTransition, useActionState, useState, useSyncExternalStore, type ReactNode } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { submitInquiry, type InquiryFormState } from "@/lib/actions/inquiries";
import {
  BOOKING_MAX_DAYS,
  BOOKING_TIMES,
  addDays,
  formatBookingDate,
  formatMonth,
  isBookableDate,
  monthGrid,
  shiftMonth,
  todayInChile,
  type ServiceLocation,
} from "@/lib/booking";
import { cn } from "@/lib/cn";
import { whatsappLink } from "@/lib/format";

type ServiceOption = { id: number; name: string };

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

const subscribeToNothing = () => () => {};

/**
 * Agenda de servicios en pasos: servicio, lugar, día y hora, y datos de contacto.
 * Es una solicitud: la tienda la confirma por WhatsApp (la disponibilidad real se ajustará en el panel).
 */
export function ServiceBooking({
  services,
  locations,
  whatsapp,
}: {
  services: ServiceOption[];
  locations: ServiceLocation[];
  whatsapp: string;
}) {
  const [state, action, pending] = useActionState<InquiryFormState, FormData>(submitInquiry, {});
  const errors = state.fieldErrors ?? {};
  // "Hoy" se lee en el navegador (hora de Chile): en el servidor queda vacío y el calendario se dibuja al cargar.
  const today = useSyncExternalStore(subscribeToNothing, todayInChile, () => null);
  const [shownMonth, setMonth] = useState<string | null>(null);
  const month = shownMonth ?? (today ? addDays(today, 1).slice(0, 7) : null);
  const [date, setDate] = useState("");
  const [summary, setSummary] = useState<{ service: string; location: string; date: string; time: string } | null>(null);

  if (state.ok && summary) {
    const message = `Hola, solicité hora para ${summary.service} en ${summary.location} el ${formatBookingDate(summary.date)} a las ${summary.time}.`;
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center" role="status">
        <CalendarCheck className="mx-auto size-10 text-emerald-400" />
        <p className="mt-4 font-display text-2xl font-bold uppercase italic">¡Solicitud enviada!</p>
        <p className="mt-2 text-zinc-200">
          {summary.service} · {summary.location}
          <br />
          El {formatBookingDate(summary.date)} a las {summary.time}
        </p>
        <p className="mt-3 text-sm text-zinc-300">Te confirmamos la hora y el presupuesto por WhatsApp a la brevedad.</p>
        <a
          href={whatsappLink(whatsapp, message)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses({ variant: "outline", className: "mt-6" })}
        >
          <WhatsAppIcon className="size-4.5" />
          Escribir por WhatsApp
        </a>
      </div>
    );
  }

  const lastDay = today ? addDays(today, BOOKING_MAX_DAYS) : null;
  const canGoBack = today && month ? month > today.slice(0, 7) : false;
  const canGoForward = lastDay && month ? month < lastDay.slice(0, 7) : false;

  return (
    <form
      noValidate
      className="grid gap-8 lg:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const serviceId = Number(formData.get("serviceId"));
        setSummary({
          service: services.find((service) => service.id === serviceId)?.name ?? "tu servicio",
          location: String(formData.get("location") ?? ""),
          date: String(formData.get("preferredDate") ?? ""),
          time: String(formData.get("preferredTime") ?? ""),
        });
        // Invocación manual: así lo elegido no se borra si hay errores de validación.
        startTransition(() => action(formData));
      }}
    >
      <input type="hidden" name="kind" value="service" />
      <input type="hidden" name="preferredDate" value={date} />
      <div className="hidden" aria-hidden="true">
        <label htmlFor="booking-website">No completes este campo</label>
        <input id="booking-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-7">
        <Step number={1} title="Servicio">
          <Select id="serviceId" name="serviceId" aria-label="Servicio" defaultValue={services[0]?.id}>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </Select>
        </Step>

        <Step number={2} title="¿Dónde?" error={errors.location}>
          <div role="radiogroup" aria-label="Lugar de atención" className="grid gap-3 sm:grid-cols-2">
            {locations.map((location, index) => (
              <label
                key={location.name}
                className="flex cursor-pointer gap-3 rounded-xl border border-line bg-surface-2 p-4 transition-colors hover:border-line-strong has-[:checked]:border-brand-500 has-[:checked]:bg-brand-600/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500"
              >
                <input
                  type="radio"
                  name="location"
                  value={location.name}
                  defaultChecked={index === 0}
                  className="sr-only"
                />
                <MapPin className="mt-0.5 size-5 shrink-0 text-brand-500" />
                <span>
                  <span className="block font-semibold">{location.name}</span>
                  {location.detail && <span className="block text-sm text-muted">{location.detail}</span>}
                </span>
              </label>
            ))}
          </div>
        </Step>

        <Step number={3} title="Día" error={errors.preferredDate}>
          <div className="rounded-xl border border-line bg-surface-2 p-4">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => month && setMonth(shiftMonth(month, -1))}
                disabled={!canGoBack}
                aria-label="Mes anterior"
                className="flex size-9 items-center justify-center rounded-lg text-zinc-300 hover:bg-white/5 disabled:opacity-30"
              >
                <ChevronLeft className="size-5" />
              </button>
              <p className="font-semibold" aria-live="polite">
                {month ? formatMonth(month) : "…"}
              </p>
              <button
                type="button"
                onClick={() => month && setMonth(shiftMonth(month, 1))}
                disabled={!canGoForward}
                aria-label="Mes siguiente"
                className="flex size-9 items-center justify-center rounded-lg text-zinc-300 hover:bg-white/5 disabled:opacity-30"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted" aria-hidden="true">
              {WEEKDAYS.map((day) => (
                <span key={day} className="py-1">
                  {day}
                </span>
              ))}
            </div>
            <div className="mt-1 grid min-h-[16rem] grid-cols-7 content-start gap-1">
              {today &&
                month &&
                monthGrid(month).map((day, index) => {
                  if (!day) return <span key={`hueco-${index}`} />;
                  const available = isBookableDate(day, today);
                  const selected = day === date;
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={!available}
                      onClick={() => setDate(day)}
                      aria-pressed={selected}
                      aria-label={formatBookingDate(day)}
                      className={cn(
                        "h-10 rounded-lg text-sm font-medium transition-colors",
                        available ? "text-fg hover:bg-white/10" : "text-zinc-600 line-through decoration-zinc-700",
                        selected && "bg-brand-600 text-white shadow-[0_0_16px_rgba(255,30,30,0.5)] hover:bg-brand-600",
                      )}
                    >
                      {Number(day.slice(8))}
                    </button>
                  );
                })}
            </div>
            <p className="mt-3 text-xs text-muted">
              {date ? (
                <>
                  Elegiste el <span className="font-semibold text-fg">{formatBookingDate(date)}</span>.
                </>
              ) : (
                "De lunes a sábado, hasta dos meses adelante."
              )}
            </p>
          </div>
        </Step>
      </div>

      <div className="space-y-7">
        <Step number={4} title="Hora" error={errors.preferredTime}>
          <div className="space-y-3">
            {Object.entries(BOOKING_TIMES).map(([part, times]) => (
              <div key={part}>
                <p className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">{part}</p>
                <div role="radiogroup" aria-label={part} className="grid grid-cols-3 gap-2">
                  {times.map((time) => (
                    <label
                      key={time}
                      className="cursor-pointer rounded-lg border border-line bg-surface-2 py-2.5 text-center text-sm font-semibold transition-colors hover:border-line-strong has-[:checked]:border-brand-500 has-[:checked]:bg-brand-600 has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500"
                    >
                      <input type="radio" name="preferredTime" value={time} className="sr-only" />
                      {time}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Step>

        <Step number={5} title="Tus datos">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="booking-name" error={errors.name}>
              <Input id="booking-name" name="name" autoComplete="name" aria-invalid={!!errors.name} />
            </Field>
            <Field label="Teléfono / WhatsApp" htmlFor="booking-phone" error={errors.phone}>
              <Input id="booking-phone" name="phone" type="tel" autoComplete="tel" placeholder="+56 9 …" aria-invalid={!!errors.phone} />
            </Field>
            <Field label="Correo" htmlFor="booking-email" error={errors.email}>
              <Input id="booking-email" name="email" type="email" autoComplete="email" aria-invalid={!!errors.email} />
            </Field>
            <Field label="Auto (marca, modelo y año)" htmlFor="booking-vehicle" optional error={errors.vehicle}>
              <Input id="booking-vehicle" name="vehicle" placeholder="Ej: Subaru WRX 2018" />
            </Field>
            <Field label="Cuéntanos de tu auto y lo que buscas" htmlFor="booking-message" optional className="sm:col-span-2">
              <Textarea
                id="booking-message"
                name="message"
                rows={3}
                placeholder="Modificaciones instaladas, uso (calle, pista), objetivos de potencia…"
              />
            </Field>
          </div>
        </Step>

        {state.error && (
          <p className="text-sm text-red-400" role="alert">
            {state.error}
          </p>
        )}
        <div>
          <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
            <Send className="size-4.5" />
            {pending ? "Enviando…" : "Solicitar hora"}
          </Button>
          <p className="mt-2 text-xs text-muted">Te confirmamos la hora por WhatsApp; no se cobra nada al agendar.</p>
        </div>
      </div>
    </form>
  );
}

function Step({
  number,
  title,
  error,
  children,
}: {
  number: number;
  title: string;
  error?: string[];
  children: ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-3 flex items-center gap-3 font-display text-xl font-bold uppercase italic">
        <span className="flex size-7 items-center justify-center rounded-full bg-brand-600 text-sm not-italic text-white">
          {number}
        </span>
        {title}
      </legend>
      {children}
      {error?.[0] && (
        <p className="mt-2 text-sm text-red-400" role="alert">
          {error[0]}
        </p>
      )}
    </fieldset>
  );
}
