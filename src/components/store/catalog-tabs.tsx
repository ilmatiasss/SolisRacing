"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { ProductCardData } from "@/lib/data/catalog";
import { ProductGrid } from "./product-card";

type Tab = {
  id: string;
  label: ReactNode;
  /** Productos de la pestaña (ids de `products`, en orden). */
  productIds: number[];
  href: string;
  linkLabel: string;
};

/**
 * Pestañas accesibles (flechas, Inicio y Fin) para recorrer el catálogo por categoría en la portada.
 * Recibe la lista de productos una sola vez y arma cada pestaña al vuelo, así la página pesa poco.
 */
export function CatalogTabs({ tabs, products, label }: { tabs: Tab[]; products: ProductCardData[]; label: string }) {
  const [active, setActive] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();
  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

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
  const shelf = current.productIds
    .map((id) => byId.get(id))
    .filter((product): product is ProductCardData => Boolean(product));

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
        <ProductGrid products={shelf} animate />
        <div className="mt-8 flex justify-center">
          <Link href={current.href} className={buttonClasses({ variant: "outline", size: "lg", className: "group" })}>
            {current.linkLabel}
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
