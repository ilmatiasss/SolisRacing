import Image from "next/image";
import { DynamicIcon } from "@/components/icons";
import { LogoBadge } from "@/components/logo";
import { cn } from "@/lib/cn";

/**
 * Imagen de producto. Las fotos de la tienda son cuadradas y con fondo oscuro, así que
 * llenan el recuadro; si una foto no es cuadrada, se ve completa sobre fondo oscuro.
 * Sin foto, se muestra un placeholder con el ícono de la categoría.
 */
export function ProductImage({
  src,
  alt,
  icon,
  sizes,
  eager,
  className,
}: {
  src: string | null;
  alt: string;
  icon?: string | null;
  sizes: string;
  /** Imagen principal sobre el pliegue (LCP): se carga de inmediato. */
  eager?: boolean;
  className?: string;
}) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-zinc-800", className)}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          className="object-contain"
        />
      </div>
    );
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-linear-to-br from-zinc-800 via-zinc-900 to-black",
        className,
      )}
    >
      <div className="bg-speedlines absolute inset-0" />
      <div className="glow-placeholder absolute -right-36 -bottom-36 size-92" />
      <DynamicIcon name={icon} className="relative size-1/3 text-zinc-300/80" strokeWidth={1.25} />
      <LogoBadge size={22} className="absolute bottom-3 left-3 opacity-70" />
    </div>
  );
}
