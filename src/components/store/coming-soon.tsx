import { Eye } from "lucide-react";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";
import { AnimatedLogo } from "@/components/logo";
import { buttonClasses } from "@/components/ui/button";
import { whatsappLink } from "@/lib/format";
import type { StoreSettings } from "@/lib/settings";

/**
 * Aviso «Próximamente» a pantalla completa sobre la tienda desenfocada (ver lib/coming-soon).
 * Se oculta con <html data-preview> (dominios de prueba o ?preview=1), sin parpadeo.
 */
export function ComingSoonOverlay({ settings }: { settings: StoreSettings }) {
  const { title, signature } = settings.comingSoon;
  return (
    <>
      <section
        aria-label="Próximamente"
        className="theme-store coming-soon fixed inset-0 z-60 flex items-center justify-center overflow-y-auto bg-black/40 px-6 py-10 text-fg backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <AnimatedLogo size={256} eager gauge className="size-56 sm:size-64" />
          <h2 className="mt-4 font-display text-4xl leading-[1.02] font-extrabold tracking-normal uppercase italic [text-shadow:0_0_28px_rgba(255,40,40,0.55)] sm:text-6xl">
            {title}
          </h2>
          {signature && (
            <p className="mt-5 flex items-center gap-3 text-lg text-zinc-300">
              <span aria-hidden="true" className="h-px w-8 bg-brand-600" />
              {signature}
              <span aria-hidden="true" className="h-px w-8 bg-brand-600" />
            </p>
          )}
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            {settings.instagram && (
              <a
                href={settings.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses({ variant: "outline", size: "lg", className: "max-sm:flex-1 max-sm:px-4" })}
              >
                <InstagramIcon className="size-5" />
                Instagram
              </a>
            )}
            {settings.whatsapp && (
              <a
                href={whatsappLink(settings.whatsapp, `Hola ${settings.storeName}, quiero saber más.`)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses({ variant: "outline", size: "lg", className: "max-sm:flex-1 max-sm:px-4" })}
              >
                <WhatsAppIcon className="size-5" />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>
      {/* Solo en vista previa: recuerda que los visitantes ven el aviso. */}
      <p className="coming-soon-pill fixed bottom-3 left-3 z-30 hidden max-w-[16rem] items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/90 px-3 py-2 text-xs text-zinc-300 shadow-lg shadow-black/40">
        <Eye className="size-4 shrink-0 text-brand-500" aria-hidden="true" />
        Vista previa: los visitantes ven «Próximamente».
      </p>
    </>
  );
}
