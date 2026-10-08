import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/order-status";

const tones: Record<Tone, string> = {
  neutral: "bg-zinc-500/12 text-zinc-500 ring-zinc-500/25",
  info: "bg-sky-500/12 text-sky-500 ring-sky-500/25",
  success: "bg-emerald-500/12 text-emerald-500 ring-emerald-500/25",
  warning: "bg-amber-500/12 text-amber-500 ring-amber-500/30",
  danger: "bg-red-500/12 text-red-500 ring-red-500/25",
  brand: "bg-brand-600/12 text-brand-500 ring-brand-600/30",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
