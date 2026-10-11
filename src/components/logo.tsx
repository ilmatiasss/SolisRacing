import Image from "next/image";
import badge from "@/assets/logo-solis-racing-parts.png";
import { cn } from "@/lib/cn";

/**
 * Insignia redonda de Solis Racing Parts. Está recortada de su perfil de Instagram:
 * cuando tengas el archivo original, reemplaza `src/assets/logo-solis-racing-parts.png`
 * (y `src/app/icon.png` / `apple-icon.png`) manteniendo el formato cuadrado.
 */
const TURBO_BLADES = Array.from({ length: 12 }, (_, index) => index * 30);

/** Rueda del compresor dibujada en vector (aspas plateadas), para girar sobre el turbo del logo. */
function TurboWheel() {
  return (
    <span aria-hidden="true" className="turbo-wheel">
      <svg viewBox="-50 -50 100 100" className="turbo-wheel__blades">
        <defs>
          <linearGradient id="turbo-silver" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f4f6fa" />
            <stop offset="0.55" stopColor="#9aa0ab" />
            <stop offset="1" stopColor="#4b505a" />
          </linearGradient>
        </defs>
        <circle r="49" fill="#070708" />
        {TURBO_BLADES.map((angle) => (
          <path
            key={angle}
            d="M7 0 C18 -9 32 -8 46 6"
            transform={`rotate(${angle})`}
            fill="none"
            stroke="url(#turbo-silver)"
            strokeWidth="5"
            strokeLinecap="round"
          />
        ))}
        <circle r="9" fill="url(#turbo-silver)" />
        <circle r="3.5" fill="#15161a" />
      </svg>
    </span>
  );
}

/**
 * Insignia redonda de Solis Racing Parts. Está recortada de su perfil de Instagram:
 * cuando tengas el archivo original, reemplaza `src/assets/logo-solis-racing-parts.png`
 * (y `src/app/icon.png` / `apple-icon.png`) manteniendo el formato cuadrado.
 * Con `spin`, el turbo del logo gira como al tomar carga (ver `.turbo-wheel` en globals.css).
 */
export function LogoBadge({
  size,
  className,
  eager,
  spin = false,
}: {
  size: number;
  className?: string;
  eager?: boolean;
  spin?: boolean;
}) {
  const image = (
    <Image
      src={badge}
      alt=""
      width={size}
      height={size}
      loading={eager ? "eager" : undefined}
      className={cn("shrink-0 rounded-full", spin ? "size-full" : className)}
    />
  );
  if (!spin) return image;
  return (
    <span className={cn("relative inline-flex shrink-0 rounded-full", className)} style={{ width: size, height: size }}>
      {image}
      <TurboWheel />
    </span>
  );
}

export function Logo({
  className,
  tone = "light",
  size = "md",
  eager,
  glow = false,
  turbo = false,
}: {
  className?: string;
  tone?: "light" | "dark";
  size?: "sm" | "md";
  /** Para el logo visible al cargar (encabezado): se descarga de inmediato. */
  eager?: boolean;
  /** Halo rojo que respira alrededor de la insignia (tienda). */
  glow?: boolean;
  /** El turbo del logo gira (portada). */
  turbo?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative flex shrink-0 rounded-full">
        {glow && (
          <span
            aria-hidden="true"
            className="absolute -inset-1 animate-neon-pulse rounded-full shadow-[0_0_16px_4px_rgba(255,40,30,0.55)]"
          />
        )}
        <LogoBadge size={size === "md" ? 44 : 34} eager={eager} spin={turbo} className="relative" />
      </span>
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
