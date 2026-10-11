import Image from "next/image";
import logoBase from "@/assets/logo/base.webp";
import logoHub from "@/assets/logo/hub.webp";
import logoNeedle from "@/assets/logo/needle.webp";
import logoWheel from "@/assets/logo/wheel.webp";
import badge from "@/assets/logo-solis-racing-parts.png";
import { cn } from "@/lib/cn";

/** Insignia redonda de Solis Racing Parts (estática). */
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

/**
 * Logo animado, armado en capas sobre el logo original: el fondo (sin la aguja), la rueda del
 * turbo, la aguja del velocímetro y su centro. El turbo gira como al tomar carga y, con `gauge`,
 * la aguja sube y rebota en el corte de inyección (ver `.logo-anim` en globals.css). Con `crop`
 * se recorta a la insignia redonda (encabezado); sin él muestra también el halo rojo del original.
 * `size` (px) solo sirve para elegir la resolución de las imágenes; el tamaño visible va en `className`.
 */
export function AnimatedLogo({
  size,
  className,
  eager,
  gauge = false,
  crop = false,
}: {
  size: number;
  className?: string;
  eager?: boolean;
  gauge?: boolean;
  crop?: boolean;
}) {
  const art = crop ? size * 1.126 : size;
  const px = (fraction: number) => `${Math.ceil(art * fraction)}px`;
  const loading = eager ? "eager" : undefined;
  return (
    <span aria-hidden="true" className={cn("logo-anim", crop && "logo-anim--crop", className)}>
      <span className="logo-anim__art">
        <Image src={logoBase} alt="" fill sizes={px(1)} loading={loading} />
        <span className="logo-anim__wheel">
          <Image src={logoWheel} alt="" fill sizes={px(0.13)} loading={loading} />
        </span>
        {gauge && <span className="logo-anim__limiter" />}
        <span className={cn("logo-anim__needle", gauge && "logo-anim__needle--live")}>
          <Image src={logoNeedle} alt="" fill sizes={px(0.42)} loading={loading} />
        </span>
        <span className="logo-anim__hub">
          <Image src={logoHub} alt="" fill sizes={px(0.06)} loading={loading} />
        </span>
      </span>
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
  /** El turbo del logo gira (encabezado de la tienda). */
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
        {turbo ? (
          <AnimatedLogo
            size={size === "md" ? 44 : 34}
            eager={eager}
            crop
            className={cn("relative", size === "md" ? "size-11" : "size-[34px]")}
          />
        ) : (
          <LogoBadge size={size === "md" ? 44 : 34} eager={eager} className="relative" />
        )}
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
