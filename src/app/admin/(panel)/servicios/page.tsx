import { Plus, Save, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { ActionForm, ActionSubmit } from "@/components/admin/action-form";
import { SubmitButton } from "@/components/admin/form-buttons";
import { ServiceFields } from "@/components/admin/service-fields";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { DynamicIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { deleteService, saveService } from "@/lib/actions/admin/services";
import { requireAdmin } from "@/lib/auth";
import { listServicesAdmin } from "@/lib/data/admin";
import { formatCLP } from "@/lib/format";

export const metadata: Metadata = { title: "Servicios" };

// Página del panel: siempre se consulta la base de datos al momento (no se prerenderiza).
export const instant = false;

export default async function ServicesAdminPage() {
  await requireAdmin();
  const services = await listServicesAdmin();
  return (
    <>
      <AdminPageHeader title="Servicios" description="Seteos y trabajos de taller que se muestran en /servicios." />
      <div className="space-y-4">
        {services.map((service) => (
          <details key={service.id} className="group rounded-2xl border border-line bg-surface shadow-xs">
            <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4">
              <span className="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-brand-600">
                <DynamicIcon name={service.icon} className="size-5" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">{service.name}</span>
                <span className="text-sm text-muted">
                  {service.priceFrom ? `Desde ${formatCLP(service.priceFrom)}` : "Cotización"}
                  {service.duration && ` · ${service.duration}`}
                </span>
              </span>
              {!service.active && <Badge>Oculto</Badge>}
              <span className="text-sm text-brand-600 group-open:hidden">Editar</span>
            </summary>
            <div className="border-t border-line p-5">
              <ActionForm action={saveService} className="space-y-4">
                <ServiceFields service={service} />
                <ActionSubmit>
                  <Save className="size-4" /> Guardar servicio
                </ActionSubmit>
              </ActionForm>
              <form action={deleteService} className="mt-4 border-t border-line pt-4">
                <input type="hidden" name="id" value={service.id} />
                <SubmitButton
                  variant="ghost"
                  size="sm"
                  pendingText="Eliminando…"
                  className="text-muted hover:text-red-600"
                  confirm={`¿Eliminar el servicio "${service.name}"?`}
                >
                  <Trash2 className="size-4" /> Eliminar servicio
                </SubmitButton>
              </form>
            </div>
          </details>
        ))}
      </div>
      <Card title="Nuevo servicio" className="mt-6">
        <ActionForm action={saveService} resetOnSuccess className="space-y-4">
          <ServiceFields />
          <ActionSubmit>
            <Plus className="size-4" /> Crear servicio
          </ActionSubmit>
        </ActionForm>
      </Card>
    </>
  );
}
