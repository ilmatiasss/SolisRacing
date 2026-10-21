import { Gauge, MapPin, Truck, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";
import { InstagramGallery } from "@/components/store/instagram-gallery";
import { Eyebrow, PageHeader, SectionHeading } from "@/components/store/section-heading";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { hasOwnerSection, isImageUrl, parseHighlights, storyParagraphs, type AboutSettings } from "@/lib/about";
import { cn } from "@/lib/cn";
import { getStoreSettings } from "@/lib/data/settings";
import { whatsappLink } from "@/lib/format";
import { parseInstagramPosts } from "@/lib/instagram";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description:
    "Solis Racing Parts: tienda física y taller de performance en Antofagasta. Repuestos, electrónica, programación e instalaciones, con despachos a todo Chile.",
  alternates: { canonical: "/nosotros" },
};

export default async function AboutPage() {
  const settings = await getStoreSettings();
  const { about } = settings;
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
      title: "Programación e instalación",
      text: "Instalamos y programamos FuelTech, combustible y arneses, en Antofagasta y en visitas a la Región de Valparaíso.",
    },
    { icon: Truck, title: "Despachos a todo Chile", text: "Enviamos por courier o retiras en la tienda." },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Quiénes somos"
        title="Conoce Solis Racing Parts"
        description="Repuestos de performance, electrónica y programación en Antofagasta y la Región de Valparaíso. Esto es lo que hacemos día a día."
      />
      <Container className="py-14">
        {hasOwnerSection(about) && <OwnerSection about={about} />}

        <ul className={cn("grid gap-4 md:grid-cols-3", hasOwnerSection(about) && "mt-16")}>
          {facts.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4 rounded-lg border border-line bg-surface p-5">
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

        {about.projects.length > 0 && (
          <section className="mt-16" aria-labelledby="proyectos-titulo">
            <SectionHeading eyebrow="Proyectos" title={<span id="proyectos-titulo">Autos en los que hemos trabajado</span>} />
            <ul
              className={cn(
                "grid gap-5 sm:grid-cols-2",
                about.projects.length % 4 === 0 ? "lg:grid-cols-4" : "lg:grid-cols-3",
              )}
            >
              {about.projects.map((project, index) => (
                <li key={`${project.image}-${index}`} className="overflow-hidden rounded-lg border border-line bg-surface">
                  <div className="relative aspect-[4/3] bg-surface-2">
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-display text-lg leading-tight font-bold uppercase">{project.title}</p>
                    {project.detail && <p className="mt-1.5 text-sm text-muted">{project.detail}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {posts.length > 0 && (
          <section className="mt-16" aria-labelledby="videos-titulo">
            <SectionHeading eyebrow="En Instagram" title={<span id="videos-titulo">Lo que hacemos</span>} />
            <InstagramGallery posts={posts} />
          </section>
        )}

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Link href="/servicios" className={buttonClasses({ size: "lg" })}>
            <Gauge className="size-5" />
            Agendar una programación
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

/** La persona detrás de la tienda: foto, nombre, rol, historia y logros (todo desde el panel). */
function OwnerSection({ about }: { about: AboutSettings }) {
  const photo = isImageUrl(about.photo) ? about.photo : "";
  const paragraphs = storyParagraphs(about.story);
  const highlights = parseHighlights(about.highlights);
  return (
    <section
      aria-labelledby="persona-titulo"
      className={cn("grid items-center gap-10", photo && "lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-16")}
    >
      {photo && (
        <figure className="relative mx-auto w-full max-w-md">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-line-strong bg-surface-2">
            <Image
              src={photo}
              alt={about.name || "Fundador de Solis Racing Parts"}
              fill
              priority
              sizes="(min-width: 1024px) 26rem, 90vw"
              className="object-cover"
            />
          </div>
          <div className="hazard absolute inset-x-6 -bottom-1.5 h-1.5" aria-hidden="true" />
        </figure>
      )}
      <div className="max-w-2xl">
        <Eyebrow className="mb-3">Detrás de la tienda</Eyebrow>
        <h2 id="persona-titulo" className="title-mark font-display text-4xl font-bold tracking-wide uppercase sm:text-5xl">
          {about.name || "Solis Racing Parts"}
        </h2>
        {about.role && <p className="mt-5 font-semibold text-brand-400">{about.role}</p>}
        {paragraphs.length > 0 && (
          <div className="mt-4 space-y-4 leading-relaxed text-zinc-300">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        )}
        {highlights.length > 0 && (
          <dl
            className={cn(
              "mt-8 grid gap-6 border-t border-line pt-6",
              highlights.length === 4 ? "grid-cols-2 sm:grid-cols-4" : highlights.length === 3 ? "grid-cols-3" : "grid-cols-2",
            )}
          >
            {highlights.map((item) => (
              <div key={item.label} className="grid content-start">
                <dt className="order-last mt-1.5 text-xs tracking-wide text-muted uppercase">{item.label}</dt>
                <dd className="font-display text-4xl leading-none font-bold">{item.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
