"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { ProductImage } from "@/components/store/product-image";
import { formatCLP } from "@/lib/format";
import { cartStore, type CartItem } from "./cart-store";

export function CartLine({ line, onNavigate }: { line: CartItem; onNavigate?: () => void }) {
  return (
    <li className="flex gap-4 py-4">
      <Link href={`/productos/${line.slug}`} onClick={onNavigate} className="shrink-0">
        <ProductImage
          src={line.imageUrl}
          alt={line.name}
          sizes="80px"
          className="size-20 rounded-xl border border-line"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/productos/${line.slug}`}
            onClick={onNavigate}
            className="line-clamp-2 text-sm font-medium text-fg hover:text-brand-400"
          >
            {line.name}
          </Link>
          <button
            type="button"
            aria-label={`Quitar ${line.name}`}
            onClick={() => cartStore.remove(line.productId)}
            className="cursor-pointer rounded-lg p-1 text-muted hover:bg-white/5 hover:text-red-400"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
        <p className="mt-0.5 text-xs text-muted">{formatCLP(line.price)} c/u</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <QuantityStepper line={line} />
          <span className="font-semibold tabular-nums">{formatCLP(line.price * line.quantity)}</span>
        </div>
      </div>
    </li>
  );
}

export function QuantityStepper({ line }: { line: CartItem }) {
  return (
    <div className="flex h-9 items-center rounded-lg border border-line bg-surface-2">
      <button
        type="button"
        aria-label="Disminuir cantidad"
        onClick={() => cartStore.setQuantity(line.productId, line.quantity - 1)}
        className="flex size-9 cursor-pointer items-center justify-center text-muted hover:text-fg"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-7 text-center text-sm font-semibold tabular-nums">{line.quantity}</span>
      <button
        type="button"
        aria-label="Aumentar cantidad"
        disabled={line.quantity >= line.maxQuantity}
        onClick={() => cartStore.setQuantity(line.productId, line.quantity + 1)}
        className="flex size-9 cursor-pointer items-center justify-center text-muted hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
