import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

/*
 * Piezas decorativas de neón para la portada (solo CSS, ver globals.css).
 * Todas se ocultan a los lectores de pantalla y se quedan quietas con "reducir movimiento".
 */

/** Texto como letrero de neón: el tubo apagado es el texto real y la luz se enciende encima. */
export function NeonSign({ children, delay = 2.4, className }: { children: string; delay?: number; className?: string }) {
  return (
    <span className={cn("neon-sign", className)} style={{ "--neon-delay": `${delay}s` } as CSSProperties}>
      <span className="neon-sign__tube">{children}</span>
      <span className="neon-sign__light" aria-hidden="true">
        {children}
      </span>
    </span>
  );
}

/** Texto con "falla de señal" (capas roja y cian desplazadas) al cargar y cada 7 segundos. */
export function GlitchText({ children, className }: { children: string; className?: string }) {
  return (
    <span className={cn("glitch", className)}>
      {children}
      <span className="glitch__layer glitch__layer--a" aria-hidden="true">
        {children}
      </span>
      <span className="glitch__layer glitch__layer--b" aria-hidden="true">
        {children}
      </span>
    </span>
  );
}

/** Cinco luces de partida que se encienden de a una y se apagan juntas ("lights out"). */
export function StartLights({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-1.5", className)} aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className="start-light" />
      ))}
    </span>
  );
}

const TRAILS = [
  { top: "14%", width: "22%", seconds: 2.6, delay: -0.4, opacity: 0.9 },
  { top: "31%", width: "34%", seconds: 3.4, delay: -2.1, opacity: 0.55 },
  { top: "47%", width: "18%", seconds: 2.1, delay: -1.2, opacity: 0.8 },
  { top: "63%", width: "28%", seconds: 3, delay: -0.9, opacity: 0.65 },
  { top: "78%", width: "40%", seconds: 3.8, delay: -2.8, opacity: 0.5 },
  { top: "91%", width: "24%", seconds: 2.4, delay: -1.7, opacity: 0.85 },
];

/** Estelas de luz roja que cruzan el fondo a distintas alturas y velocidades. */
export function LightTrails({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      {TRAILS.map((trail) => (
        <span
          key={trail.top}
          className="light-trail"
          style={
            {
              top: trail.top,
              width: trail.width,
              opacity: trail.opacity,
              "--trail-duration": `${trail.seconds}s`,
              "--trail-delay": `${trail.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** Piso de neón en perspectiva que avanza hacia la pantalla. */
export function NeonFloor({ className }: { className?: string }) {
  return (
    <div className={cn("neon-floor pointer-events-none absolute inset-x-0 bottom-0", className)} aria-hidden="true">
      <div className="neon-floor__plane">
        <div className="neon-floor__grid" />
      </div>
    </div>
  );
}

/** Línea de neón con un destello que va y vuelve. */
export function ScannerLine({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-x-0 h-px bg-linear-to-r from-transparent via-brand-600/70 to-transparent", className)}
      aria-hidden="true"
    >
      <span className="scanner" />
    </div>
  );
}
