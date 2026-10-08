import {
  Activity,
  ArrowDownUp,
  Car,
  CircleDot,
  Cog,
  Cpu,
  Disc,
  Droplet,
  Fan,
  Flame,
  Gauge,
  Wind,
  Wrench,
  Zap,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

/** Íconos disponibles para categorías y servicios (se eligen en el panel). */
export const ICONS: Record<string, { label: string; icon: LucideIcon }> = {
  wind: { label: "Admisión / aire", icon: Wind },
  flame: { label: "Escape / fuego", icon: Flame },
  fan: { label: "Turbo / ventilador", icon: Fan },
  "arrow-down-up": { label: "Suspensión", icon: ArrowDownUp },
  disc: { label: "Frenos / disco", icon: Disc },
  cpu: { label: "Electrónica / ECU", icon: Cpu },
  zap: { label: "Encendido / potencia", icon: Zap },
  cog: { label: "Transmisión / engranaje", icon: Cog },
  droplet: { label: "Lubricantes / fluidos", icon: Droplet },
  gauge: { label: "Medidores / dinamómetro", icon: Gauge },
  wrench: { label: "Herramientas / taller", icon: Wrench },
  activity: { label: "Diagnóstico", icon: Activity },
  "circle-dot": { label: "Llantas / ruedas", icon: CircleDot },
  car: { label: "Auto", icon: Car },
};

export function DynamicIcon({ name, ...props }: Omit<LucideProps, "name"> & { name: string | null | undefined }) {
  const Icon = (name && ICONS[name]?.icon) || Wrench;
  return <Icon aria-hidden="true" {...props} />;
}

type SvgProps = { className?: string };

export function WhatsAppIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.6 2 2.17 6.43 2.17 11.87c0 1.74.46 3.45 1.32 4.95L2.08 22l5.32-1.39a9.86 9.86 0 0 0 4.63 1.18h.01c5.44 0 9.87-4.43 9.87-9.87a9.8 9.8 0 0 0-2.86-7.01Zm-7.01 15.2h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.16.83.84-3.08-.2-.32a8.16 8.16 0 0 1-1.26-4.34c0-4.52 3.68-8.2 8.21-8.2a8.15 8.15 0 0 1 8.2 8.21c0 4.52-3.68 8.2-8.2 8.2Zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.78.97-.14.16-.29.18-.54.06a6.7 6.7 0 0 1-1.98-1.22 7.43 7.43 0 0 1-1.37-1.71c-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.29Z" />
    </svg>
  );
}

export function InstagramIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.87.25-1.46 1.5-1.46h1.53V4.46A20.5 20.5 0 0 0 14.3 4.3c-2.2 0-3.7 1.34-3.7 3.8v2.4H8.1v3h2.5V21h2.9Z" />
    </svg>
  );
}

export function TikTokIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1-2.6-2.6 2.6 2.6 0 0 1 3.37-2.48V9.66a5.7 5.7 0 0 0-.77-.05A5.7 5.7 0 0 0 4.17 15.3 5.7 5.7 0 0 0 9.86 21a5.7 5.7 0 0 0 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.25-1.48Z" />
    </svg>
  );
}

export function YouTubeIcon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M21.58 7.19a2.5 2.5 0 0 0-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42a2.5 2.5 0 0 0-1.77 1.77A26 26 0 0 0 2 12a26 26 0 0 0 .42 4.81 2.5 2.5 0 0 0 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42a2.5 2.5 0 0 0 1.77-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.42-4.81ZM10 15V9l5.2 3L10 15Z" />
    </svg>
  );
}
