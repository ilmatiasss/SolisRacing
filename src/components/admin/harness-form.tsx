"use client";

import { Cable, Cpu, Gauge, Hammer, Plus, Save, Trash2, Wrench, X } from "lucide-react";
import { useState } from "react";
import { ActionForm, ActionSubmit } from "@/components/admin/action-form";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { saveHarness } from "@/lib/actions/admin/harness";
import { DEFAULT_SENSOR_COUNT, HARNESS_CYLINDERS, estimateHarness, type HarnessPricing } from "@/lib/harness";
import { formatCLP } from "@/lib/format";

/** Fila editable: el precio se escribe como texto y se valida al guardar. */
type Row = { name: string; price: string };
type Values = {
  makes: string[];
  ecus: Row[];
  sensors: Row[];
  extras: Row[];
  perCylinder: string;
  originalSensorExtra: string;
  laborBase: string;
  laborPerSensor: string;
  margin: string;
};

const toRows = (options: { name: string; price: number }[]): Row[] => options.map(({ name, price }) => ({ name, price: String(price) }));

function toInitialValues(pricing: HarnessPricing): Values {
  return {
    makes: pricing.makes,
    ecus: toRows(pricing.ecus),
    sensors: toRows(pricing.sensors),
    extras: toRows(pricing.extras),
    perCylinder: String(pricing.perCylinder),
    originalSensorExtra: String(pricing.originalSensorExtra),
    laborBase: String(pricing.laborBase),
    laborPerSensor: String(pricing.laborPerSensor),
    margin: String(pricing.margin),
  };
}

/** "$12.000" → 12000 (vacío o inválido → 0), igual que lo entiende el servidor. */
const amount = (text: string) => Number(text.replace(/[^\d]/g, "")) || 0;
const toPricing = (values: Values): HarnessPricing => ({
  makes: values.makes,
  ecus: values.ecus.filter((row) => row.name.trim()).map((row) => ({ name: row.name.trim(), price: amount(row.price) })),
  sensors: values.sensors.filter((row) => row.name.trim()).map((row) => ({ name: row.name.trim(), price: amount(row.price) })),
  extras: values.extras.filter((row) => row.name.trim()).map((row) => ({ name: row.name.trim(), price: amount(row.price) })),
  perCylinder: amount(values.perCylinder),
  originalSensorExtra: amount(values.originalSensorExtra),
  laborBase: amount(values.laborBase),
  laborPerSensor: amount(values.laborPerSensor),
  margin: Math.min(amount(values.margin), 50),
});

/** Los números se envían como texto limpio (sin $ ni puntos) para que el servidor los valide. */
const serialize = (values: Values) =>
  JSON.stringify({
    ...values,
    ecus: values.ecus.map((row) => ({ ...row, price: row.price.replace(/[^\d]/g, "") || (row.name ? "0" : "") })),
    sensors: values.sensors.map((row) => ({ ...row, price: row.price.replace(/[^\d]/g, "") || (row.name ? "0" : "") })),
    extras: values.extras.map((row) => ({ ...row, price: row.price.replace(/[^\d]/g, "") || (row.name ? "0" : "") })),
    perCylinder: values.perCylinder.replace(/[^\d]/g, ""),
    originalSensorExtra: values.originalSensorExtra.replace(/[^\d]/g, ""),
    laborBase: values.laborBase.replace(/[^\d]/g, ""),
    laborPerSensor: values.laborPerSensor.replace(/[^\d]/g, ""),
    margin: values.margin.replace(/[^\d]/g, ""),
  });

/**
 * Editor de los valores del cotizador de ramales: listas por filas, mano de obra y margen, con una
 * vista previa que recalcula al escribir (con la misma función que usa la tienda).
 */
export function HarnessForm({ initial }: { initial: HarnessPricing }) {
  const [values, setValues] = useState(() => toInitialValues(initial));
  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((current) => ({ ...current, [key]: value }));

  return (
    <ActionForm action={saveHarness} className="grid items-start gap-6 xl:grid-cols-[1fr_22rem]">
      <input type="hidden" name="harness" value={serialize(values)} />

      <div className="space-y-6">
        <Section
          icon={Hammer}
          title="Mano de obra"
          description="Lo que cobras por armar el ramal. Aparece como una línea aparte en la cotización del cliente. En 0 no se muestra."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Money
              id="laborBase"
              label="Mano de obra base (por ramal)"
              hint="Monto fijo por cada ramal, sin importar su tamaño."
              value={values.laborBase}
              onChange={(value) => set("laborBase", value)}
            />
            <Money
              id="laborPerSensor"
              label="Mano de obra por sensor"
              hint="Se suma por cada sensor que lleve el ramal."
              value={values.laborPerSensor}
              onChange={(value) => set("laborPerSensor", value)}
            />
          </div>
        </Section>

        <PricedList
          icon={Cpu}
          title="Computadoras FuelTech"
          description="Precio base del ramal según la computadora (cable principal y conectores de la ECU)."
          rows={values.ecus}
          onChange={(rows) => set("ecus", rows)}
          namePlaceholder="Ej: FT550"
          addLabel="Agregar computadora"
          idPrefix="ecu"
        />

        <Section icon={Wrench} title="Por cilindro y sensores originales" description="Valores que se multiplican según lo que elija el cliente.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Money
              id="perCylinder"
              label="Valor por cilindro (inyector y bobina)"
              value={values.perCylinder}
              onChange={(value) => set("perCylinder", value)}
            />
            <Money
              id="originalSensorExtra"
              label="Recargo por sensor original (conector OEM)"
              hint="Se suma por sensor cuando el cliente usa los del auto."
              value={values.originalSensorExtra}
              onChange={(value) => set("originalSensorExtra", value)}
            />
          </div>
        </Section>

        <PricedList
          icon={Gauge}
          title="Sensores"
          description={`El cliente marca los que lleva su motor. Los primeros ${DEFAULT_SENSOR_COUNT} vienen marcados por defecto.`}
          rows={values.sensors}
          onChange={(rows) => set("sensors", rows)}
          namePlaceholder="Ej: Presión de aceite"
          addLabel="Agregar sensor"
          idPrefix="sensor"
        />

        <PricedList
          icon={Cable}
          title="Extras"
          description="Opciones adicionales que el cliente puede sumar."
          rows={values.extras}
          onChange={(rows) => set("extras", rows)}
          namePlaceholder="Ej: Control de boost"
          addLabel="Agregar extra"
          idPrefix="extra"
        />

        <Section icon={Wrench} title="Marcas de motor" description="Las que aparecen para elegir; el cliente también puede escribir «Otra».">
          <MakesEditor makes={values.makes} onChange={(makes) => set("makes", makes)} />
        </Section>

        <Section icon={Gauge} title="Rango que ve el cliente" description="El valor es aproximado: se muestra un rango alrededor del cálculo.">
          <Money
            id="margin"
            label="Margen del rango (%)"
            hint="15 muestra desde 15 % menos hasta 15 % más (máximo 50)."
            value={values.margin}
            onChange={(value) => set("margin", value)}
            prefix=""
            suffix="%"
            className="max-w-xs"
          />
        </Section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-6">
        <Preview pricing={toPricing(values)} />
        <ActionSubmit size="lg" className="w-full">
          <Save className="size-4.5" />
          Guardar valores
        </ActionSubmit>
      </aside>
    </ActionForm>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Cpu;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface shadow-xs">
      <div className="flex items-start gap-3 border-b border-line px-5 py-4">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-600/15 text-brand-500">
          <Icon className="size-4.5" />
        </span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Money({
  id,
  label,
  hint,
  value,
  onChange,
  prefix = "$",
  suffix,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  return (
    <Field label={label} htmlFor={`harness-${id}`} hint={hint} className={className}>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-muted">{prefix}</span>}
        <Input
          id={`harness-${id}`}
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`tabular-nums ${prefix ? "pl-7" : ""} ${suffix ? "pr-9" : ""}`}
        />
        {suffix && <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted">{suffix}</span>}
      </div>
    </Field>
  );
}

function PricedList({
  icon,
  title,
  description,
  rows,
  onChange,
  namePlaceholder,
  addLabel,
  idPrefix,
}: {
  icon: typeof Cpu;
  title: string;
  description: string;
  rows: Row[];
  onChange: (rows: Row[]) => void;
  namePlaceholder: string;
  addLabel: string;
  idPrefix: string;
}) {
  const update = (index: number, patch: Partial<Row>) => onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  return (
    <Section icon={icon} title={title} description={description}>
      <ul className="space-y-2">
        {rows.length === 0 && <li className="text-sm text-muted">Sin opciones todavía.</li>}
        {rows.map((row, index) => (
          <li key={index} className="grid grid-cols-[1fr_9rem_auto] items-center gap-2">
            <Input
              aria-label={`${title}: nombre ${index + 1}`}
              id={`${idPrefix}-name-${index}`}
              value={row.name}
              placeholder={namePlaceholder}
              onChange={(event) => update(index, { name: event.target.value })}
            />
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted">$</span>
              <Input
                aria-label={`${title}: precio ${index + 1}`}
                id={`${idPrefix}-price-${index}`}
                inputMode="numeric"
                value={row.price}
                onChange={(event) => update(index, { price: event.target.value })}
                className="pl-6 tabular-nums"
              />
            </div>
            <button
              type="button"
              aria-label={`Quitar ${row.name || "fila"}`}
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              className="flex size-10 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-red-400"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" className="mt-3" onClick={() => onChange([...rows, { name: "", price: "" }])}>
        <Plus className="size-4" />
        {addLabel}
      </Button>
    </Section>
  );
}

function MakesEditor({ makes, onChange }: { makes: string[]; onChange: (makes: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const name = draft.trim();
    if (!name || makes.some((make) => make.toLowerCase() === name.toLowerCase())) return setDraft("");
    onChange([...makes, name]);
    setDraft("");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Input
          aria-label="Agregar marca de motor"
          value={draft}
          placeholder="Ej: Lexus"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          className="w-52"
        />
        <Button variant="outline" size="md" onClick={add} disabled={!draft.trim()}>
          <Plus className="size-4" />
          Agregar marca
        </Button>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {makes.map((make) => (
          <li key={make} className="flex items-center gap-1 rounded-full border border-line bg-surface-2 py-1 pr-1 pl-3 text-sm">
            {make}
            <button
              type="button"
              aria-label={`Quitar ${make}`}
              onClick={() => onChange(makes.filter((value) => value !== make))}
              className="flex size-6 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-white/10 hover:text-fg"
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Cálculo de ejemplo con los valores que se están escribiendo: así se ve el efecto antes de guardar. */
function Preview({ pricing }: { pricing: HarnessPricing }) {
  const [ecu, setEcu] = useState("");
  const [cylinders, setCylinders] = useState<number>(4);
  const [originals, setOriginals] = useState(true);
  const selectedEcu = pricing.ecus.some((option) => option.name === ecu) ? ecu : (pricing.ecus[0]?.name ?? "");
  const estimate = estimateHarness(pricing, {
    ecu: selectedEcu,
    cylinders,
    originalSensors: originals,
    sensors: pricing.sensors.slice(0, DEFAULT_SENSOR_COUNT).map((sensor) => sensor.name),
    extras: [],
  });

  return (
    <section className="rounded-2xl border border-brand-600/40 bg-surface p-5 shadow-xs" aria-label="Vista previa del cálculo">
      <p className="text-xs font-bold tracking-widest text-brand-500 uppercase">Así lo verá el cliente</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Select aria-label="Computadora de ejemplo" value={selectedEcu} onChange={(event) => setEcu(event.target.value)} className="h-10">
          {pricing.ecus.map((option) => (
            <option key={option.name} value={option.name}>
              {option.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Cilindros de ejemplo" value={cylinders} onChange={(event) => setCylinders(Number(event.target.value))} className="h-10">
          {HARNESS_CYLINDERS.map((count) => (
            <option key={count} value={count}>
              {count} cilindros
            </option>
          ))}
        </Select>
      </div>
      <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" checked={originals} onChange={(event) => setOriginals(event.target.checked)} className="accent-brand-600" />
        Sensores originales
      </label>
      {estimate ? (
        <>
          <p className="mt-4 font-display text-3xl font-extrabold tracking-wide italic" aria-live="polite">
            {formatCLP(estimate.min)} – {formatCLP(estimate.max)}
          </p>
          <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
            {estimate.lines.map((line) => (
              <li key={line.label} className="flex justify-between gap-3">
                <span className="text-muted">{line.label}</span>
                <span className="tabular-nums">{formatCLP(line.amount)}</span>
              </li>
            ))}
            <li className="flex justify-between gap-3 border-t border-line pt-1.5 font-semibold">
              <span>Total calculado</span>
              <span className="tabular-nums">{formatCLP(estimate.total)}</span>
            </li>
          </ul>
          <p className="mt-2 text-xs text-muted">Ejemplo con los {DEFAULT_SENSOR_COUNT} primeros sensores y sin extras.</p>
        </>
      ) : (
        <p className="mt-4 text-sm text-muted">Agrega una computadora para ver el cálculo.</p>
      )}
    </section>
  );
}
