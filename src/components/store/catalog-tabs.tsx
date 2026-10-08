"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tab = { id: string; label: ReactNode; panel: ReactNode };

/** Pestañas accesibles (flechas, Inicio y Fin) para recorrer el catálogo por categoría en la portada. */
export function CatalogTabs({ tabs, label }: { tabs: Tab[]; label: string }) {
  const [active, setActive] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();

  const select = (index: number, focus = false) => {
    const next = (index + tabs.length) % tabs.length;
    setActive(next);
    const button = buttons.current[next];
    if (focus) button?.focus();
    button?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const moves: Record<string, number> = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: tabs.length - 1 };
    if (event.key in moves) {
      event.preventDefault();
      select(moves[event.key], true);
    }
  };

  const current = tabs[active];
  if (!current) return null;

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {tabs.map((tab, index) => {
          const selected = index === active;
          return (
            <button
              key={tab.id}
              ref={(element) => {
                buttons.current[index] = element;
              }}
              id={`${baseId}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(index)}
              onKeyDown={onKeyDown}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300",
                selected
                  ? "border-red-400/60 bg-brand-600 text-white shadow-[0_0_24px_rgba(255,30,30,0.6)] [text-shadow:0_0_10px_rgba(255,255,255,0.5)]"
                  : "border-line bg-surface text-zinc-300 hover:-translate-y-0.5 hover:border-line-strong hover:text-white",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        key={current.id}
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${current.id}`}
        className="mt-6"
      >
        {current.panel}
      </div>
    </div>
  );
}
