"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Slide = { id: string; label: string; content: ReactNode };

/**
 * Carrusel que avanza solo. La barra de progreso marca el tiempo y, al terminar su animación,
 * pasa a la siguiente diapositiva; así pausar (mouse encima, foco o el botón) detiene ambas cosas.
 * Con "reducir movimiento" no avanza solo.
 */
export function Rotator({ slides, label, seconds = 4.5 }: { slides: Slide[]; label: string; seconds?: number }) {
  const [index, setIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const count = slides.length;
  const paused = hovered || userPaused;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAutoplay(!query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (count === 0) return null;
  const go = (next: number) => setIndex(((next % count) + count) % count);
  const running = autoplay && count > 1;

  return (
    <section
      aria-roledescription="carrusel"
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHovered(false);
      }}
      onTouchStart={(event) => {
        touchStart.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStart.current;
        const end = event.changedTouches[0]?.clientX;
        touchStart.current = null;
        if (start === null || end === undefined || Math.abs(end - start) < 40) return;
        go(end < start ? index + 1 : index - 1);
      }}
    >
      <div className="grid" aria-live={running && !paused ? "off" : "polite"}>
        {slides.map((slide, i) => {
          const active = i === index;
          // La que sale se va rápido hacia un lado; la nueva entra después desde el otro (sin encimarse).
          const position = active ? "active" : i < index ? "prev" : "next";
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${count}: ${slide.label}`}
              aria-hidden={!active}
              inert={!active}
              data-active={active}
              data-position={position}
              className="[grid-area:1/1] transition ease-out data-[active=false]:pointer-events-none data-[active=false]:scale-[0.97] data-[active=false]:opacity-0 data-[active=false]:duration-200 data-[active=true]:delay-200 data-[active=true]:duration-700 data-[position=next]:translate-x-8 data-[position=prev]:-translate-x-8"
            >
              {slide.content}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="mt-5 flex items-center gap-3">
          <div className="flex flex-1 gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Ver ${slide.label}`}
                aria-current={i === index ? "true" : undefined}
                className="group/dot relative h-6 flex-1"
              >
                <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/15 transition-colors group-hover/dot:bg-white/30">
                  {i < index && <span className="absolute inset-0 bg-white/50" />}
                  {i === index && (
                    <span
                      key={index}
                      onAnimationEnd={(event) => {
                        if (event.animationName === "progress") go(index + 1);
                      }}
                      className={cn(
                        "absolute inset-0 origin-left bg-brand-500",
                        running && "animate-progress",
                        running && paused && "[animation-play-state:paused]",
                      )}
                      style={{ "--progress-duration": `${seconds}s` } as CSSProperties}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
          {autoplay && (
            <button
              type="button"
              onClick={() => setUserPaused((value) => !value)}
              aria-label={userPaused ? "Reanudar carrusel" : "Pausar carrusel"}
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-zinc-300 transition-colors hover:border-white/40 hover:text-white"
            >
              {userPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
