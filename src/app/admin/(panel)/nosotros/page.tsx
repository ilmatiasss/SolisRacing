import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { AboutForm } from "@/components/admin/about-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { readStoreSettings } from "@/lib/data/settings";

export const metadata: Metadata = { title: "Quiénes somos" };

// Página del panel: siempre se consulta la base de datos al momento (no se prerenderiza).
export const instant = false;

export default async function AboutAdminPage() {
  await requireAdmin();
  const settings = await readStoreSettings();
  return (
    <>
      <AdminPageHeader
        title="Quiénes somos"
        description="Tu historia, tus proyectos y tus videos: lo que hace que un cliente confíe en ti antes de comprar."
        actions={
          <a href="/nosotros" target="_blank" className={buttonClasses({ size: "sm", variant: "outline" })}>
            <ExternalLink className="size-4" />
            Ver la página
          </a>
        }
      />
      <AboutForm initial={settings.about} instagramPosts={settings.instagramPosts} />
    </>
  );
}
