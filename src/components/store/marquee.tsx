import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Banda que se desplaza sin fin. El contenido se repite para que el bucle no tenga saltos;
 * la copia es inerte (no se lee ni recibe foco). Se detiene al pasar el mouse o con el foco
 * del teclado, y queda quieta si el sistema pide reducir el movimiento.
 */
export function Marquee({
  children,
  reverse = false,
  seconds = 40,
  repeat = 2,
  className,
  trackClassName,
}: {
  children: ReactNode;
  reverse?: boolean;
  /** Duración de una vuelta completa. */
  seconds?: number;
  /** Veces que se repite el contenido dentro de cada copia (para pantallas anchas). */
  repeat?: number;
  className?: string;
  trackClassName?: string;
}) {
  const copy = Array.from({ length: repeat }, (_, index) => (
    <div key={index} className={cn("flex shrink-0 items-center", trackClassName)}>
      {children}
    </div>
  ));
  return (
    <div className={cn("group/marquee flex overflow-hidden", className)}>
      <div
        className={cn(
          "flex w-max shrink-0 animate-marquee group-focus-within/marquee:[animation-play-state:paused] group-hover/marquee:[animation-play-state:paused]",
          reverse && "[animation-direction:reverse]",
        )}
        style={{ "--marquee-duration": `${seconds}s` } as CSSProperties}
      >
        <div className="flex shrink-0">{copy}</div>
        <div className="flex shrink-0" aria-hidden="true" inert>
          {copy}
        </div>
      </div>
    </div>
  );
}
