import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import { WhatsAppIcon } from "@/components/icons";
import { InquiryForm } from "@/components/store/inquiry-form";
import { PageHeader } from "@/components/store/section-heading";
import { Container } from "@/components/ui/container";
import { getStoreSettings } from "@/lib/data/settings";
import { whatsappLink } from "@/lib/format";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbenos por WhatsApp, correo o visítanos en la tienda. Te ayudamos a elegir las piezas correctas para tu auto.",
  alternates: { canonical: "/contacto" },
};

export default async function ContactPage() {
  const settings = await getStoreSettings();
  const allCards = [
    {
      icon: WhatsAppIcon,
      title: "WhatsApp",
      value: settings.whatsapp,
      href: whatsappLink(settings.whatsapp, `Hola ${settings.storeName}, tengo una consulta.`),
      external: true,
    },
    { icon: Phone, title: "Teléfono", value: settings.phone, href: `tel:${settings.phone.replace(/\s/g, "")}` },
    { icon: Mail, title: "Correo", value: settings.email, href: `mailto:${settings.email}` },
    {
      icon: MapPin,
      title: "Tienda",
      value: [settings.address, settings.city].filter(Boolean).join(", "),
      href:
        settings.mapsUrl ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${settings.address}, ${settings.city}`)}`,
      external: true,
    },
  ];
  const cards = allCards.filter((card) => card.value.trim());

  return (
    <>
      <PageHeader
        eyebrow="Contacto"
        title="Hablemos de tu auto"
        description="¿Buscas una pieza que no está en el catálogo o quieres asesoría para tu proyecto? Escríbenos."
      />
      <Container className="grid gap-10 py-14 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-3">
          {cards.map(({ icon: Icon, title, value, href, external }) => (
            <a
              key={title}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-brand-600/60"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-500">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block text-xs font-semibold tracking-wider text-muted uppercase">{title}</span>
                <span className="font-medium">{value}</span>
              </span>
            </a>
          ))}
          <div className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-500">
              <Clock className="size-5" />
            </span>
            <span>
              <span className="block text-xs font-semibold tracking-wider text-muted uppercase">Horario</span>
              <span className="font-medium whitespace-pre-line">{settings.openingHours}</span>
            </span>
          </div>
        </div>
        <section aria-labelledby="form-titulo" className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <h2 id="form-titulo" className="font-display text-3xl font-extrabold uppercase italic">
            Envíanos un mensaje
          </h2>
          <p className="mt-1 mb-6 text-sm text-muted">Te respondemos lo antes posible, también por WhatsApp.</p>
          <InquiryForm kind="contact" />
        </section>
      </Container>
    </>
  );
}
