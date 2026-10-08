"use client";

import { ArrowRight, Info, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { formatCLP } from "@/lib/format";
import { CartLine } from "./cart-lines";
import { cartTotals, useCartItems } from "./cart-store";
import { useCartRefresh, useHydrated } from "./use-cart-refresh";

export function CartView({ freeShippingThreshold }: { freeShippingThreshold: number }) {
  const hydrated = useHydrated();
  const items = useCartItems();
  const { notices } = useCartRefresh();
  const { count, subtotal } = cartTotals(items);

  if (!hydrated) {
    return <div className="h-64 animate-pulse rounded-2xl bg-surface" />;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
        <ShoppingCart className="size-10 text-muted" />
        <p className="mt-4 font-display text-2xl font-bold uppercase italic">Tu carrito está vacío</p>
        <p className="mt-2 text-sm text-muted">Busca piezas por categoría o por el modelo de tu auto.</p>
        <Link href="/productos" className={buttonClasses({ className: "mt-6" })}>
          Ir al catálogo
        </Link>
      </div>
    );
  }

  const missing = freeShippingThreshold > 0 ? freeShippingThreshold - subtotal : 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div>
        {notices.length > 0 && (
          <div className="mb-4 space-y-1 rounded-2xl border border-signal-400/30 bg-signal-400/10 p-4 text-sm" role="status">
            {notices.map((notice) => (
              <p key={notice} className="flex gap-2">
                <Info className="mt-0.5 size-4 shrink-0 text-signal-400" />
                {notice}
              </p>
            ))}
          </div>
        )}
        <ul className="divide-y divide-line rounded-2xl border border-line bg-surface px-5">
          {items.map((line) => (
            <CartLine key={line.productId} line={line} />
          ))}
        </ul>
        <Link href="/productos" className="mt-4 inline-block text-sm font-semibold text-brand-400 hover:underline">
          ← Seguir comprando
        </Link>
      </div>
      <aside className="h-fit space-y-4 rounded-2xl border border-line bg-surface p-6 lg:sticky lg:top-32">
        <h2 className="font-display text-2xl font-bold uppercase italic">Resumen</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Productos ({count})</dt>
            <dd className="tabular-nums">{formatCLP(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Despacho</dt>
            <dd className="text-right text-muted">Se calcula al pagar</dd>
          </div>
        </dl>
        {freeShippingThreshold > 0 && (
          <p className="rounded-xl bg-surface-2 p-3 text-xs text-muted">
            {missing > 0 ? (
              <>
                Agrega <strong className="text-fg">{formatCLP(missing)}</strong> más y el despacho a domicilio es gratis.
              </>
            ) : (
              <span className="font-semibold text-emerald-400">¡Tienes despacho a domicilio gratis!</span>
            )}
          </p>
        )}
        <div className="flex items-baseline justify-between border-t border-line pt-4">
          <span className="font-semibold">Subtotal</span>
          <span className="font-display text-3xl font-bold tabular-nums">{formatCLP(subtotal)}</span>
        </div>
        <Link href="/checkout" className={buttonClasses({ size: "lg", className: "w-full" })}>
          Continuar al pago
          <ArrowRight className="size-5" />
        </Link>
        <p className="text-center text-xs text-muted">Pago seguro con Webpay o transferencia bancaria.</p>
      </aside>
    </div>
  );
}
