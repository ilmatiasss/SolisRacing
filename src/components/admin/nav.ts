import {
  Cable,
  CalendarDays,
  Car,
  Inbox,
  Layers,
  LayoutDashboard,
  Package,
  Plug,
  Receipt,
  Settings,
  ShieldCheck,
  Tag,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type NavCounts = { orders: number; inquiries: number };
export type NavItem = { href: string; label: string; icon: LucideIcon; count?: keyof NavCounts };
export type NavGroup = { title?: string; items: NavItem[] };

/** Menú del panel: las secciones agrupadas por lo que se hace en ellas. */
export const ADMIN_NAV: NavGroup[] = [
  { items: [{ href: "/admin", label: "Resumen", icon: LayoutDashboard }] },
  {
    title: "Ventas y clientes",
    items: [
      { href: "/admin/pedidos", label: "Pedidos", icon: Receipt, count: "orders" },
      { href: "/admin/solicitudes", label: "Solicitudes", icon: Inbox, count: "inquiries" },
      { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { href: "/admin/productos", label: "Productos", icon: Package },
      { href: "/admin/categorias", label: "Categorías", icon: Layers },
      { href: "/admin/marcas", label: "Marcas", icon: Tag },
      { href: "/admin/vehiculos", label: "Vehículos", icon: Car },
    ],
  },
  {
    title: "Taller",
    items: [
      { href: "/admin/servicios", label: "Servicios", icon: Wrench },
      { href: "/admin/ramales", label: "Ramales", icon: Cable },
    ],
  },
  {
    title: "Mi tienda",
    items: [
      { href: "/admin/configuracion", label: "Configuración", icon: Settings },
      { href: "/admin/usuarios", label: "Usuarios", icon: Users },
    ],
  },
  {
    title: "Avanzado",
    items: [
      { href: "/admin/integraciones", label: "Integraciones", icon: Plug },
      { href: "/admin/privacidad", label: "Privacidad", icon: ShieldCheck },
    ],
  },
];

export function isNavActive(href: string, path: string | undefined) {
  if (!path) return false;
  if (href === "/admin") return path === "/admin";
  return path === href || path.startsWith(`${href}/`);
}

/** La sección del menú a la que pertenece una ruta (para el rótulo de cada página). */
export function findNavItem(path: string): { group?: string; item: NavItem } | null {
  for (const group of ADMIN_NAV) {
    for (const item of group.items) {
      if (isNavActive(item.href, path)) return { group: group.title, item };
    }
  }
  return null;
}
