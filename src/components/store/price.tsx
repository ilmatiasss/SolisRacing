import { cn } from "@/lib/cn";
import { discountPercent, formatCLP } from "@/lib/format";

export function Price({
  price,
  compareAtPrice,
  size = "md",
  className,
}: {
  price: number;
  compareAtPrice?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const discount = discountPercent(price, compareAtPrice);
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span
        className={cn(
          "font-display font-bold tracking-tight text-fg tabular-nums",
          size === "sm" && "text-lg",
          size === "md" && "text-xl",
          size === "lg" && "text-4xl",
        )}
      >
        {formatCLP(price)}
      </span>
      {discount > 0 && compareAtPrice && (
        <>
          <span className={cn("text-muted line-through tabular-nums", size === "lg" ? "text-lg" : "text-sm")}>
            {formatCLP(compareAtPrice)}
          </span>
          <span className="rounded bg-brand-600 px-1.5 py-0.5 text-xs font-bold text-white">-{discount}%</span>
        </>
      )}
    </div>
  );
}

export function StockStatus({ stock, className }: { stock: number; className?: string }) {
  if (stock <= 0) {
    return <span className={cn("text-sm font-medium text-zinc-400", className)}>Agotado</span>;
  }
  if (stock <= 3) {
    return (
      <span className={cn("text-sm font-medium text-signal-400", className)}>
        {stock === 1 ? "¡Última unidad!" : `Últimas ${stock} unidades`}
      </span>
    );
  }
  return <span className={cn("text-sm font-medium text-emerald-400", className)}>En stock</span>;
}
