import { ArrowRight, Cable, Clock, Gauge } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DynamicIcon, WhatsAppIcon } from "@/components/icons";
import { ScheduleButton } from "@/components/store/schedule-button";
import { ServiceBooking } from "@/components/store/service-booking";
import { PageHeader, SectionHeading } from "@/components/store/section-heading";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getActiveServices } from "@/lib/data/catalog";
import { parseServiceLocations } from "@/lib/booking";
import { getStoreSettings } from "@/lib/data/settings";
import { formatCLP, whatsappLink } from "@/lib/format";

export const metadata: Metadata = {
  title: "Servicios y programación",
  description:
    "Instalación y programación de FuelTech, arneses eléctricos a medida, sistemas de combustible, sensores y relojería. Programación en Antofagasta y la Región de Valparaíso. Agenda tu hora en línea.",
  alternates: { canonical: "/servicios" },
};

const STEPS = [
  { title: "Asesoría", text: "Conversamos tu proyecto y elegimos las piezas correctas para tu motor y tu uso." },
  { title: "Cotización", text: "Te enviamos un presupuesto claro con piezas y mano de obra." },
  { title: "Instalación", text: "ECU, arnés, sensores y combustible instalados con terminaciones profesionales." },
  { title: "Programación y entrega", text: "Ajustamos el mapa, revisamos todo funcionando y te entregamos el auto." },
];

const FAQ = [
  {
    q: "¿Atienden fuera de Antofagasta?",
    a: "Sí. Además de la tienda en Antofagasta, atendemos en la Región de Valparaíso en visitas programadas. Elige el lugar al agendar.",
  },
  {
    q: "¿Trabajan con FuelTech?",
    a: "Sí. Te asesoramos para elegir el equipo y los sensores adecuados, y coordinamos la instalación y la programación.",
  },
  {
    q: "¿Hacen arneses a medida?",
    a: "Sí. Armamos arneses eléctricos según tu motor y tu ECU, con conectores y terminales de calidad.",
  },
  {
    q: "¿Necesito comprar las piezas con ustedes?",
    a: "No es obligatorio, pero si las compras con nosotros te asesoramos para que sean compatibles y aprovechen la programación.",
  },
];

export default async function ServicesPage() {
  const [services, settings] = await Promise.all([getActiveServices(), getStoreSettings()]);

  return (
    <>
      <PageHeader
        eyebrow="Servicios"
        title="Servicios y programación"
        description="Instalación y programación de FuelTech, arneses eléctricos a medida, sistemas de combustible, sensores y relojería. Te acompañamos desde la elección de piezas hasta la programación final."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#agendar" className={buttonClasses({ size: "lg" })}>
            <Gauge className="size-5" />
            Agendar hora
          </a>
          <a
            href={whatsappLink(settings.whatsapp, "Hola, quiero cotizar la programación de mi auto.")}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ size: "lg", variant: "outline" })}
          >
            <WhatsAppIcon className="size-5" />
            Cotizar por WhatsApp
          </a>
        </div>
      </PageHeader>

      <Container className="py-14">
        {services.length === 0 ? (
          <p className="text-muted">Pronto publicaremos nuestros servicios. Escríbenos para cotizar.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {services.map((service) => (
              <article
                key={service.id}
                id={service.slug}
                className="flex scroll-mt-32 flex-col rounded-2xl border border-line bg-surface p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-500">
                    <DynamicIcon name={service.icon} className="size-6" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl leading-tight font-bold uppercase italic">{service.name}</h2>
                    {service.summary && <p className="mt-1 text-sm text-zinc-300">{service.summary}</p>}
                  </div>
                </div>
                {service.description && <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">{service.description}</p>}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                    <span className="font-semibold">
                      {service.priceFrom ? `Desde ${formatCLP(service.priceFrom)}` : "Cotización sin costo"}
                    </span>
                    {service.duration && (
                      <span className="flex items-center gap-1.5 text-muted">
                        <Clock className="size-4" />
                        {service.duration}
                      </span>
                    )}
                  </div>
                  <ScheduleButton serviceId={service.id} />
                </div>
              </article>
            ))}
          </div>
        )}
      </Container>

      <Container className="pb-14">
        <div className="flex flex-col gap-6 rounded-3xl border border-brand-600/40 bg-linear-to-br from-brand-950/60 to-surface p-6 shadow-[0_0_40px_rgba(255,30,30,0.12)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-5">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-600/20 text-brand-400">
              <Cable className="size-7" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-extrabold uppercase italic sm:text-3xl">¿Necesitas un ramal a medida?</h2>
              <p className="mt-1 text-zinc-300">
                Elige tu motor, la FuelTech y los sensores, y ve al instante un valor aproximado.
              </p>
            </div>
          </div>
          <Link href="/cotizador-ramal" className={buttonClasses({ size: "lg", className: "group shrink-0" })}>
            Cotizar mi ramal
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </Container>

      <section className="border-y border-line bg-zinc-950">
        <Container className="py-14">
          <SectionHeading eyebrow="Proceso" title="Cómo trabajamos" />
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative rounded-2xl border border-line bg-surface p-6">
                <span className="font-display text-5xl font-extrabold text-brand-600/30 italic">0{index + 1}</span>
                <p className="mt-2 font-display text-xl font-bold uppercase italic">{step.title}</p>
                <p className="mt-1 text-sm text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <Container className="py-14">
        <section id="agendar" className="scroll-mt-32" aria-labelledby="agendar-titulo">
          <h2 id="agendar-titulo" className="font-display text-3xl font-extrabold uppercase italic sm:text-4xl">
            Agenda tu hora
          </h2>
          <p className="mt-2 mb-6 max-w-2xl text-muted">
            Atendemos en Antofagasta y también en la Región de Valparaíso. Elige el lugar, el día y la hora, y te
            confirmamos por WhatsApp.
          </p>
          <div className="rounded-2xl border border-line bg-surface p-5 sm:p-8">
            {services.length > 0 ? (
              <ServiceBooking
                services={services.map(({ id, name }) => ({ id, name }))}
                locations={parseServiceLocations(settings.serviceLocations)}
                whatsapp={settings.whatsapp}
              />
            ) : (
              <p className="text-muted">Escríbenos por WhatsApp para agendar.</p>
            )}
          </div>
        </section>
      </Container>

      <Container className="max-w-3xl pb-14">
        <section aria-labelledby="faq-titulo">
          <h2 id="faq-titulo" className="font-display text-3xl font-extrabold uppercase italic">
            Preguntas frecuentes
          </h2>
          <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-surface">
            {FAQ.map((item) => (
              <details key={item.q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {item.q}
                  <span className="text-brand-500 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted">{item.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-line bg-surface p-5 text-sm">
            <p className="font-semibold">Horario de atención</p>
            <p className="mt-1 whitespace-pre-line text-muted">{settings.openingHours}</p>
            <p className="mt-3 text-muted">
              {settings.address}, {settings.city}
            </p>
          </div>
        </section>
      </Container>
    </>
  );
}
