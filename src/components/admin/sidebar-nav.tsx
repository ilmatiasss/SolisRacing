import {
  Car,
  ExternalLink,
  Inbox,
  Layers,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  Tag,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export type NavCounts = { orders: number; inquiries: number };

type NavItem = { href: string; label: string; icon: LucideIcon; count?: keyof NavCounts };

const SECTIONS: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: "/admin", label: "Resumen", icon: LayoutDashboard },
      { href: "/admin/pedidos", label: "Pedidos", icon: Receipt, count: "orders" },
      { href: "/admin/solicitudes", label: "Solicitudes", icon: Inbox, count: "inquiries" },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { href: "/admin/productos", label: "Productos", icon: Package },
      { href: "/admin/categorias", label: "Categorías", icon: Layers },
      { href: "/admin/marcas", label: "Marcas", icon: Tag },
      { href: "/admin/vehiculos", label: "Vehículos", icon: Car },
      { href: "/admin/servicios", label: "Servicios", icon: Wrench },
    ],
  },
  {
    title: "Tienda",
    items: [
      { href: "/admin/configuracion", label: "Configuración", icon: Settings },
      { href: "/admin/usuarios", label: "Usuarios", icon: Users },
    ],
  },
];

function isActive(href: string, path: string | undefined) {
  if (!path) return false;
  if (href === "/admin") return path === "/admin";
  return path === href || path.startsWith(`${href}/`);
}

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
      {SECTIONS.map((section, index) => (
        <div key={section.title ?? index}>
          {section.title && (
            <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-muted uppercase">{section.title}</p>
          )}
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(item.href, activePath);
              const count = item.count ? counts?.[item.count] : undefined;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
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
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      >
        <ExternalLink className="size-4.5" />
        Ver tienda
      </Link>
    </nav>
  );
}
