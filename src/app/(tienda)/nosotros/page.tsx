import { Gauge, MapPin, Truck, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";
import { InstagramGallery } from "@/components/store/instagram-gallery";
import { PageHeader, SectionHeading } from "@/components/store/section-heading";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getStoreSettings } from "@/lib/data/settings";
import { whatsappLink } from "@/lib/format";
import { parseInstagramPosts } from "@/lib/instagram";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description:
    "Solis Racing Parts: tienda física y taller de performance en Antofagasta. Repuestos, electrónica, seteos e instalaciones, con despachos a todo Chile.",
  alternates: { canonical: "/nosotros" },
};

export default async function AboutPage() {
  const settings = await getStoreSettings();
  const posts = parseInstagramPosts(settings.instagramPosts);
  const location = [settings.address, settings.city].filter(Boolean).join(", ");
  const facts = [
    {
      icon: MapPin,
      title: "Tienda física",
      text: location ? `Atendemos en ${location}. Ven a ver las piezas y a resolver tus dudas.` : "Ven a ver las piezas y a resolver tus dudas.",
    },
    {
      icon: Wrench,
      title: "Seteos e instalación",
      text: "Instalamos y programamos FuelTech, combustible y arneses, en Antofagasta y en visitas a la Región de Valparaíso.",
    },
    { icon: Truck, title: "Despachos a todo Chile", text: "Enviamos por courier o retiras en la tienda." },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Quiénes somos"
        title="Conoce Solis Racing Parts"
        description="Repuestos de performance, electrónica y seteos en Antofagasta y la Región de Valparaíso. Esto es lo que hacemos día a día."
      />
      <Container className="py-14">
        <ul className="grid gap-4 md:grid-cols-3">
          {facts.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-500">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="mt-1 block text-sm text-muted">{text}</span>
              </span>
            </li>
          ))}
        </ul>

        {posts.length > 0 && (
          <section className="mt-16" aria-labelledby="videos-titulo">
            <SectionHeading eyebrow="En Instagram" title={<span id="videos-titulo">Lo que hacemos</span>} />
            <InstagramGallery posts={posts} />
          </section>
        )}

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Link href="/servicios" className={buttonClasses({ size: "lg" })}>
            <Gauge className="size-5" />
            Agendar un seteo
          </Link>
          {settings.instagram && (
            <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: "outline", size: "lg" })}>
              <InstagramIcon className="size-5" />
              Síguenos en Instagram
            </a>
          )}
          <a
            href={whatsappLink(settings.whatsapp, `Hola ${settings.storeName}, tengo una consulta.`)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ variant: "outline", size: "lg" })}
          >
            <WhatsAppIcon className="size-5" />
            Escríbenos por WhatsApp
          </a>
        </div>
      </Container>
    </>
  );
}
