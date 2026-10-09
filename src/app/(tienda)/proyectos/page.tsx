import { Gauge } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";
import { ProjectGallery } from "@/components/store/project-gallery";
import { PageHeader } from "@/components/store/section-heading";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getStoreSettings } from "@/lib/data/settings";
import { whatsappLink } from "@/lib/format";
import { parseProjectPosts } from "@/lib/instagram";

export const metadata: Metadata = {
  title: "Proyectos",
  description: "Autos que pasaron por nuestro taller en Antofagasta: instalaciones, seteos y resultados reales.",
  alternates: { canonical: "/proyectos" },
};

export default async function ProjectsPage() {
  const settings = await getStoreSettings();
  const posts = parseProjectPosts(settings.projectPosts);

  return (
    <>
      <PageHeader
        eyebrow="Proyectos"
        title="Autos que pasaron por el taller"
        description="Instalaciones, seteos y resultados reales de nuestros clientes."
      />
      <Container className="py-14">
        {posts.length > 0 ? (
          <ProjectGallery posts={posts} />
        ) : (
          <p className="text-center text-muted">Pronto publicaremos aquí nuestros proyectos. Mientras, míralos en Instagram.</p>
        )}
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Link href="/servicios" className={buttonClasses({ size: "lg" })}>
            <Gauge className="size-5" />
            Quiero el mío: agendar un seteo
          </Link>
          {settings.instagram && (
            <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: "outline", size: "lg" })}>
              <InstagramIcon className="size-5" />
              Más en Instagram
            </a>
          )}
          <a
            href={whatsappLink(settings.whatsapp, "Hola, vi sus proyectos y quiero cotizar para mi auto.")}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ variant: "outline", size: "lg" })}
          >
            <WhatsAppIcon className="size-5" />
            Cotizar por WhatsApp
          </a>
        </div>
      </Container>
    </>
  );
}
