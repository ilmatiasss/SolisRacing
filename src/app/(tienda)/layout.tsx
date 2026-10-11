import { ComingSoonOverlay } from "@/components/store/coming-soon";
import { SiteFooter, WhatsAppFloatingButton } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";
import { PREVIEW_SCRIPT, SETTLE_SCRIPT } from "@/lib/coming-soon";
import { getStoreSettings } from "@/lib/data/settings";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const settings = await getStoreSettings();
  const comingSoon = settings.comingSoon.enabled;
  return (
    <>
      {comingSoon && (
        <>
          <script dangerouslySetInnerHTML={{ __html: PREVIEW_SCRIPT }} />
          <ComingSoonOverlay settings={settings} />
        </>
      )}
      {/* Con el aviso activo la tienda queda de fondo: inerte y sin scroll (salvo en vista previa). */}
      <div
        id="tienda"
        data-coming-soon={comingSoon ? "" : undefined}
        inert={comingSoon}
        suppressHydrationWarning
        className="theme-store flex min-h-dvh flex-col bg-bg text-fg"
      >
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
      {comingSoon && <script dangerouslySetInnerHTML={{ __html: SETTLE_SCRIPT }} />}
    </>
  );
}
