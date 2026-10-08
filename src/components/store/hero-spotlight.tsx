"use client";

import { useEffect, useRef } from "react";

/**
 * Resplandor rojo que sigue al mouse dentro del bloque que lo contiene (su elemento padre).
 * Se mueve con `transform` una vez por cuadro, sin volver a renderizar React. No se activa en
 * pantallas táctiles ni con "reducir movimiento".
 */
export function HeroSpotlight() {
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = glow.current;
    const area = element?.parentElement;
    if (!element || !area) return;
    if (window.matchMedia("(hover: none), (prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let x = 0;
    let y = 0;
    const move = (event: PointerEvent) => {
      const rect = area.getBoundingClientRect();
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        element.style.opacity = "1";
      });
    };
    const leave = () => {
      element.style.opacity = "0";
    };
    area.addEventListener("pointermove", move);
    area.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      area.removeEventListener("pointermove", move);
      area.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div
      ref={glow}
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 -mt-[320px] -ml-[320px] size-[640px] rounded-full bg-[radial-gradient(circle,rgb(255_40_40/0.24),transparent_65%)] opacity-0 transition-[opacity,transform] duration-300 ease-out"
    />
  );
}
