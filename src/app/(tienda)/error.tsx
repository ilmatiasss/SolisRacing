"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/** Error inesperado en una página de la tienda: mantiene el encabezado y el pie, y permite reintentar. */
export default function StoreError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-col items-center py-24 text-center">
      <p className="font-display text-7xl font-bold text-brand-600">Ups</p>
      <h1 className="mt-4 font-display text-3xl font-bold uppercase sm:text-4xl">Algo falló al cargar esta página</h1>
      <p className="mt-3 max-w-md text-muted">
        Fue un problema nuestro, no tuyo. Inténtalo de nuevo en unos segundos; si sigue pasando, escríbenos por WhatsApp.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => retry()} className={buttonClasses()}>
          <RotateCcw className="size-4.5" />
          Reintentar
        </button>
        <Link href="/" className={buttonClasses({ variant: "outline" })}>
          Volver al inicio
        </Link>
      </div>
      {error.digest && <p className="mt-6 text-xs text-zinc-500">Código: {error.digest}</p>}
    </Container>
  );
}
