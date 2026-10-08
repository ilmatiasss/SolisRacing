"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

/** Envía al cliente a Webpay con un POST (token_ws), como exige Transbank. */
export function WebpayRedirect({ url, token }: { url: string; token: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.submit();
  }, []);

  return (
    <div className="flex flex-col items-center rounded-2xl border border-line bg-surface px-6 py-16 text-center">
      <LoaderCircle className="size-10 animate-spin text-brand-500" />
      <p className="mt-4 font-display text-2xl font-bold uppercase italic">Redirigiendo a Webpay…</p>
      <p className="mt-2 text-sm text-muted">No cierres esta ventana. Si no avanza en unos segundos, presiona el botón.</p>
      <form ref={formRef} method="POST" action={url} className="mt-6">
        <input type="hidden" name="token_ws" value={token} />
        <Button type="submit">Ir a pagar</Button>
      </form>
    </div>
  );
}
