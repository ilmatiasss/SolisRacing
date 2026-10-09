import { MessageCircle, PackageSearch, Truck } from "lucide-react";
import type { Metadata } from "next";
import { WhatsAppIcon } from "@/components/icons";
import { InquiryForm } from "@/components/store/inquiry-form";
import { PageHeader } from "@/components/store/section-heading";
import { Container } from "@/components/ui/container";
import { getStoreSettings } from "@/lib/data/settings";
import { whatsappLink } from "@/lib/format";

export const metadata: Metadata = {
  title: "Pedido especial de repuestos",
  description: "¿No encuentras tu repuesto en el catálogo? Dinos qué buscas y para qué auto, y te enviamos precio y plazo.",
  alternates: { canonical: "/pedido-especial" },
};

const STEPS = [
  { icon: MessageCircle, title: "Nos cuentas qué buscas", text: "La pieza, tu auto y cualquier dato que tengas: marca, número de parte o una foto." },
  { icon: PackageSearch, title: "Lo buscamos por ti", text: "Lo cotizamos con nuestros proveedores y marcas de performance." },
  { icon: Truck, title: "Te avisamos precio y plazo", text: "Si te acomoda, lo retiras en la tienda o te lo despachamos a todo Chile." },
];

export default async function SpecialOrderPage() {
  const settings = await getStoreSettings();

  return (
    <>
      <PageHeader
        eyebrow="Pedido especial"
        title="¿No encuentras tu repuesto?"
        description="Si no está en el catálogo, lo conseguimos. Cuéntanos qué necesitas y te respondemos con precio y plazo."
      />
      <Container className="grid gap-10 py-14 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-3">
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <div key={title} className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-500">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block text-xs font-semibold tracking-wider text-muted uppercase">Paso {index + 1}</span>
                <span className="block font-semibold">{title}</span>
                <span className="mt-1 block text-sm text-muted">{text}</span>
              </span>
            </div>
          ))}
          <a
            href={whatsappLink(settings.whatsapp, "Hola, busco un repuesto que no está en la web.")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 transition-colors hover:border-emerald-400/60"
          >
            <WhatsAppIcon className="size-6 shrink-0 text-emerald-400" />
            <span className="text-sm">
              <span className="block font-semibold">¿Prefieres WhatsApp?</span>
              <span className="text-zinc-300">Escríbenos y mándanos una foto de la pieza.</span>
            </span>
          </a>
        </div>
        <section aria-labelledby="pedido-titulo" className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <h2 id="pedido-titulo" className="font-display text-3xl font-extrabold uppercase italic">
            Pide tu repuesto
          </h2>
          <p className="mt-1 mb-6 text-sm text-muted">Te respondemos lo antes posible, también por WhatsApp.</p>
          <InquiryForm kind="part" />
        </section>
      </Container>
    </>
  );
}
