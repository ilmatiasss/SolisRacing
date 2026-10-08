import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel Solis Racing Parts" },
  robots: { index: false, follow: false },
};

// El panel siempre se renderiza por solicitud (depende de la sesión): no aplica la validación
// de navegación instantánea del prerender.
export const instant = false;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-admin min-h-dvh bg-bg text-fg">{children}</div>;
}
