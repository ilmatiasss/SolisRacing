import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 32" aria-hidden="true" className={className}>
      <path d="M10 30 20 2h7L17 30Z" fill="#e10600" />
      <path d="M21 30 31 2h6L27 30Z" fill="#e10600" opacity="0.7" />
      <path d="M31 30 41 2h5L36 30Z" fill="#e10600" opacity="0.4" />
    </svg>
  );
}

/** Logotipo provisorio: reemplázalo por el logo oficial cuando lo tengas. */
export function Logo({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <LogoMark className="h-7 w-auto" />
      <span className="font-display text-2xl leading-none font-extrabold tracking-wide uppercase italic">
        <span className={tone === "light" ? "text-white" : "text-zinc-900"}>Solis</span>{" "}
        <span className="text-brand-600">Racing</span>
      </span>
    </span>
  );
}
