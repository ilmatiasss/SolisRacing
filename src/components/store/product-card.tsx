import Link from "next/link";
import type { ProductCardData } from "@/lib/data/catalog";
import { discountPercent } from "@/lib/format";
import { QuickAddButton } from "./cart/add-to-cart";
import { Price, StockStatus } from "./price";
import { ProductImage } from "./product-image";

export function ProductCard({ product }: { product: ProductCardData }) {
  const discount = discountPercent(product.price, product.compareAtPrice);
  const href = `/productos/${product.slug}`;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-line-strong">
      <Link href={href} className="block" tabIndex={-1} aria-hidden="true">
        <ProductImage
          src={product.imageUrl}
          alt={product.imageAlt ?? product.name}
          icon={product.categoryIcon}
          sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
          className="aspect-square transition-transform duration-300 group-hover:scale-[1.02]"
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

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
