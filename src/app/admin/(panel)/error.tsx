"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { buttonClasses } from "@/components/ui/button";

/** Error inesperado en una sección del panel: el menú sigue disponible para ir a otra sección. */
export default function PanelError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-lg border border-line bg-surface p-8 text-center">
      <h1 className="font-display text-2xl font-bold uppercase">No se pudo cargar esta sección</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Puede ser un corte momentáneo con la base de datos. Reintenta; si el problema sigue, anota el código de abajo.
      </p>
      <button type="button" onClick={() => retry()} className={buttonClasses({ className: "mt-6" })}>
        <RotateCcw className="size-4.5" />
        Reintentar
      </button>
      {error.digest && <p className="mt-4 text-xs text-muted">Código: {error.digest}</p>}
    </div>
  );
}
