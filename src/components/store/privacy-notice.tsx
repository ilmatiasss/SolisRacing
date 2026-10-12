import Link from "next/link";
import { cn } from "@/lib/cn";

/** Aviso breve al pedir datos personales (deber de información): para qué se usan y enlace a la política. */
export function PrivacyNotice({ purpose, className }: { purpose: string; className?: string }) {
  return (
    <p className={cn("text-xs text-muted", className)}>
      Usaremos tus datos solo para {purpose}. Más detalles en nuestra{" "}
      <Link href="/privacidad" className="underline hover:text-fg">
        política de privacidad
      </Link>
      .
    </p>
  );
}
