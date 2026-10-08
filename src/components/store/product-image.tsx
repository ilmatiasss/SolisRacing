import Image from "next/image";
import { DynamicIcon } from "@/components/icons";
import { LogoMark } from "@/components/logo";
import { cn } from "@/lib/cn";

/**
 * Imagen de producto. Las fotos se muestran sobre fondo claro (como suelen venir
 * de los fabricantes); sin foto, se muestra un placeholder con el ícono de la categoría.
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
      <div className={cn("relative overflow-hidden bg-linear-to-b from-white to-zinc-200", className)}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          className="object-contain p-[6%] mix-blend-multiply"
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
      <div className="absolute -right-6 -bottom-6 size-32 rounded-full bg-brand-600/20 blur-2xl" />
      <DynamicIcon name={icon} className="relative size-1/3 text-zinc-300/80" strokeWidth={1.25} />
      <LogoMark className="absolute bottom-3 left-3 h-3 w-auto opacity-60" />
    </div>
  );
}
