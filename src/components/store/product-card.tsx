import Link from "next/link";
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { ProductCardData } from "@/lib/data/catalog";
import { discountPercent } from "@/lib/format";
import { QuickAddButton } from "./cart/add-to-cart";
import { Price, StockStatus } from "./price";
import { ProductImage } from "./product-image";

export function ProductCard({
  product,
  className,
  style,
}: {
  product: ProductCardData;
  className?: string;
  style?: CSSProperties;
}) {
  const discount = discountPercent(product.price, product.compareAtPrice);
  const href = `/productos/${product.slug}`;
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:border-brand-600/50 hover:shadow-xl hover:shadow-brand-950/40",
        className,
      )}
      style={style}
    >
      <Link href={href} className="relative block overflow-hidden" tabIndex={-1} aria-hidden="true">
        <ProductImage
          src={product.imageUrl}
          alt={product.imageAlt ?? product.name}
          icon={product.categoryIcon}
          sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
          className="aspect-square transition-transform duration-500 group-hover:scale-[1.06]"
        />
        {/* Brillo que cruza la foto al pasar el mouse. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full"
        />
      </Link>
      <div className="pointer-events-none absolute top-3 left-3 flex flex-col items-start gap-1.5">
        {discount > 0 && (
          <span className="rounded-md bg-brand-600 px-2 py-1 text-xs font-bold text-white shadow">
            Oferta -{discount}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {(product.brandName || product.universal) && (
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
            {product.brandName && <span className="text-brand-500">{product.brandName}</span>}
            {product.universal && (
              <span className="rounded bg-white/8 px-1.5 py-px text-[10px] tracking-wide text-zinc-400">Universal</span>
            )}
          </p>
        )}
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-fg sm:text-[0.95rem]">
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {product.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            <Price price={product.price} compareAtPrice={product.compareAtPrice} size="sm" />
            <StockStatus stock={product.stock} className="text-xs" />
          </div>
          <QuickAddButton
            className="relative z-10"
            product={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              imageUrl: product.imageUrl,
              maxQuantity: product.stock,
            }}
          />
        </div>
      </div>
    </article>
  );
}

/** Grilla de productos; con `animate`, las tarjetas entran una tras otra. */
export function ProductGrid({ products, animate = false }: { products: ProductCardData[]; animate?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          className={animate ? "animate-card-in" : undefined}
          style={animate ? { animationDelay: `${Math.min(index, 11) * 55}ms` } : undefined}
        />
      ))}
    </div>
  );
}
