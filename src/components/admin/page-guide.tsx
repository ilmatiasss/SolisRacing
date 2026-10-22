"use client";

import { ChevronDown, Lightbulb, LifeBuoy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTION_GUIDES } from "./guides";

/** «¿Cómo funciona esta sección?»: guía corta y plegable bajo el título de cada sección del menú. */
export function PageGuide() {
  const guide = SECTION_GUIDES[usePathname()];
  if (!guide) return null;
  return (
    <details className="group mt-4 max-w-2xl rounded-lg border border-line bg-surface-2/50 text-sm open:bg-surface-2">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3.5 py-2.5 font-medium text-zinc-300 select-none hover:text-white [&::-webkit-details-marker]:hidden">
        <LifeBuoy className="size-4 text-brand-500" aria-hidden="true" />
        ¿Cómo funciona esta sección?
        <ChevronDown className="ml-auto size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t border-line px-3.5 pt-3 pb-3.5">
        <p className="text-zinc-300">{guide.intro}</p>
        <ol className="mt-3 space-y-2">
          {guide.steps.map((step, index) => (
            <li key={step} className="flex gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-600/20 text-xs font-bold text-brand-400">
                {index + 1}
              </span>
              <span className="text-muted">{step}</span>
            </li>
          ))}
        </ol>
        {guide.tip && (
          <p className="mt-3 flex gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-amber-100">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden="true" />
            {guide.tip}
          </p>
        )}
        <Link
          href={guide.more ? `/admin/ayuda#${guide.more}` : "/admin/ayuda"}
          className="mt-3 inline-block text-xs font-semibold text-brand-400 hover:text-brand-300"
        >
          {guide.more ? "Ver la guía paso a paso →" : "Ver todas las guías →"}
        </Link>
      </div>
    </details>
  );
}
