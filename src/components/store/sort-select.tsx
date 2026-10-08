"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Select } from "@/components/ui/field";
import { catalogHref, SORT_OPTIONS, type CatalogFilters, type SortOption } from "@/lib/catalog-filters";
import { cn } from "@/lib/cn";

export function SortSelect({ filters }: { filters: CatalogFilters }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="orden" className="hidden text-sm text-muted sm:block">
        Ordenar por
      </label>
      <Select
        id="orden"
        value={filters.orden}
        className={cn("h-10 w-auto min-w-48", pending && "opacity-60")}
        onChange={(event) =>
          startTransition(() =>
            router.push(catalogHref({ ...filters, orden: event.target.value as SortOption, pagina: 1 })),
          )
        }
      >
        {Object.entries(SORT_OPTIONS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
    </div>
  );
}
