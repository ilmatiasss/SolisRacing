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

/** Logotipo provisorio de Solis Racing Parts: reemplázalo por el logo oficial cuando lo tengas. */
export function Logo({
  className,
  tone = "light",
  size = "md",
}: {
  className?: string;
  tone?: "light" | "dark";
  size?: "sm" | "md";
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <LogoMark className={size === "md" ? "h-7 w-auto" : "h-5 w-auto"} />
      <span
        className={cn(
          "font-display leading-none font-extrabold tracking-wide uppercase italic",
          size === "md" ? "text-2xl" : "text-lg",
        )}
      >
        <span className={tone === "light" ? "text-white" : "text-zinc-900"}>Solis</span>{" "}
        <span className="text-brand-600">Racing</span>
      </span>
      <span
        className={cn(
          "ml-0.5 self-center rounded-[3px] border px-1 py-px font-display text-[0.6rem] leading-none font-bold tracking-[0.2em] uppercase",
          tone === "light" ? "border-white/40 text-white/80" : "border-zinc-400 text-zinc-600",
        )}
      >
        Parts
      </span>
    </span>
  );
}
