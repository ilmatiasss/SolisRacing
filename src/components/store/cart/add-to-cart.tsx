"use client";

import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { cartDrawer, cartStore, useCartItems, type CartItem } from "./cart-store";

type ProductSnapshot = Omit<CartItem, "quantity">;

/** Botón compacto para agregar desde las tarjetas del catálogo. */
export function QuickAddButton({ product, className }: { product: ProductSnapshot; className?: string }) {
  const items = useCartItems();
  const inCart = items.find((line) => line.productId === product.productId);
  const atLimit = inCart ? inCart.quantity >= product.maxQuantity : false;

  if (product.maxQuantity <= 0) return null;

  return (
    <button
      type="button"
      aria-label={`Agregar ${product.name} al carrito`}
      disabled={atLimit}
      onClick={() => {
        cartStore.add(product, 1);
        cartDrawer.set(true);
      }}
      className={cn(
        "flex size-10 cursor-pointer items-center justify-center rounded-xl bg-brand-600 text-white transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-zinc-700",
        className,
      )}
    >
      {inCart ? <Check className="size-4.5" /> : <ShoppingCart className="size-4.5" />}
    </button>
  );
}

/** Selector de cantidad + botón grande para la ficha de producto. */
export function AddToCartPanel({ product }: { product: ProductSnapshot }) {
  const [quantity, setQuantity] = useState(1);
  const items = useCartItems();
  const inCart = items.find((line) => line.productId === product.productId)?.quantity ?? 0;
  const available = Math.max(0, product.maxQuantity - inCart);
  const outOfStock = product.maxQuantity <= 0;
  const safeQuantity = Math.min(quantity, Math.max(available, 1));

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex h-13 items-center rounded-xl border border-line bg-surface-2">
          <button
            type="button"
            aria-label="Disminuir cantidad"
            className="flex size-12 cursor-pointer items-center justify-center text-muted hover:text-fg disabled:opacity-40"
            disabled={safeQuantity <= 1 || outOfStock}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
            {outOfStock ? 0 : safeQuantity}
          </span>
          <button
            type="button"
            aria-label="Aumentar cantidad"
            className="flex size-12 cursor-pointer items-center justify-center text-muted hover:text-fg disabled:opacity-40"
            disabled={safeQuantity >= available || outOfStock}
            onClick={() => setQuantity((q) => Math.min(available, q + 1))}
          >
            <Plus className="size-4" />
          </button>
        </div>
        <Button
          size="lg"
          className="flex-1"
          disabled={outOfStock || available <= 0}
          onClick={() => {
            cartStore.add(product, safeQuantity);
            setQuantity(1);
            cartDrawer.set(true);
          }}
        >
          <ShoppingCart className="size-5" />
          {outOfStock ? "Sin stock" : available <= 0 ? "Máximo en el carrito" : "Agregar al carrito"}
        </Button>
      </div>
      {inCart > 0 && (
        <p className="text-sm text-muted">
          Ya tienes {inCart} {inCart === 1 ? "unidad" : "unidades"} en tu carrito.
        </p>
      )}
    </div>
  );
}
