import type { Metadata } from "next";
import Link from "next/link";
import { PrivacyRequestForm } from "@/components/store/privacy-request-form";
import { PageHeader } from "@/components/store/section-heading";
import { Container } from "@/components/ui/container";
import { PRIVACY_RESPONSE_DAYS } from "@/lib/privacy";

export const metadata: Metadata = {
  title: "Ejercer mis derechos sobre mis datos",
  description: "Pide acceso, rectificación, supresión, oposición, portabilidad o bloqueo de tus datos personales.",
  alternates: { canonical: "/privacidad/derechos" },
};

export default function PrivacyRightsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Tus datos"
        title="Ejercer mis derechos"
        description={`Pide acceso, corrección o eliminación de tus datos personales. Respondemos dentro de ${PRIVACY_RESPONSE_DAYS} días corridos, sin costo.`}
      />
      <Container className="py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
          <div className="rounded-2xl border border-line bg-surface p-5 sm:p-8">
            <PrivacyRequestForm />
          </div>
          <aside className="space-y-4 text-sm text-zinc-300">
            <p>
              Estos derechos los reconoce la Ley N° 19.628 sobre protección de la vida privada, modificada por la Ley N° 21.719.
              Puedes ejercerlos de forma gratuita.
            </p>
            <p>
              Algunos datos de tus compras debemos conservarlos por obligaciones tributarias aunque pidas su eliminación; en ese
              caso te explicaremos cuáles y por cuánto tiempo.
            </p>
            <p>
              Más detalles en nuestra{" "}
              <Link href="/privacidad" className="font-semibold text-brand-400 hover:underline">
                política de privacidad
              </Link>
              .
            </p>
          </aside>
        </div>
      </Container>
    </>
  );
}
