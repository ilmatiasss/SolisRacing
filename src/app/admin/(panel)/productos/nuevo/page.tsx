import type { Metadata } from "next";
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { getProductFormOptions } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Nuevo producto" };

// Página del panel: siempre se consulta la base de datos al momento (no se prerenderiza).
export const instant = false;

export default async function NewProductPage() {
  await requireAdmin();
  const options = await getProductFormOptions();
  return (
    <>
      <Link href="/admin/productos" className="text-sm text-muted hover:text-fg">
        ← Productos
      </Link>
      <AdminPageHeader title="Nuevo producto" />
      <ProductForm
        {...options}
        initial={{
          name: "",
          slug: "",
          sku: null,
          brandId: null,
          categoryId: null,
          price: null,
          compareAtPrice: null,
          stock: 0,
          status: "active",
          featured: false,
          universal: false,
          shortDescription: null,
          description: null,
          specs: [],
          fitments: [],
          images: [],
        }}
      />
    </>
  );
}
