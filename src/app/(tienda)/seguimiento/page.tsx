import type { Metadata } from "next";
import { PageHeader } from "@/components/store/section-heading";
import { TrackingForm } from "@/components/store/tracking-form";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Seguimiento de pedidos",
  description: "Revisa el estado de tu pedido con tu número de pedido y correo.",
  alternates: { canonical: "/seguimiento" },
};

export default function TrackingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Tu compra"
        title="Seguimiento de pedidos"
        description="Ingresa tu número de pedido y el correo con que compraste para ver el estado y el número de seguimiento del despacho."
      />
      <Container className="py-12">
        <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <TrackingForm />
        </div>
      </Container>
    </>
  );
}
