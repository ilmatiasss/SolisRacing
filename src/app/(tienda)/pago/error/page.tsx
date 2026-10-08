import { TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "No pudimos procesar el pago", robots: { index: false } };

export default function PaymentErrorPage() {
  return (
    <Container className="flex flex-col items-center py-24 text-center">
      <TriangleAlert className="size-12 text-signal-400" />
      <h1 className="mt-6 font-display text-4xl font-extrabold uppercase italic">No pudimos procesar el pago</h1>
      <p className="mt-3 max-w-md text-muted">
        La respuesta de Webpay no corresponde a ningún pedido activo. Si se realizó un cargo en tu tarjeta, escríbenos
        con el comprobante y lo revisamos de inmediato.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/carrito" className={buttonClasses()}>
          Volver al carrito
        </Link>
        <Link href="/contacto" className={buttonClasses({ variant: "outline" })}>
          Contactar a la tienda
        </Link>
      </div>
    </Container>
  );
}
