import { Plus, Save, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { ActionForm, ActionSubmit } from "@/components/admin/action-form";
import { SubmitButton } from "@/components/admin/form-buttons";
import { AdminPageHeader, Card, EmptyState } from "@/components/admin/ui";
import { Input } from "@/components/ui/field";
import { deleteMake, deleteModel, saveMake, saveModel } from "@/lib/actions/admin/catalog";
import { requireAdmin } from "@/lib/auth";
import { listVehiclesAdmin } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Vehículos" };

// Página del panel: siempre se consulta la base de datos al momento (no se prerenderiza).
export const instant = false;

export default async function VehiclesPage() {
  await requireAdmin();
  const makes = await listVehiclesAdmin();
  return (
    <>
      <AdminPageHeader
        title="Vehículos"
        description="Marcas y modelos de autos para el buscador «Encuentra repuestos para tu auto» y la compatibilidad de cada pieza."
      />
      <Card title="Nueva marca de auto" className="mb-6">
        <ActionForm action={saveMake} resetOnSuccess className="flex flex-wrap gap-3">
          <Input name="name" placeholder="Ej: Kia" aria-label="Marca de auto" required className="h-10 max-w-sm flex-1" />
          <ActionSubmit className="h-10">
            <Plus className="size-4" /> Agregar marca
          </ActionSubmit>
        </ActionForm>
      </Card>
      {makes.length === 0 ? (
        <Card>
          <EmptyState title="Aún no hay vehículos" description="Agrega marcas y luego sus modelos." />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {makes.map((make) => (
            <Card
              key={make.id}
              title={
                <ActionForm action={saveMake} showSuccess={false} className="flex gap-2">
                  <input type="hidden" name="id" value={make.id} />
                  <Input name="name" defaultValue={make.name} aria-label="Marca" required className="h-9 font-semibold" />
                  <ActionSubmit variant="outline" className="h-9">
                    <Save className="size-4" />
                    <span className="sr-only">Guardar marca</span>
                  </ActionSubmit>
                </ActionForm>
              }
              actions={
                <form action={deleteMake}>
                  <input type="hidden" name="id" value={make.id} />
                  <SubmitButton
                    variant="ghost"
                    size="sm"
                    pendingText="…"
                    className="text-muted hover:text-red-600"
                    confirm={`¿Eliminar ${make.name} y todos sus modelos? Se quitará la compatibilidad de los productos asociados.`}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Eliminar marca</span>
                  </SubmitButton>
                </form>
              }
              bodyClassName="p-0"
            >
              <ul className="divide-y divide-line">
                {make.models.map((model) => (
                  <li key={model.id} className="flex items-center gap-2 px-5 py-2">
                    <ActionForm action={saveModel} showSuccess={false} className="flex flex-1 gap-2">
                      <input type="hidden" name="id" value={model.id} />
                      <input type="hidden" name="makeId" value={make.id} />
                      <Input name="name" defaultValue={model.name} aria-label="Modelo" required className="h-9" />
                      <ActionSubmit variant="ghost" className="h-9">
                        <Save className="size-4" />
                        <span className="sr-only">Guardar modelo</span>
                      </ActionSubmit>
                    </ActionForm>
                    <span className="w-16 text-right text-xs text-muted">{model.productCount} prod.</span>
                    <form action={deleteModel}>
                      <input type="hidden" name="id" value={model.id} />
                      <SubmitButton
                        variant="ghost"
                        size="sm"
                        pendingText="…"
                        className="h-9 text-muted hover:text-red-600"
                        confirm={`¿Eliminar el modelo ${model.name}?`}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Eliminar modelo</span>
                      </SubmitButton>
                    </form>
                  </li>
                ))}
              </ul>
              <ActionForm action={saveModel} resetOnSuccess className="flex flex-wrap gap-2 border-t border-line bg-surface-2/60 px-5 py-3">
                <input type="hidden" name="makeId" value={make.id} />
                <Input name="name" placeholder={`Nuevo modelo de ${make.name}`} aria-label="Nuevo modelo" required className="h-9 flex-1" />
                <ActionSubmit variant="outline" className="h-9">
                  <Plus className="size-4" /> Modelo
                </ActionSubmit>
              </ActionForm>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
