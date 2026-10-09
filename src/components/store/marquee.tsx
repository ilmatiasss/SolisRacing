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
  mobileRepeat = 1,
  className,
  trackClassName,
}: {
  children: ReactNode;
  reverse?: boolean;
  /** Duración de una vuelta completa. */
  seconds?: number;
  /** Veces que se repite el contenido dentro de cada copia (para pantallas anchas). */
  repeat?: number;
  /**
   * Repeticiones que se dibujan en celulares (el resto se oculta). Una banda más angosta es mucho
   * más liviana de mover; basta con que cada copia sea más ancha que la pantalla. La vuelta dura
   * proporcionalmente menos, así la banda avanza a la misma velocidad que en pantallas anchas.
   */
  mobileRepeat?: number;
  className?: string;
  trackClassName?: string;
}) {
  const mobileSeconds = (seconds * Math.min(mobileRepeat, repeat)) / repeat;
  // Solo la primera repetición se lee y recibe foco; el resto es relleno visual.
  const copy = Array.from({ length: repeat }, (_, index) => (
    <div
      key={index}
      className={cn("flex shrink-0 items-center", index >= mobileRepeat && "hidden sm:flex", trackClassName)}
      aria-hidden={index > 0 ? true : undefined}
      inert={index > 0 ? true : undefined}
    >
      {children}
    </div>
  ));
  return (
    <div className={cn("group/marquee flex overflow-hidden", className)}>
      <div
        className={cn(
          "marquee-track flex w-max shrink-0 animate-marquee group-focus-within/marquee:[animation-play-state:paused] group-hover/marquee:[animation-play-state:paused]",
          reverse && "[animation-direction:reverse]",
        )}
        style={
          { "--marquee-duration": `${seconds}s`, "--marquee-mobile-duration": `${mobileSeconds}s` } as CSSProperties
        }
      >
        <div className="flex shrink-0">{copy}</div>
        <div className="flex shrink-0" aria-hidden="true" inert>
          {copy}
        </div>
      </div>
    </div>
  );
}
