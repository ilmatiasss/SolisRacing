"use client";

import { CheckCircle2, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, FieldError, Input, Select, Textarea } from "@/components/ui/field";
import { saveProduct, type ProductFormState } from "@/lib/actions/admin/products";
import { formatCLP, parseCLP } from "@/lib/format";
import { slugify } from "@/lib/text";
import { ImageManager, type ManagedImage } from "./image-manager";
import { Card, Notice } from "./ui";

type Option = { id: number; name: string };
type MakeOption = Option & { models: Option[] };

export type ProductFormValues = {
  id?: number;
  name: string;
  slug: string;
  sku: string | null;
  brandId: number | null;
  categoryId: number | null;
  price: number | null;
  compareAtPrice: number | null;
  stock: number;
  status: "active" | "draft" | "archived";
  featured: boolean;
  universal: boolean;
  shortDescription: string | null;
  description: string | null;
  specs: { label: string; value: string }[];
  fitments: { makeId: number | null; modelId: number | null; yearFrom: number | null; yearTo: number | null; notes: string | null }[];
  images: ManagedImage[];
};

type FitmentRow = { key: number; makeId: string; modelId: string; yearFrom: string; yearTo: string; notes: string };
type SpecRow = { key: number; label: string; value: string };

/** Clave única para filas nuevas (solo se llama en manejadores de eventos). */
const newKey = () => Date.now() + Math.random();

export function ProductForm({
  initial,
  categories,
  brands,
  makes,
  created,
}: {
  initial: ProductFormValues;
  categories: Option[];
  brands: Option[];
  makes: MakeOption[];
  created?: boolean;
}) {
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProduct, {});
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [price, setPrice] = useState(initial.price ? String(initial.price) : "");
  const [compareAt, setCompareAt] = useState(initial.compareAtPrice ? String(initial.compareAtPrice) : "");
  const [images, setImages] = useState<ManagedImage[]>(initial.images);
  const [uploading, setUploading] = useState(false);
  const [specs, setSpecs] = useState<SpecRow[]>(() =>
    initial.specs.map((spec, index) => ({ key: -(index + 1), label: spec.label, value: spec.value })),
  );
  const [fitments, setFitments] = useState<FitmentRow[]>(() =>
    initial.fitments.map((f, index) => ({
      key: -(index + 1),
      makeId: f.makeId ? String(f.makeId) : "",
      modelId: f.modelId ? String(f.modelId) : "",
      yearFrom: f.yearFrom ? String(f.yearFrom) : "",
      yearTo: f.yearTo ? String(f.yearTo) : "",
      notes: f.notes ?? "",
    })),
  );
  const errors = state.fieldErrors ?? {};
  const effectiveSlug = slugTouched ? slug : slugify(name);

  function updateFitment(key: number, patch: Partial<FitmentRow>) {
    setFitments((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
      }}
      className="grid gap-6 xl:grid-cols-[1fr_22rem]"
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input
        type="hidden"
        name="specs"
        value={JSON.stringify(specs.map(({ label, value }) => ({ label, value })).filter((s) => s.label || s.value))}
      />
      <input
        type="hidden"
        name="fitments"
        value={JSON.stringify(
          fitments
            .filter((f) => f.modelId)
            .map((f) => ({ modelId: Number(f.modelId), yearFrom: f.yearFrom, yearTo: f.yearTo, notes: f.notes })),
        )}
      />

      <div className="space-y-6">
        {created && <Notice tone="success">Producto creado. Puedes seguir editándolo.</Notice>}
        {state.ok && (
          <Notice tone="success" className="flex items-center gap-2">
            <CheckCircle2 className="size-4.5" /> Cambios guardados.
          </Notice>
        )}
        {state.error && <Notice tone="danger">{state.error}</Notice>}

        <Card title="Información básica">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="name" error={errors.name} className="sm:col-span-2">
              <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
            </Field>
            <Field
              label="URL del producto"
              htmlFor="slug"
              error={errors.slug}
              hint={`/productos/${effectiveSlug || "…"}`}
            >
              <Input
                id="slug"
                name="slug"
                value={effectiveSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
              />
            </Field>
            <Field label="SKU / código" htmlFor="sku" optional error={errors.sku}>
              <Input id="sku" name="sku" defaultValue={initial.sku ?? ""} />
            </Field>
            <Field label="Marca" htmlFor="brandId" hint={<Link href="/admin/marcas" className="underline">Administrar marcas</Link>}>
              <Select id="brandId" name="brandId" defaultValue={initial.brandId ?? ""}>
                <option value="">Sin marca</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Categoría"
              htmlFor="categoryId"
              hint={<Link href="/admin/categorias" className="underline">Administrar categorías</Link>}
            >
              <Select id="categoryId" name="categoryId" defaultValue={initial.categoryId ?? ""}>
                <option value="">Sin categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Descripción corta" htmlFor="shortDescription" optional className="sm:col-span-2" hint="Se muestra junto al precio. Máximo 300 caracteres.">
              <Textarea id="shortDescription" name="shortDescription" rows={2} maxLength={300} defaultValue={initial.shortDescription ?? ""} />
            </Field>
            <Field
              label="Descripción"
              htmlFor="description"
              optional
              className="sm:col-span-2"
              hint='Separa párrafos con una línea en blanco. Para listas, empieza cada línea con "- ".'
            >
              <Textarea id="description" name="description" rows={8} defaultValue={initial.description ?? ""} />
            </Field>
          </div>
        </Card>

        <Card title="Fotos">
          <ImageManager images={images} onChange={setImages} productName={name} onBusyChange={setUploading} />
          <FieldError message={errors.images} />
        </Card>

        <Card
          title="Compatibilidad"
          description="Autos en los que sirve esta pieza. Se usan en el buscador por marca, modelo y año."
        >
          {makes.length === 0 ? (
            <p className="text-sm text-muted">
              Primero agrega marcas y modelos en <Link href="/admin/vehiculos" className="underline">Vehículos</Link>.
            </p>
          ) : (
            <div className="space-y-3">
              {fitments.length > 0 && (
                <div className="hidden grid-cols-[1fr_1fr_5.5rem_5.5rem_1fr_2.5rem] gap-2 text-xs font-medium text-muted md:grid">
                  <span>Marca</span>
                  <span>Modelo</span>
                  <span>Año desde</span>
                  <span>Año hasta</span>
                  <span>Notas</span>
                  <span />
                </div>
              )}
              {fitments.map((row) => {
                const models = makes.find((make) => String(make.id) === row.makeId)?.models ?? [];
                return (
                  <div key={row.key} className="grid grid-cols-2 gap-2 rounded-xl border border-line p-3 md:grid-cols-[1fr_1fr_5.5rem_5.5rem_1fr_2.5rem] md:border-0 md:p-0">
                    <Select
                      aria-label="Marca del auto"
                      value={row.makeId}
                      onChange={(e) => updateFitment(row.key, { makeId: e.target.value, modelId: "" })}
                    >
                      <option value="">Marca</option>
                      {makes.map((make) => (
                        <option key={make.id} value={make.id}>
                          {make.name}
                        </option>
                      ))}
                    </Select>
                    <Select
                      aria-label="Modelo"
                      value={row.modelId}
                      disabled={!row.makeId}
                      onChange={(e) => updateFitment(row.key, { modelId: e.target.value })}
                    >
                      <option value="">Modelo</option>
                      {models.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </Select>
                    <Input
                      aria-label="Año desde"
                      inputMode="numeric"
                      placeholder="Desde"
                      value={row.yearFrom}
                      onChange={(e) => updateFitment(row.key, { yearFrom: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    />
                    <Input
                      aria-label="Año hasta"
                      inputMode="numeric"
                      placeholder="Hasta"
                      value={row.yearTo}
                      onChange={(e) => updateFitment(row.key, { yearTo: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    />
                    <Input
                      aria-label="Notas"
                      placeholder="Ej: motor 2.0 turbo"
                      value={row.notes}
                      className="col-span-2 md:col-span-1"
                      onChange={(e) => updateFitment(row.key, { notes: e.target.value })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Quitar compatibilidad"
                      className="text-muted hover:text-red-600"
                      onClick={() => setFitments((rows) => rows.filter((r) => r.key !== row.key))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFitments((rows) => [...rows, { key: newKey(), makeId: "", modelId: "", yearFrom: "", yearTo: "", notes: "" }])
                }
              >
                <Plus className="size-4" /> Agregar auto compatible
              </Button>
              <FieldError message={errors.fitments} />
            </div>
          )}
        </Card>

        <Card title="Especificaciones" description="Datos técnicos que se muestran en una tabla en la ficha.">
          <div className="space-y-2">
            {specs.map((row) => (
              <div key={row.key} className="grid grid-cols-[1fr_1.5fr_2.5rem] gap-2">
                <Input
                  aria-label="Característica"
                  placeholder="Ej: Diámetro"
                  value={row.label}
                  onChange={(e) =>
                    setSpecs((rows) => rows.map((r) => (r.key === row.key ? { ...r, label: e.target.value } : r)))
                  }
                />
                <Input
                  aria-label="Valor"
                  placeholder="Ej: 3 pulgadas"
                  value={row.value}
                  onChange={(e) =>
                    setSpecs((rows) => rows.map((r) => (r.key === row.key ? { ...r, value: e.target.value } : r)))
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Quitar especificación"
                  className="text-muted hover:text-red-600"
                  onClick={() => setSpecs((rows) => rows.filter((r) => r.key !== row.key))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSpecs((rows) => [...rows, { key: newKey(), label: "", value: "" }])}
            >
              <Plus className="size-4" /> Agregar especificación
            </Button>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Publicación" className="xl:sticky xl:top-6">
          <div className="space-y-4">
            <Field label="Estado" htmlFor="status">
              <Select id="status" name="status" defaultValue={initial.status}>
                <option value="active">Activo (visible en la tienda)</option>
                <option value="draft">Borrador (oculto)</option>
                <option value="archived">Archivado (oculto)</option>
              </Select>
            </Field>
            <Field
              label="Precio (IVA incluido)"
              htmlFor="price"
              error={errors.price}
              hint={parseCLP(price) ? formatCLP(parseCLP(price)!) : "En pesos, sin decimales"}
            >
              <Input
                id="price"
                name="price"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                aria-invalid={!!errors.price}
              />
            </Field>
            <Field
              label="Precio anterior"
              htmlFor="compareAtPrice"
              optional
              error={errors.compareAtPrice}
              hint={
                parseCLP(compareAt)
                  ? `${formatCLP(parseCLP(compareAt)!)} tachado → se muestra como oferta`
                  : "Úsalo para mostrar el producto en oferta"
              }
            >
              <Input
                id="compareAtPrice"
                name="compareAtPrice"
                inputMode="numeric"
                value={compareAt}
                onChange={(e) => setCompareAt(e.target.value)}
                aria-invalid={!!errors.compareAtPrice}
              />
            </Field>
            <Field label="Stock disponible" htmlFor="stock" error={errors.stock}>
              <Input id="stock" name="stock" type="number" min={0} step={1} defaultValue={initial.stock} aria-invalid={!!errors.stock} />
            </Field>
            <Checkbox name="featured" defaultChecked={initial.featured} label="Destacado" description="Aparece en la portada." />
            <Checkbox
              name="universal"
              defaultChecked={initial.universal}
              label="Universal"
              description="Sirve para cualquier auto (aceites, herramientas, accesorios)."
            />
            <Button type="submit" size="lg" className="w-full" disabled={pending || uploading}>
              <Save className="size-4.5" />
              {pending
                ? "Guardando…"
                : uploading
                  ? "Subiendo fotos…"
                  : initial.id
                    ? "Guardar cambios"
                    : "Crear producto"}
            </Button>
          </div>
        </Card>
      </div>
    </form>
  );
}
