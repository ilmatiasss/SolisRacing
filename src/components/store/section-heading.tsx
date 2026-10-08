import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-brand-500 uppercase", className)}>
      <span className="h-px w-6 bg-brand-500 shadow-[0_0_8px_2px_rgba(255,30,30,0.55)]" aria-hidden="true" />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
        <h2 className="font-display text-3xl font-extrabold tracking-tight uppercase italic sm:text-4xl">{title}</h2>
        {description && <p className="mt-2 text-muted">{description}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-fg hover:text-brand-400"
        >
          {action.label}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden border-b border-line bg-zinc-950">
      <div className="bg-speedlines absolute inset-0" aria-hidden="true" />
      <div
        className="absolute -top-24 right-0 size-72 rounded-full bg-brand-600/15 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-balance uppercase italic sm:text-5xl">
          {title}
        </h1>
        {description && <p className="mt-3 max-w-2xl text-muted">{description}</p>}
        {children}
      </div>
    </div>
  );
}
