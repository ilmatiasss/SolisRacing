import { Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdminPagination, pageParam, stringParam } from "@/components/admin/pagination";
import { AdminPageHeader, Card, EmptyState, Notice, Table, Td, Th } from "@/components/admin/ui";
import { DynamicIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { requireAdmin } from "@/lib/auth";
import { getProductFormOptions, listProductsAdmin } from "@/lib/data/admin";
import type { ProductStatus } from "@/lib/db/schema";
import { formatCLP } from "@/lib/format";

export const metadata: Metadata = { title: "Productos" };

// Página del panel: siempre se consulta la base de datos al momento (no se prerenderiza).
export const instant = false;

const STATUS_LABELS: Record<ProductStatus, { label: string; tone: "success" | "neutral" | "warning" }> = {
  active: { label: "Activo", tone: "success" },
  draft: { label: "Borrador", tone: "warning" },
  archived: { label: "Archivado", tone: "neutral" },
};

export default async function ProductsAdminPage({ searchParams }: PageProps<"/admin/productos">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = stringParam(sp.q);
  const statusParam = stringParam(sp.estado);
  const status = statusParam && statusParam in STATUS_LABELS ? (statusParam as ProductStatus) : undefined;
  const categoryId = Number(stringParam(sp.categoria)) || undefined;
  const page = pageParam(sp.pagina);
  const [{ rows, total, pageCount }, { categories }] = await Promise.all([
    listProductsAdmin({ q, status, categoryId, page }),
    getProductFormOptions(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Productos"
        description={`${total} ${total === 1 ? "producto" : "productos"}`}
        actions={
          <Link href="/admin/productos/nuevo" className={buttonClasses({ size: "sm" })}>
            <Plus className="size-4" /> Nuevo producto
          </Link>
        }
      />
      {sp.eliminado && <Notice tone="success" className="mb-4">Producto eliminado.</Notice>}
      <Card bodyClassName="p-0">
        <form className="flex flex-wrap gap-2 border-b border-line p-4" action="/admin/productos">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <Input name="q" defaultValue={q} placeholder="Buscar por nombre, SKU, marca o auto…" className="h-10 pl-9" />
          </div>
          <Select name="estado" defaultValue={status ?? ""} className="h-10 w-auto" aria-label="Estado">
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="draft">Borradores</option>
            <option value="archived">Archivados</option>
          </Select>
          <Select name="categoria" defaultValue={categoryId ?? ""} className="h-10 w-auto" aria-label="Categoría">
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="outline" size="sm" className="h-10">
            Filtrar
          </Button>
        </form>
        {rows.length === 0 ? (
          <EmptyState
            title={q || status || categoryId ? "No hay productos con esos filtros" : "Aún no hay productos"}
            action={
              <Link href="/admin/productos/nuevo" className={buttonClasses({ size: "sm" })}>
                <Plus className="size-4" /> Crear el primero
              </Link>
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Producto</Th>
                <Th>Categoría</Th>
                <Th className="text-right">Precio</Th>
                <Th className="text-right">Stock</Th>
                <Th>Estado</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((product) => (
                <tr key={product.id} className="hover:bg-surface-2">
                  <Td>
                    <Link href={`/admin/productos/${product.id}`} className="flex items-center gap-3">
                      <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-white">
                        {product.imageUrl ? (
                          <Image src={product.imageUrl} alt="" fill sizes="44px" className="object-contain p-0.5" />
                        ) : (
                          <DynamicIcon name={product.categoryIcon} className="size-5 text-zinc-400" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium hover:text-brand-600">{product.name}</span>
                        <span className="block text-xs text-muted">
                          {[product.brandName, product.sku].filter(Boolean).join(" · ") || "—"}
                          {product.featured && " · ★ Destacado"}
                        </span>
                      </span>
                    </Link>
                  </Td>
                  <Td className="text-muted">{product.categoryName ?? "—"}</Td>
                  <Td className="text-right tabular-nums">
                    {formatCLP(product.price)}
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="block text-xs text-muted line-through">{formatCLP(product.compareAtPrice)}</span>
                    )}
                  </Td>
                  <Td className="text-right">
                    <span className={product.stock === 0 ? "font-semibold text-red-600" : product.stock <= 3 ? "font-semibold text-amber-600" : ""}>
                      {product.stock}
                    </span>
                  </Td>
                  <Td>
                    <Badge tone={STATUS_LABELS[product.status].tone}>{STATUS_LABELS[product.status].label}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <AdminPagination
          basePath="/admin/productos"
          params={{ q, estado: status, categoria: categoryId ? String(categoryId) : undefined }}
          page={page}
          pageCount={pageCount}
        />
      </Card>
    </>
  );
}
