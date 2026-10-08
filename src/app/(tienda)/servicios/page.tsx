import { Clock, Gauge } from "lucide-react";
import type { Metadata } from "next";
import { DynamicIcon, WhatsAppIcon } from "@/components/icons";
import { InquiryForm } from "@/components/store/inquiry-form";
import { ScheduleButton } from "@/components/store/schedule-button";
import { PageHeader, SectionHeading } from "@/components/store/section-heading";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getActiveServices } from "@/lib/data/catalog";
import { getStoreSettings } from "@/lib/data/settings";
import { formatCLP, whatsappLink } from "@/lib/format";

export const metadata: Metadata = {
  title: "Servicios y seteos",
  description:
    "Instalación y programación de FuelTech, arneses eléctricos a medida, sistemas de combustible, sensores y relojería. Seteos en Antofagasta.",
  alternates: { canonical: "/servicios" },
};

const STEPS = [
  { title: "Asesoría", text: "Conversamos tu proyecto y elegimos las piezas correctas para tu motor y tu uso." },
  { title: "Cotización", text: "Te enviamos un presupuesto claro con piezas y mano de obra." },
  { title: "Instalación", text: "ECU, arnés, sensores y combustible instalados con terminaciones profesionales." },
  { title: "Seteo y entrega", text: "Ajustamos el mapa, revisamos todo funcionando y te entregamos el auto." },
];

const FAQ = [
  {
    q: "¿Trabajan con FuelTech?",
    a: "Sí. Te asesoramos para elegir el equipo y los sensores adecuados, y coordinamos la instalación y el seteo.",
  },
  {
    q: "¿Hacen arneses a medida?",
    a: "Sí. Armamos arneses eléctricos según tu motor y tu ECU, con conectores y terminales de calidad.",
  },
  {
    q: "¿Necesito comprar las piezas con ustedes?",
    a: "No es obligatorio, pero si las compras con nosotros te asesoramos para que sean compatibles y aprovechen el seteo.",
  },
];

export default async function ServicesPage() {
  const [services, settings] = await Promise.all([getActiveServices(), getStoreSettings()]);

  return (
    <>
      <PageHeader
        eyebrow="Servicios"
        title="Servicios y seteos"
        description="Instalación y programación de FuelTech, arneses eléctricos a medida, sistemas de combustible, sensores y relojería. Te acompañamos desde la elección de piezas hasta el seteo final."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#agendar" className={buttonClasses({ size: "lg" })}>
            <Gauge className="size-5" />
            Agendar hora
          </a>
          <a
            href={whatsappLink(settings.whatsapp, "Hola, quiero cotizar un seteo para mi auto.")}
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

      <Container className="grid gap-12 py-14 lg:grid-cols-[1.3fr_1fr]">
        <section id="agendar" className="scroll-mt-32" aria-labelledby="agendar-titulo">
          <h2 id="agendar-titulo" className="font-display text-3xl font-extrabold uppercase italic">
            Agenda tu hora
          </h2>
          <p className="mt-2 mb-6 text-muted">
            Déjanos tus datos y te contactamos para confirmar el día y el presupuesto.
          </p>
          <div className="rounded-2xl border border-line bg-surface p-6">
            <InquiryForm kind="service" services={services.map(({ id, name }) => ({ id, name }))} />
          </div>
        </section>
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
