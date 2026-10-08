import { SiteFooter, WhatsAppFloatingButton } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="theme-store flex min-h-dvh flex-col bg-bg text-fg">
      <a
        href="#contenido"
        className="sr-only z-50 rounded-lg bg-white px-4 py-2 font-semibold text-zinc-900 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>
      <SiteHeader />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <WhatsAppFloatingButton />
    </div>
  );
}
