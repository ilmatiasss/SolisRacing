"use client";

import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { findNavItem } from "./nav";

/** Rótulo sobre el título de cada página: ícono y «Grupo › Sección», según la ruta. */
export function SectionTag() {
  const found = findNavItem(usePathname());
  if (!found) return null;
  const { group, item } = found;
  return (
    <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
      <span className="flex size-6 items-center justify-center rounded-md bg-brand-600/15 text-brand-500">
        <item.icon className="size-3.5" />
      </span>
      {group && (
        <>
          {group}
          <ChevronRight className="size-3 opacity-60" aria-hidden="true" />
        </>
      )}
      <span className="text-zinc-200">{item.label}</span>
    </p>
  );
}
