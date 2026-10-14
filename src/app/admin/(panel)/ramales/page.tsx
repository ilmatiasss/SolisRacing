import type { Metadata } from "next";
import Link from "next/link";
import { HarnessForm } from "@/components/admin/harness-form";
import { AdminPageHeader, Notice } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { readStoreSettings } from "@/lib/data/settings";
import { harnessPricing } from "@/lib/harness";

export const metadata: Metadata = { title: "Ramales" };

// Página del panel: siempre se consulta la base de datos al momento (no se prerenderiza).
export const instant = false;

export default async function HarnessAdminPage() {
  await requireAdmin();
  const pricing = harnessPricing(await readStoreSettings());

  return (
    <>
      <AdminPageHeader
        title="Ramales a medida"
        description="Los valores del cotizador: ajústalos a lo que cobras por materiales y mano de obra."
        actions={
          <Link href="/cotizador-ramal" target="_blank" className={buttonClasses({ variant: "outline", size: "sm" })}>
            Ver cotizador
          </Link>
        }
      />
      <Notice tone="info" className="mb-6">
        El cliente elige motor, computadora, sensores y extras, y ve un <strong>valor aproximado</strong> (un rango). Aquí defines
        cada precio y tu mano de obra; a la derecha ves cómo queda el cálculo antes de guardar. Las solicitudes formales llegan a{" "}
        <Link href="/admin/solicitudes" className="font-semibold underline">
          Solicitudes
        </Link>
        .
      </Notice>
      <HarnessForm initial={pricing} />
    </>
  );
}
