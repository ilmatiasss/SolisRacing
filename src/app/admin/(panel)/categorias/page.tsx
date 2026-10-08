import { Plus, Save, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { ActionForm, ActionSubmit } from "@/components/admin/action-form";
import { SubmitButton } from "@/components/admin/form-buttons";
import { AdminPageHeader, Card, EmptyState } from "@/components/admin/ui";
import { DynamicIcon, ICONS } from "@/components/icons";
import { Input, Select } from "@/components/ui/field";
import { deleteCategory, saveCategory } from "@/lib/actions/admin/catalog";
import { requireAdmin } from "@/lib/auth";
import { listCategoriesAdmin } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Categorías" };

// Página del panel: siempre se consulta la base de datos al momento (no se prerenderiza).
export const instant = false;

function IconSelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <Select name="icon" defaultValue={defaultValue ?? "wrench"} aria-label="Ícono" className="h-10">
      {Object.entries(ICONS).map(([key, { label }]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </Select>
  );
}

export default async function CategoriesPage() {
  await requireAdmin();
  const categories = await listCategoriesAdmin();
  return (
    <>
      <AdminPageHeader title="Categorías" description="Organizan el catálogo y el menú de la tienda." />
      <Card title="Nueva categoría" className="mb-6">
        <ActionForm action={saveCategory} resetOnSuccess className="grid gap-3 md:grid-cols-[1fr_14rem_6rem_auto]">
          <Input name="name" placeholder="Nombre (ej: Llantas)" aria-label="Nombre" required className="h-10" />
          <IconSelect />
          <Input name="sortOrder" type="number" min={0} placeholder="Orden" aria-label="Orden" className="h-10" />
          <ActionSubmit className="h-10">
            <Plus className="size-4" /> Agregar
          </ActionSubmit>
          <Input name="description" placeholder="Descripción breve (opcional)" aria-label="Descripción" className="h-10 md:col-span-4" />
        </ActionForm>
      </Card>
      <Card title={`Categorías (${categories.length})`} bodyClassName="p-0">
        {categories.length === 0 ? (
          <EmptyState title="Aún no hay categorías" />
        ) : (
          <ul className="divide-y divide-line">
            {categories.map((category) => (
              <li key={category.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-brand-600">
                  <DynamicIcon name={category.icon} className="size-5" />
                </div>
                <ActionForm action={saveCategory} className="grid flex-1 gap-2 md:grid-cols-[1fr_12rem_5rem_auto]">
                  <input type="hidden" name="id" value={category.id} />
                  <Input name="name" defaultValue={category.name} aria-label="Nombre" required className="h-10" />
                  <IconSelect defaultValue={category.icon} />
                  <Input name="sortOrder" type="number" min={0} defaultValue={category.sortOrder} aria-label="Orden" className="h-10" />
                  <ActionSubmit variant="outline" className="h-10">
                    <Save className="size-4" /> Guardar
                  </ActionSubmit>
                  <Input
                    name="description"
                    defaultValue={category.description ?? ""}
                    placeholder="Descripción breve"
                    aria-label="Descripción"
                    className="h-10 md:col-span-4"
                  />
                </ActionForm>
                <div className="flex items-center gap-3 lg:w-40 lg:flex-col lg:items-end">
                  <span className="text-xs text-muted">{category.productCount} productos</span>
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={category.id} />
                    <SubmitButton
                      variant="ghost"
                      size="sm"
                      pendingText="…"
                      className="text-muted hover:text-red-600"
                      confirm={`¿Eliminar la categoría "${category.name}"? Sus productos quedarán sin categoría.`}
                    >
                      <Trash2 className="size-4" /> Eliminar
                    </SubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
