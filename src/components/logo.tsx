import Image from "next/image";
import badge from "@/assets/logo-solis-racing-parts.png";
import { cn } from "@/lib/cn";

/**
 * Insignia redonda de Solis Racing Parts. Está recortada de su perfil de Instagram:
 * cuando tengas el archivo original, reemplaza `src/assets/logo-solis-racing-parts.png`
 * (y `src/app/icon.png` / `apple-icon.png`) manteniendo el formato cuadrado.
 */
export function LogoBadge({ size, className, eager }: { size: number; className?: string; eager?: boolean }) {
  return (
    <Image
      src={badge}
      alt=""
      width={size}
      height={size}
      loading={eager ? "eager" : undefined}
      className={cn("shrink-0 rounded-full", className)}
    />
  );
}

export function Logo({
  className,
  tone = "light",
  size = "md",
  eager,
}: {
  className?: string;
  tone?: "light" | "dark";
  size?: "sm" | "md";
  /** Para el logo visible al cargar (encabezado): se descarga de inmediato. */
  eager?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoBadge size={size === "md" ? 44 : 34} eager={eager} />
      <span className="flex flex-col font-display leading-none uppercase italic">
        <span
          className={cn(
            "font-extrabold tracking-wide",
            size === "md" ? "text-[1.6rem]" : "text-xl",
            tone === "light" ? "text-white" : "text-zinc-900",
          )}
        >
          Solis
        </span>
        <span
          className={cn(
            "font-bold tracking-[0.2em]",
            size === "md" ? "text-[0.68rem]" : "text-[0.6rem]",
            tone === "light" ? "text-orange-400" : "text-orange-600",
          )}
        >
          Racing Parts
        </span>
      </span>
    </span>
  );
}
