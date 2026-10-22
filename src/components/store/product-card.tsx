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
        "group relative flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-colors duration-200 hover:border-zinc-500",
        className,
      )}
      style={style}
    >
      <Link href={href} className="relative block overflow-hidden" tabIndex={-1} aria-hidden="true">
        <ProductImage
          src={product.imageUrl}
          alt={product.imageAlt ?? product.name}
          icon={product.categoryIcon}
          sizes="(min-width: 1280px) 200px, (min-width: 768px) 25vw, 50vw"
          className="aspect-square transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </Link>
      <div className="pointer-events-none absolute top-2 left-2 flex flex-col items-start gap-1.5">
        {discount > 0 && (
          <span className="rounded-sm bg-brand-600 px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-white uppercase">
            Oferta -{discount}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {(product.brandName || product.universal) && (
          <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase">
            {product.brandName && <span className="text-brand-500">{product.brandName}</span>}
            {product.universal && (
              <span className="rounded bg-white/8 px-1.5 py-px text-[10px] tracking-wide text-zinc-400">Universal</span>
            )}
          </p>
        )}
        <h3 className="line-clamp-2 text-[0.8125rem] leading-snug font-semibold text-fg sm:text-sm">
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {product.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="min-w-0">
            <Price price={product.price} compareAtPrice={product.compareAtPrice} size="xs" />
            <StockStatus stock={product.stock} className="text-[11px]" />
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
export function ProductGrid({
  products,
  animate = false,
  withSidebar = false,
  className,
}: {
  products: ProductCardData[];
  animate?: boolean;
  /** En el catálogo hay un panel de filtros al lado: una columna menos. */
  withSidebar?: boolean;
  /** Para ajustar columnas (ej: que una cantidad fija llene filas completas). */
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3",
        withSidebar ? "sm:grid-cols-3 xl:grid-cols-4" : "sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
        className,
      )}
    >
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
