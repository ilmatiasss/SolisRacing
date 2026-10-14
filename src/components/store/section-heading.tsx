import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-xs font-semibold tracking-[0.18em] text-brand-400 uppercase", className)}>{children}</p>
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
        <h2 className="title-mark font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl">{title}</h2>
        {description && <p className="mt-3 text-muted">{description}</p>}
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
  aside,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Panel a la derecha del título en pantallas grandes (por ejemplo, un buscador). */
  aside?: ReactNode;
}) {
  return (
    <div className="relative border-b border-line bg-surface">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className={aside ? "grid items-center gap-6 lg:grid-cols-[1fr_minmax(0,34rem)] lg:gap-12" : undefined}>
          <div>
            {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
            <h1 className="title-mark font-display text-4xl font-bold tracking-wide text-balance uppercase sm:text-5xl">{title}</h1>
            {description && <p className="mt-4 max-w-2xl text-muted">{description}</p>}
            {children}
          </div>
          {aside}
        </div>
      </div>
      <div className="hazard h-1.5" aria-hidden="true" />
    </div>
  );
}
