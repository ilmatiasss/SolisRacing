import { ExternalLink, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/admin/form-buttons";
import { ProductForm } from "@/components/admin/product-form";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { deleteProduct } from "@/lib/actions/admin/products";
import { requireAdmin } from "@/lib/auth";
import { getProductForEdit, getProductFormOptions } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Editar producto" };

// Página del panel: siempre se consulta la base de datos al momento (no se prerenderiza).
export const instant = false;

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/productos/[id]">) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();
  const [product, options] = await Promise.all([getProductForEdit(productId), getProductFormOptions()]);
  if (!product) notFound();

  return (
    <>
      <Link href="/admin/productos" className="text-sm text-muted hover:text-fg">
        ← Productos
      </Link>
      <AdminPageHeader
        title={product.name}
        actions={
          product.status === "active" && (
            <Link href={`/productos/${product.slug}`} target="_blank" className={buttonClasses({ variant: "outline", size: "sm" })}>
              <ExternalLink className="size-4" /> Ver en la tienda
            </Link>
          )
        }
      />
      <ProductForm
        {...options}
        created={Boolean(sp.creado)}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          brandId: product.brandId,
          categoryId: product.categoryId,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          stock: product.stock,
          status: product.status,
          featured: product.featured,
          universal: product.universal,
          shortDescription: product.shortDescription,
          description: product.description,
          specs: product.specs,
          fitments: product.fitments.map((f) => ({
            makeId: f.model.makeId,
            modelId: f.modelId,
            yearFrom: f.yearFrom,
            yearTo: f.yearTo,
            notes: f.notes,
          })),
          images: product.images.map((image) => ({ url: image.url, alt: image.alt })),
        }}
      />
      <Card title="Zona de peligro" className="mt-6 border-red-200">
        <form action={deleteProduct} className="flex flex-wrap items-center justify-between gap-4">
          <input type="hidden" name="id" value={product.id} />
          <p className="max-w-xl text-sm text-muted">
            Eliminar borra el producto y sus fotos. Los pedidos anteriores conservan su detalle. Si solo quieres
            ocultarlo, cambia su estado a «Archivado».
          </p>
          <SubmitButton variant="danger" pendingText="Eliminando…" confirm={`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`}>
            <Trash2 className="size-4" /> Eliminar producto
          </SubmitButton>
        </form>
      </Card>
    </>
  );
}
