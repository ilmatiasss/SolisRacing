"use client";

import { CalendarPlus, Clock, MapPin, Plus, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import { ActionForm, ActionSubmit } from "@/components/admin/action-form";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { saveBooking } from "@/lib/actions/admin/booking";
import {
  DEFAULT_BOOKING_TIMES,
  DEFAULT_BOOKING_WEEKDAYS,
  formatBookingDate,
  normalizeTime,
  type BookingConfig,
  type BookingLocation,
} from "@/lib/booking";
import { cn } from "@/lib/cn";

/** Lunes primero, como en el calendario de la tienda. */
const WEEKDAYS = [
  { day: 1, label: "Lu" },
  { day: 2, label: "Ma" },
  { day: 3, label: "Mi" },
  { day: 4, label: "Ju" },
  { day: 5, label: "Vi" },
  { day: 6, label: "Sá" },
  { day: 0, label: "Do" },
];

const sortedUnique = <T,>(values: T[]) => [...new Set(values)].sort();

/**
 * Disponibilidad de la agenda: lugares, modo (todas las semanas o solo fechas de visita), días,
 * horarios y días bloqueados. Se envía como JSON a `saveBooking`.
 */
export function BookingForm({ initial, today }: { initial: BookingConfig; today: string }) {
  const [config, setConfig] = useState(initial);

  const updateLocation = (index: number, patch: Partial<BookingLocation>) =>
    setConfig((current) => ({
      ...current,
      locations: current.locations.map((location, i) => (i === index ? { ...location, ...patch } : location)),
    }));

  return (
    <ActionForm action={saveBooking} className="space-y-5">
      <input type="hidden" name="booking" value={JSON.stringify(config)} />

      {config.locations.map((location, index) => (
        <LocationEditor
          key={index}
          index={index}
          location={location}
          today={today}
          onChange={(patch) => updateLocation(index, patch)}
          onRemove={
            config.locations.length > 1
              ? () => setConfig((current) => ({ ...current, locations: current.locations.filter((_, i) => i !== index) }))
              : undefined
          }
        />
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          setConfig((current) => ({
            ...current,
            locations: [
              ...current.locations,
              {
                name: "",
                detail: "",
                mode: "dates",
                weekdays: [...DEFAULT_BOOKING_WEEKDAYS],
                times: [...DEFAULT_BOOKING_TIMES],
                dates: [],
                blocked: [],
              },
            ],
          }))
        }
      >
        <Plus className="size-4" />
        Agregar lugar
      </Button>

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-line bg-surface p-5">
        <Field
          label="Anticipación máxima (días)"
          htmlFor="booking-max-days"
          hint="Hasta cuántos días hacia adelante se puede pedir hora."
          className="w-56"
        >
          <Input
            id="booking-max-days"
            type="number"
            min={7}
            max={180}
            value={config.maxDays}
            onChange={(event) => setConfig((current) => ({ ...current, maxDays: Number(event.target.value) || 0 }))}
          />
        </Field>
        <ActionSubmit size="md">
          <Save className="size-4" />
          Guardar agenda
        </ActionSubmit>
      </div>
    </ActionForm>
  );
}

function LocationEditor({
  index,
  location,
  today,
  onChange,
  onRemove,
}: {
  index: number;
  location: BookingLocation;
  today: string;
  onChange: (patch: Partial<BookingLocation>) => void;
  onRemove?: () => void;
}) {
  const id = (name: string) => `booking-${index}-${name}`;
  return (
    <section className="rounded-2xl border border-line bg-surface shadow-xs" aria-label={location.name || "Lugar nuevo"}>
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <MapPin className="size-4.5 text-brand-600" />
          {location.name || "Lugar nuevo"}
        </h2>
        {onRemove && (
          <Button variant="ghost" size="sm" onClick={onRemove} className="text-muted hover:text-red-600">
            <Trash2 className="size-4" />
            Quitar lugar
          </Button>
        )}
      </div>
      <div className="space-y-6 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre" htmlFor={id("name")} hint="Lo que el cliente elige, ej: Antofagasta.">
            <Input id={id("name")} value={location.name} onChange={(event) => onChange({ name: event.target.value })} />
          </Field>
          <Field label="Detalle" htmlFor={id("detail")} optional hint="Ej: En la tienda, Ausonia 244.">
            <Input id={id("detail")} value={location.detail} onChange={(event) => onChange({ detail: event.target.value })} />
          </Field>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">¿Cuándo atiendes aquí?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                { mode: "weekly", title: "Todas las semanas", text: "En los días que marques, salvo los bloqueados." },
                { mode: "dates", title: "Solo en fechas de visita", text: "Únicamente en los días que agregues (viajes)." },
              ] as const
            ).map((option) => (
              <label
                key={option.mode}
                className="flex cursor-pointer gap-3 rounded-xl border border-line p-3 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-600/5"
              >
                <input
                  type="radio"
                  name={id("mode")}
                  checked={location.mode === option.mode}
                  onChange={() => onChange({ mode: option.mode })}
                  className="mt-1 accent-brand-600"
                />
                <span>
                  <span className="block text-sm font-semibold">{option.title}</span>
                  <span className="block text-xs text-muted">{option.text}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {location.mode === "weekly" ? (
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Días de la semana</legend>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map(({ day, label }) => {
                const active = location.weekdays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      onChange({
                        weekdays: active
                          ? location.weekdays.filter((value) => value !== day)
                          : sortedUnique([...location.weekdays, day]),
                      })
                    }
                    className={cn(
                      "size-10 cursor-pointer rounded-lg border text-sm font-semibold transition-colors",
                      active ? "border-brand-600 bg-brand-600 text-white" : "border-line text-zinc-600 hover:bg-zinc-100",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : (
          <DateList
            label="Fechas de visita"
            hint="El cliente solo podrá pedir hora en estos días."
            inputId={id("dates")}
            dates={location.dates}
            today={today}
            onChange={(dates) => onChange({ dates })}
            empty="Sin fechas: este lugar no aparece disponible hasta que agregues una."
          />
        )}

        <TimeList inputId={id("times")} times={location.times} onChange={(times) => onChange({ times })} />

        <DateList
          label="Días bloqueados"
          hint="Feriados, vacaciones o días que no atiendes."
          inputId={id("blocked")}
          dates={location.blocked}
          today={today}
          onChange={(blocked) => onChange({ blocked })}
          empty="Ninguno."
        />
      </div>
    </section>
  );
}

function DateList({
  label,
  hint,
  inputId,
  dates,
  today,
  onChange,
  empty,
}: {
  label: string;
  hint: string;
  inputId: string;
  dates: string[];
  today: string;
  onChange: (dates: string[]) => void;
  empty: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    if (!draft) return;
    onChange(sortedUnique([...dates, draft]));
    setDraft("");
  };
  // Las fechas pasadas ya no sirven: se muestran tenues.
  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        <Input
          id={inputId}
          type="date"
          min={today}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          className="w-44"
        />
        <Button variant="outline" size="md" onClick={add} disabled={!draft}>
          <CalendarPlus className="size-4" />
          Agregar
        </Button>
      </div>
      <p className="mt-1.5 text-xs text-muted">{hint}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {dates.length === 0 && <li className="text-sm text-muted">{empty}</li>}
        {dates.map((date) => (
          <li
            key={date}
            className={cn(
              "flex items-center gap-1 rounded-full border border-line bg-surface-2 py-1 pr-1 pl-3 text-sm",
              date < today && "opacity-50",
            )}
          >
            {formatBookingDate(date)}
            <button
              type="button"
              aria-label={`Quitar ${formatBookingDate(date)}`}
              onClick={() => onChange(dates.filter((value) => value !== date))}
              className="flex size-6 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-zinc-200 hover:text-fg"
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TimeList({ inputId, times, onChange }: { inputId: string; times: string[]; onChange: (times: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const time = normalizeTime(draft);
    if (!time) return;
    onChange(sortedUnique([...times, time]));
    setDraft("");
  };
  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium">
        Horarios
      </label>
      <div className="flex flex-wrap gap-2">
        <Input
          id={inputId}
          type="time"
          step={900}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          className="w-36"
        />
        <Button variant="outline" size="md" onClick={add} disabled={!normalizeTime(draft)}>
          <Clock className="size-4" />
          Agregar
        </Button>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {times.length === 0 && <li className="text-sm text-red-600">Agrega al menos un horario.</li>}
        {times.map((time) => (
          <li key={time} className="flex items-center gap-1 rounded-full border border-line bg-surface-2 py-1 pr-1 pl-3 text-sm font-medium tabular-nums">
            {time}
            <button
              type="button"
              aria-label={`Quitar ${time}`}
              onClick={() => onChange(times.filter((value) => value !== time))}
              className="flex size-6 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-zinc-200 hover:text-fg"
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
