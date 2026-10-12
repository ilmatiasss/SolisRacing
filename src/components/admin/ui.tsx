import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  description,
  actions,
  className,
  bodyClassName,
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border border-line bg-surface shadow-xs", className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            {title && <h2 className="font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[40rem] text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th className={cn("border-b border-line bg-surface-2 px-4 py-2.5 text-xs font-semibold tracking-wide text-muted uppercase", className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("border-b border-line px-4 py-3 align-middle", className)}>{children}</td>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <p className="font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "neutral" | "brand" | "warning" | "success";
  icon?: LucideIcon;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        {Icon && (
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl",
              tone === "brand" && "bg-brand-600/15 text-brand-500",
              tone === "warning" && "bg-amber-500/15 text-amber-400",
              tone === "success" && "bg-emerald-500/15 text-emerald-400",
              tone === "neutral" && "bg-white/5 text-zinc-300",
            )}
          >
            <Icon className="size-4.5" />
          </span>
        )}
      </div>
      <p
        className={cn(
          "mt-1 font-display text-3xl font-extrabold tracking-wide tabular-nums italic",
          tone === "brand" && "text-brand-500",
          tone === "warning" && "text-amber-400",
          tone === "success" && "text-emerald-400",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Notice({
  tone = "info",
  children,
  className,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        tone === "info" && "border-sky-500/30 bg-sky-500/10 text-sky-200",
        tone === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
        tone === "warning" && "border-amber-500/30 bg-amber-500/10 text-amber-200",
        tone === "danger" && "border-red-500/30 bg-red-500/10 text-red-200",
        className,
      )}
    >
      {children}
    </div>
  );
}
