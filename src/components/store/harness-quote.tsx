"use client";

import { CheckCircle2, Cpu, Send } from "lucide-react";
import { startTransition, useActionState, useState, type ReactNode } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { submitHarnessQuote, type InquiryFormState } from "@/lib/actions/inquiries";
import { cn } from "@/lib/cn";
import { formatCLP, whatsappLink } from "@/lib/format";
import { DEFAULT_SENSOR_COUNT, HARNESS_CYLINDERS, estimateHarness, type HarnessPricing } from "@/lib/harness";

const OTHER_MAKE = "Otra";

/** Cotizador de ramales: el valor aproximado se recalcula en vivo con los precios del panel. */
export function HarnessQuote({ pricing, whatsapp }: { pricing: HarnessPricing; whatsapp: string }) {
  const [state, action, pending] = useActionState<InquiryFormState, FormData>(submitHarnessQuote, {});
  const errors = state.fieldErrors ?? {};
  const [make, setMake] = useState(pricing.makes[0] ?? OTHER_MAKE);
  const [otherMake, setOtherMake] = useState("");
  const [model, setModel] = useState("");
  const [cylinders, setCylinders] = useState(4);
  const [ecu, setEcu] = useState(pricing.ecus[0]?.name ?? "");
  const [originalSensors, setOriginalSensors] = useState(true);
  const [sensors, setSensors] = useState(() => pricing.sensors.slice(0, DEFAULT_SENSOR_COUNT).map((sensor) => sensor.name));
  const [extras, setExtras] = useState<string[]>([]);

  const estimate = estimateHarness(pricing, { ecu, cylinders, originalSensors, sensors, extras });
  const makeLabel = make === OTHER_MAKE ? otherMake.trim() || "otra marca" : make;
  const whatsappMessage = [
    `Hola, quiero cotizar un ramal a medida para ${makeLabel}${model ? ` ${model}` : ""}.`,
    `${cylinders} cilindros, FuelTech ${ecu}, sensores ${originalSensors ? "originales" : "nuevos"}: ${sensors.join(", ") || "por definir"}.`,
    extras.length ? `Extras: ${extras.join(", ")}.` : "",
    estimate ? `El cotizador me dio entre ${formatCLP(estimate.min)} y ${formatCLP(estimate.max)}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center" role="status">
        <CheckCircle2 className="mx-auto size-10 text-emerald-400" />
        <p className="mt-4 font-display text-2xl font-bold uppercase italic">¡Cotización enviada!</p>
        <p className="mt-2 text-sm text-zinc-300">
          Revisamos tu configuración y te enviamos el valor final por WhatsApp o correo.
        </p>
        <a
          href={whatsappLink(whatsapp, whatsappMessage)}
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

  return (
    <form
      noValidate
      className="grid gap-8 lg:grid-cols-[1fr_22rem]"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        // Invocación manual: así lo elegido no se borra si hay errores de validación.
        startTransition(() => action(formData));
      }}
    >
      <input type="hidden" name="make" value={make === OTHER_MAKE ? otherMake : make} />
      <input type="hidden" name="cylinders" value={cylinders} />
      <input type="hidden" name="ecu" value={ecu} />
      <input type="hidden" name="originalSensors" value={originalSensors ? "si" : "no"} />
      {sensors.map((sensor) => (
        <input key={sensor} type="hidden" name="sensors" value={sensor} />
      ))}
      {extras.map((extra) => (
        <input key={extra} type="hidden" name="extras" value={extra} />
      ))}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="harness-website">No completes este campo</label>
        <input id="harness-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-8">
        {/* En celular el resumen queda al final: esta barra muestra el valor mientras se elige. */}
        {estimate && (
          <a
            href="#valor-ramal"
            className="sticky top-[4.5rem] z-30 flex items-center justify-between gap-3 rounded-xl border border-brand-600/50 bg-zinc-950 px-4 py-3 shadow-lg shadow-black/40 before:absolute before:inset-x-0 before:-top-[calc(0.5rem+1px)] before:h-2 before:bg-bg lg:hidden"
          >
            <span className="text-xs font-bold tracking-wider text-brand-500 uppercase">Aprox.</span>
            <span className="font-display text-lg font-extrabold italic">
              {formatCLP(estimate.min)} – {formatCLP(estimate.max)}
            </span>
          </a>
        )}
        <Step number={1} title="Tu motor">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Marca" htmlFor="harness-make" error={errors.make}>
              <Select id="harness-make" value={make} onChange={(event) => setMake(event.target.value)}>
                {[...pricing.makes, OTHER_MAKE].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>
            {make === OTHER_MAKE && (
              <Field label="¿Cuál marca?" htmlFor="harness-other-make" error={errors.make}>
                <Input id="harness-other-make" value={otherMake} onChange={(event) => setOtherMake(event.target.value)} />
              </Field>
            )}
            <Field label="Modelo y motor" htmlFor="harness-model" error={errors.model} className="sm:col-span-2">
              <Input
                id="harness-model"
                name="model"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder="Ej: Civic EK motor B16A, Lancer Evo IX 4G63"
                aria-invalid={!!errors.model}
              />
            </Field>
          </div>
          <p className="mt-4 mb-2 text-sm font-medium">Cilindros</p>
          <div role="radiogroup" aria-label="Cilindros" className="flex flex-wrap gap-2">
            {HARNESS_CYLINDERS.map((value) => (
              <Chip key={value} selected={cylinders === value} onClick={() => setCylinders(value)} role="radio">
                {value}
              </Chip>
            ))}
          </div>
        </Step>

        <Step number={2} title="Computadora FuelTech">
          <div role="radiogroup" aria-label="Computadora FuelTech" className="grid gap-3 sm:grid-cols-3">
            {pricing.ecus.map((option) => (
              <button
                key={option.name}
                type="button"
                role="radio"
                aria-checked={ecu === option.name}
                onClick={() => setEcu(option.name)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4 text-left font-semibold transition-colors",
                  ecu === option.name
                    ? "border-brand-500 bg-brand-600/10"
                    : "border-line bg-surface-2 hover:border-line-strong",
                )}
              >
                <Cpu className="size-5 shrink-0 text-brand-500" />
                {option.name}
              </button>
            ))}
          </div>
        </Step>

        <Step number={3} title="Sensores">
          <div role="radiogroup" aria-label="Tipo de sensores" className="mb-4 grid gap-2 sm:grid-cols-2">
            <Chip selected={originalSensors} onClick={() => setOriginalSensors(true)} role="radio">
              Originales del auto
            </Chip>
            <Chip selected={!originalSensors} onClick={() => setOriginalSensors(false)} role="radio">
              Nuevos / universales
            </Chip>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {pricing.sensors.map((sensor) => (
              <CheckOption
                key={sensor.name}
                checked={sensors.includes(sensor.name)}
                onChange={() => setSensors((list) => toggle(list, sensor.name))}
              >
                {sensor.name}
              </CheckOption>
            ))}
          </div>
        </Step>

        {pricing.extras.length > 0 && (
          <Step number={4} title="Extras">
            <div className="grid gap-2 sm:grid-cols-2">
              {pricing.extras.map((extra) => (
                <CheckOption
                  key={extra.name}
                  checked={extras.includes(extra.name)}
                  onChange={() => setExtras((list) => toggle(list, extra.name))}
                >
                  {extra.name}
                </CheckOption>
              ))}
            </div>
          </Step>
        )}

        <Step number={pricing.extras.length > 0 ? 5 : 4} title="Tus datos">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="harness-name" error={errors.name}>
              <Input id="harness-name" name="name" autoComplete="name" aria-invalid={!!errors.name} />
            </Field>
            <Field label="Teléfono / WhatsApp" htmlFor="harness-phone" error={errors.phone}>
              <Input id="harness-phone" name="phone" type="tel" autoComplete="tel" placeholder="+56 9 …" aria-invalid={!!errors.phone} />
            </Field>
            <Field label="Correo" htmlFor="harness-email" error={errors.email} className="sm:col-span-2">
              <Input id="harness-email" name="email" type="email" autoComplete="email" aria-invalid={!!errors.email} />
            </Field>
            <Field label="Comentarios" htmlFor="harness-message" optional className="sm:col-span-2">
              <Textarea
                id="harness-message"
                name="message"
                rows={3}
                placeholder="Otros sensores, largo especial, si el auto es de calle o pista…"
              />
            </Field>
          </div>
        </Step>
      </div>

      <aside id="valor-ramal" className="scroll-mt-24 lg:sticky lg:top-32 lg:self-start">
        <div className="rounded-2xl border border-brand-600/40 bg-zinc-950 p-6 shadow-[0_0_40px_rgba(255,30,30,0.15)]">
          <p className="text-xs font-bold tracking-[0.2em] text-brand-500 uppercase">Valor aproximado</p>
          {estimate ? (
            <>
              <p className="mt-2 font-display text-3xl font-extrabold italic" aria-live="polite">
                {formatCLP(estimate.min)} – {formatCLP(estimate.max)}
              </p>
              <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-sm text-zinc-300">
                {estimate.lines.map((line) => (
                  <li key={line.label} className="flex justify-between gap-3">
                    <span>{line.label}</span>
                    <span className="shrink-0 text-zinc-400">{formatCLP(line.amount)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">Elige una computadora para ver el valor.</p>
          )}
          <p className="mt-4 text-xs text-muted">
            Valor referencial con IVA incluido. El precio final lo confirmamos al revisar tu auto y el largo del ramal.
          </p>
          {state.error && (
            <p className="mt-4 text-sm text-red-400" role="alert">
              {state.error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={pending} className="mt-5 w-full">
            <Send className="size-4.5" />
            {pending ? "Enviando…" : "Pedir cotización formal"}
          </Button>
          <a
            href={whatsappLink(whatsapp, whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ variant: "outline", className: "mt-3 w-full" })}
          >
            <WhatsAppIcon className="size-4.5" />
            Consultar por WhatsApp
          </a>
        </div>
      </aside>
    </form>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 flex items-center gap-3 font-display text-xl font-bold uppercase italic">
        <span className="flex size-7 items-center justify-center rounded-full bg-brand-600 text-sm not-italic text-white">
          {number}
        </span>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Chip({
  selected,
  onClick,
  role,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  role: "radio";
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "min-w-12 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors",
        selected ? "border-brand-500 bg-brand-600 text-white" : "border-line bg-surface-2 hover:border-line-strong",
      )}
    >
      {children}
    </button>
  );
}

function CheckOption({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500",
        checked ? "border-brand-500/70 bg-brand-600/10" : "border-line bg-surface-2 hover:border-line-strong",
      )}
    >
      <input type="checkbox" checked={checked} onChange={onChange} className="size-4 accent-brand-600" />
      {children}
    </label>
  );
}
