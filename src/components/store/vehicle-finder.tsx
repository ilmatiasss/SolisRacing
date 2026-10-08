"use client";

import { Car, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { catalogHref } from "@/lib/catalog-filters";
import { cn } from "@/lib/cn";
import type { VehicleMakeData } from "@/lib/data/catalog";

const FIRST_YEAR = 1990;

export function VehicleFinder({
  makes,
  currentYear,
  initial,
  compact = false,
  className,
}: {
  makes: VehicleMakeData[];
  currentYear: number;
  initial?: { auto?: string; modelo?: string; anio?: number };
  compact?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [make, setMake] = useState(initial?.auto ?? "");
  const [model, setModel] = useState(initial?.modelo ?? "");
  const [year, setYear] = useState(initial?.anio ? String(initial.anio) : "");

  const models = makes.find((m) => m.slug === make)?.models ?? [];
  const years = Array.from({ length: currentYear + 1 - FIRST_YEAR + 1 }, (_, i) => currentYear + 1 - i);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!make) return;
    startTransition(() => {
      router.push(
        catalogHref({ auto: make, modelo: model || undefined, anio: year ? Number(year) : undefined }),
      );
    });
  }

  return (
    <form
      onSubmit={submit}
      className={cn("grid gap-3", compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.7fr_auto]", className)}
    >
      <label className="sr-only" htmlFor="finder-make">
        Marca
      </label>
      <Select
        id="finder-make"
        value={make}
        onChange={(event) => {
          setMake(event.target.value);
          setModel("");
        }}
        required
      >
        <option value="">Marca</option>
        {makes.map((m) => (
          <option key={m.slug} value={m.slug}>
            {m.name}
          </option>
        ))}
      </Select>
      <label className="sr-only" htmlFor="finder-model">
        Modelo
      </label>
      <Select id="finder-model" value={model} onChange={(event) => setModel(event.target.value)} disabled={!make}>
        <option value="">{make ? "Todos los modelos" : "Modelo"}</option>
        {models.map((m) => (
          <option key={m.slug} value={m.slug}>
            {m.name}
          </option>
        ))}
      </Select>
      <label className="sr-only" htmlFor="finder-year">
        Año
      </label>
      <Select id="finder-year" value={year} onChange={(event) => setYear(event.target.value)} disabled={!make}>
        <option value="">Año</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>
      <Button type="submit" disabled={!make || pending} className={cn(compact && "sm:col-span-2")}>
        {pending ? <Car className="size-4.5 animate-pulse" /> : <Search className="size-4.5" />}
        Buscar repuestos
      </Button>
    </form>
  );
}
