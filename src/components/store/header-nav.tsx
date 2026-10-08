import Link from "next/link";
import { cn } from "@/lib/cn";

export const MAIN_NAV = [
  { href: "/productos", label: "Catálogo" },
  { href: "/productos?oferta=1", label: "Ofertas", match: false },
  { href: "/servicios", label: "Servicios y seteos" },
  { href: "/seguimiento", label: "Seguimiento" },
  { href: "/contacto", label: "Contacto" },
] as const;

function isActive(href: string, activePath: string | undefined) {
  if (!activePath) return false;
  const path = href.split("?")[0];
  return activePath === path || activePath.startsWith(`${path}/`);
}

/**
 * Links del menú principal. Se usa tal cual como fallback del prerender y, una vez
 * conocida la ruta, con `activePath` para marcar la sección actual.
 */
export function HeaderNavLinks({ activePath }: { activePath?: string }) {
  return (
    <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
      {MAIN_NAV.map((item) => {
        const active = !("match" in item) && isActive(item.href, activePath);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white",
              active && "text-white",
              item.label === "Ofertas" && "text-signal-400 hover:text-signal-300",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
