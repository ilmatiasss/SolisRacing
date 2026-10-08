import { Plus, Save, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { ActionForm, ActionSubmit } from "@/components/admin/action-form";
import { SubmitButton } from "@/components/admin/form-buttons";
import { AdminPageHeader, Card, EmptyState } from "@/components/admin/ui";
import { Input } from "@/components/ui/field";
import { deleteBrand, saveBrand } from "@/lib/actions/admin/catalog";
import { requireAdmin } from "@/lib/auth";
import { listBrandsAdmin } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Marcas" };

// Página del panel: siempre se consulta la base de datos al momento (no se prerenderiza).
export const instant = false;

export default async function BrandsPage() {
  await requireAdmin();
  const brands = await listBrandsAdmin();
  return (
    <>
      <AdminPageHeader title="Marcas" description="Fabricantes de las piezas que vendes (K&N, Brembo, Motul…)." />
      <Card title="Nueva marca" className="mb-6">
        <ActionForm action={saveBrand} resetOnSuccess className="flex flex-wrap gap-3">
          <Input name="name" placeholder="Nombre de la marca" aria-label="Nombre" required className="h-10 max-w-sm flex-1" />
          <ActionSubmit className="h-10">
            <Plus className="size-4" /> Agregar
          </ActionSubmit>
        </ActionForm>
      </Card>
      <Card title={`Marcas (${brands.length})`} bodyClassName="p-0">
        {brands.length === 0 ? (
          <EmptyState title="Aún no hay marcas" />
        ) : (
          <ul className="grid divide-y divide-line md:grid-cols-2 md:divide-y-0">
            {brands.map((brand) => (
              <li key={brand.id} className="flex items-start gap-2 border-line p-3 md:border-b md:odd:border-r">
                <ActionForm action={saveBrand} className="flex flex-1 flex-wrap gap-2">
                  <input type="hidden" name="id" value={brand.id} />
                  <Input name="name" defaultValue={brand.name} aria-label="Nombre" required className="h-9 flex-1" />
                  <ActionSubmit variant="outline" className="h-9">
                    <Save className="size-4" />
                  </ActionSubmit>
                </ActionForm>
                <span className="mt-2 w-20 text-right text-xs text-muted">{brand.productCount} prod.</span>
                <form action={deleteBrand}>
                  <input type="hidden" name="id" value={brand.id} />
                  <SubmitButton
                    variant="ghost"
                    size="sm"
                    pendingText="…"
                    className="h-9 text-muted hover:text-red-600"
                    confirm={`¿Eliminar la marca "${brand.name}"? Sus productos quedarán sin marca.`}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Eliminar</span>
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
