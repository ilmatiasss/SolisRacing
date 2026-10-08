"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { formatCLP } from "@/lib/format";
import { CartLine } from "./cart-lines";
import { cartTotals, useCartDrawer, useCartItems } from "./cart-store";

export function CartButton() {
  const items = useCartItems();
  const { setOpen } = useCartDrawer();
  const { count } = cartTotals(items);
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={count ? `Carrito: ${count} productos` : "Carrito vacío"}
      className="relative flex size-10 cursor-pointer items-center justify-center rounded-xl text-zinc-200 transition-colors hover:bg-white/5 hover:text-white"
    >
      <ShoppingCart className="size-5.5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] leading-5 font-bold text-white tabular-nums">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

export function CartDrawer({ freeShippingThreshold }: { freeShippingThreshold: number }) {
  const items = useCartItems();
  const { open, setOpen } = useCartDrawer();
  const { count, subtotal } = cartTotals(items);
  const close = () => setOpen(false);
  const missing = freeShippingThreshold > 0 ? freeShippingThreshold - subtotal : 0;

  return (
    <Drawer
      open={open}
      onClose={close}
      title={`Tu carrito${count ? ` (${count})` : ""}`}
      footer={
        items.length > 0 && (
          <div className="space-y-4">
            {freeShippingThreshold > 0 && (
              <div className="text-sm">
                {missing > 0 ? (
                  <p className="text-muted">
                    Te faltan <strong className="text-fg">{formatCLP(missing)}</strong> para el despacho gratis.
                  </p>
                ) : (
                  <p className="font-medium text-emerald-400">¡Tu pedido tiene despacho gratis!</p>
                )}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all"
                    style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                  />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between text-base">
              <span className="text-muted">Subtotal</span>
              <span className="font-display text-2xl font-bold tabular-nums">{formatCLP(subtotal)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/carrito" onClick={close} className={buttonClasses({ variant: "outline" })}>
                Ver carrito
              </Link>
              <Link href="/checkout" onClick={close} className={buttonClasses()}>
                Ir a pagar
              </Link>
            </div>
          </div>
        )
      }
    >
      {items.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-surface-2">
            <ShoppingCart className="size-7 text-muted" />
          </div>
          <div>
            <p className="font-semibold">Tu carrito está vacío</p>
            <p className="mt-1 text-sm text-muted">Explora el catálogo y encuentra piezas para tu auto.</p>
          </div>
          <Link href="/productos" onClick={close} className={buttonClasses({ variant: "outline" })}>
            Ver catálogo
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-line px-5">
          {items.map((line) => (
            <CartLine key={line.productId} line={line} onNavigate={close} />
          ))}
        </ul>
      )}
    </Drawer>
  );
}
