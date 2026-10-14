import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { ADMIN_NAV, isNavActive, type NavCounts } from "./nav";

export type { NavCounts };

export function SidebarNav({
  activePath,
  counts,
  onNavigate,
}: {
  activePath?: string;
  counts?: NavCounts;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Panel" className="space-y-6">
      {ADMIN_NAV.map((section, index) => (
        <div key={section.title ?? index}>
          {section.title && (
            <p className="mb-1.5 flex items-center gap-2 px-3 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
              <span className="h-px flex-1 max-w-3 bg-brand-600" aria-hidden="true" />
              {section.title}
              <span className="h-px flex-1 bg-line" aria-hidden="true" />
            </p>
          )}
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isNavActive(item.href, activePath);
              const count = item.count ? counts?.[item.count] : undefined;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-brand-600 text-white shadow-[0_0_18px_rgba(225,6,0,0.35)]"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <item.icon className="size-4.5" />
                    <span className="flex-1">{item.label}</span>
                    {!!count && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                          active ? "bg-white/20 text-white" : "bg-brand-600 text-white",
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <Link
        href="/"
        target="_blank"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white"
      >
        <ExternalLink className="size-4.5" />
        Ver tienda
      </Link>
    </nav>
  );
}
