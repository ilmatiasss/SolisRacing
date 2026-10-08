import { Search } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function NotFoundContent() {
  return (
    <Container className="flex flex-col items-center py-24 text-center">
      <p className="font-display text-8xl font-extrabold text-brand-600 italic">404</p>
      <h1 className="mt-4 font-display text-3xl font-extrabold uppercase italic sm:text-4xl">
        Te saliste de la pista
      </h1>
      <p className="mt-3 max-w-md text-muted">
        La página que buscas no existe o el producto ya no está disponible.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/productos" className={buttonClasses()}>
          <Search className="size-4.5" />
          Ir al catálogo
        </Link>
        <Link href="/" className={buttonClasses({ variant: "outline" })}>
          Volver al inicio
        </Link>
      </div>
    </Container>
  );
}
