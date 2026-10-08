import { Car, ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DynamicIcon, WhatsAppIcon } from "@/components/icons";
import { ProductGrid } from "@/components/store/product-card";
import { PageHeader } from "@/components/store/section-heading";
import { SortSelect } from "@/components/store/sort-select";
import { VehicleFinder } from "@/components/store/vehicle-finder";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { catalogHref, parseCatalogFilters, type CatalogFilters } from "@/lib/catalog-filters";
import { cn } from "@/lib/cn";
import {
  getBrands,
  getCategories,
  getVehicleTree,
  searchProducts,
  type CategoryData,
} from "@/lib/data/catalog";
import { getStoreSettings } from "@/lib/data/settings";
import { getCurrentYear } from "@/lib/data/time";
import { whatsappLink } from "@/lib/format";

export const metadata: Metadata = {
  title: "Catálogo de repuestos y accesorios",
  description:
    "FuelTech y electrónica, sistemas de combustible, sensores, fittings, relojería y más. Busca por marca, modelo y año de tu auto.",
  alternates: { canonical: "/productos" },
};

export default function ProductsPage({ searchParams }: PageProps<"/productos">) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <Catalog searchParams={searchParams} />
    </Suspense>
  );
}

async function Catalog({ searchParams }: { searchParams: PageProps<"/productos">["searchParams"] }) {
  const filters = parseCatalogFilters(await searchParams);
  const [result, categories, brands, makes, currentYear, settings] = await Promise.all([
    searchProducts(filters),
    getCategories(),
    getBrands(),
    getVehicleTree(),
    getCurrentYear(),
    getStoreSettings(),
  ]);

  const category = categories.find((c) => c.slug === filters.categoria);
  const brand = brands.find((b) => b.slug === filters.marca);
  const vehicleLabel = result.vehicle
    ? [result.vehicle.make, result.vehicle.model, result.vehicle.year].filter(Boolean).join(" ")
    : null;

  let title = "Catálogo";
  if (filters.q) title = `Resultados para “${filters.q}”`;
  else if (vehicleLabel) title = `Repuestos para ${vehicleLabel}`;
  else if (category) title = category.name;
  else if (brand) title = brand.name;
  else if (filters.oferta) title = "Ofertas";

  const chips: { label: string; href: string }[] = [];
  if (filters.q) chips.push({ label: `Búsqueda: ${filters.q}`, href: catalogHref({ ...filters, q: undefined, pagina: 1 }) });
  if (category) chips.push({ label: category.name, href: catalogHref({ ...filters, categoria: undefined, pagina: 1 }) });
  if (brand) chips.push({ label: `Marca: ${brand.name}`, href: catalogHref({ ...filters, marca: undefined, pagina: 1 }) });
  if (vehicleLabel)
    chips.push({
      label: `Auto: ${vehicleLabel}`,
      href: catalogHref({ ...filters, auto: undefined, modelo: undefined, anio: undefined, pagina: 1 }),
    });
  if (filters.oferta) chips.push({ label: "En oferta", href: catalogHref({ ...filters, oferta: undefined, pagina: 1 }) });
  if (filters.stock) chips.push({ label: "Con stock", href: catalogHref({ ...filters, stock: undefined, pagina: 1 }) });

  return (
    <>
      <PageHeader
        eyebrow={category ? "Categoría" : vehicleLabel ? "Compatibles con tu auto" : "Tienda"}
        title={title}
        description={
          category?.description ??
          (vehicleLabel
            ? "Mostramos primero las piezas específicas para tu auto y luego las universales."
            : "Repuestos y accesorios de performance con despacho a todo Chile.")
        }
      >
        <div className="mt-8 max-w-4xl rounded-2xl border border-white/10 bg-zinc-950/70 p-4 backdrop-blur">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Car className="size-4 text-brand-500" />
            {vehicleLabel ? "Cambiar auto" : "Filtra por tu auto"}
          </p>
          <VehicleFinder
            key={`${filters.auto}-${filters.modelo}-${filters.anio}`}
            makes={makes}
            currentYear={currentYear}
            initial={filters}
          />
        </div>
      </PageHeader>

      <Container className="grid gap-8 py-10 lg:grid-cols-[16rem_1fr]">
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <details className="group rounded-2xl border border-line bg-surface lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-semibold">
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="size-4" /> Filtros
              </span>
              <span className="text-sm text-muted group-open:hidden">Mostrar</span>
              <span className="hidden text-sm text-muted group-open:inline">Ocultar</span>
            </summary>
            <div className="border-t border-line p-4">
              <Filters categories={categories} brands={brands} filters={filters} />
            </div>
          </details>
          <div className="hidden lg:block">
            <Filters categories={categories} brands={brands} filters={filters} />
          </div>
        </aside>

        <section aria-label="Resultados">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {result.total === 0
                ? "Sin resultados"
                : `${result.total} ${result.total === 1 ? "producto" : "productos"}`}
            </p>
            <SortSelect filters={filters} />
          </div>

          {chips.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium hover:border-brand-600"
                >
                  {chip.label}
                  <X className="size-3.5 text-muted" />
                  <span className="sr-only">Quitar filtro</span>
                </Link>
              ))}
              <Link href="/productos" className="px-2 text-xs font-semibold text-brand-400 hover:underline">
                Limpiar todo
              </Link>
            </div>
          )}

          {result.products.length > 0 ? (
            <>
              <ProductGrid products={result.products} />
              <Pagination filters={filters} page={result.page} pageCount={result.pageCount} />
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-10 text-center">
              <p className="font-display text-2xl font-bold uppercase italic">No encontramos productos</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                Prueba con otros filtros o escríbenos: conseguimos repuestos de performance a pedido para tu auto.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/productos" className={buttonClasses({ variant: "outline" })}>
                  Ver todo el catálogo
                </Link>
                <a
                  href={whatsappLink(
                    settings.whatsapp,
                    `Hola, busco un repuesto${vehicleLabel ? ` para ${vehicleLabel}` : ""}${filters.q ? `: ${filters.q}` : ""}.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses()}
                >
                  <WhatsAppIcon className="size-4.5" />
                  Cotizar por WhatsApp
                </a>
              </div>
            </div>
          )}
        </section>
      </Container>
    </>
  );
}

function Filters({
  categories,
  brands,
  filters,
}: {
  categories: CategoryData[];
  brands: { name: string; slug: string }[];
  filters: CatalogFilters;
}) {
  return (
    <div className="space-y-8">
      <CategoryFilter categories={categories} filters={filters} />
      {brands.length > 0 && (
        <FilterGroup title="Marca">
          <FilterLink href={catalogHref({ ...filters, marca: undefined, pagina: 1 })} active={!filters.marca}>
            Todas las marcas
          </FilterLink>
          {brands.map((b) => (
            <FilterLink
              key={b.slug}
              href={catalogHref({ ...filters, marca: b.slug, pagina: 1 })}
              active={filters.marca === b.slug}
            >
              {b.name}
            </FilterLink>
          ))}
        </FilterGroup>
      )}
      <FilterGroup title="Disponibilidad">
        <ToggleLink
          href={catalogHref({ ...filters, oferta: filters.oferta ? undefined : true, pagina: 1 })}
          active={!!filters.oferta}
        >
          Solo ofertas
        </ToggleLink>
        <ToggleLink
          href={catalogHref({ ...filters, stock: filters.stock ? undefined : true, pagina: 1 })}
          active={!!filters.stock}
        >
          Solo con stock
        </ToggleLink>
      </FilterGroup>
    </div>
  );
}

function CategoryFilter({ categories, filters }: { categories: CategoryData[]; filters: CatalogFilters }) {
  return (
    <FilterGroup title="Categoría">
      <FilterLink href={catalogHref({ ...filters, categoria: undefined, pagina: 1 })} active={!filters.categoria}>
        Todas las categorías
      </FilterLink>
      {categories.map((c) => (
        <FilterLink
          key={c.slug}
          href={catalogHref({ ...filters, categoria: c.slug, pagina: 1 })}
          active={filters.categoria === c.slug}
        >
          <DynamicIcon name={c.icon} className="size-4 shrink-0 text-brand-500" />
          <span className="flex-1">{c.name}</span>
          <span className="text-xs text-muted tabular-nums">{c.productCount}</span>
        </FilterLink>
      ))}
    </FilterGroup>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-xs font-bold tracking-widest text-muted uppercase">{title}</h2>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
        active ? "bg-brand-600/12 font-semibold text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white",
      )}
    >
      {children}
    </Link>
  );
}

function ToggleLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      role="switch"
      aria-checked={active}
      className="flex items-center justify-between rounded-lg px-2.5 py-2 text-sm text-zinc-300 hover:bg-white/5"
    >
      {children}
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          active ? "bg-brand-600" : "bg-zinc-700",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white transition-all",
            active ? "left-[1.125rem]" : "left-0.5",
          )}
        />
      </span>
    </Link>
  );
}

function Pagination({ filters, page, pageCount }: { filters: CatalogFilters; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1,
  );
  return (
    <nav aria-label="Paginación" className="mt-10 flex items-center justify-center gap-1.5">
      {page > 1 && (
        <Link
          href={catalogHref({ ...filters, pagina: page - 1 })}
          className={buttonClasses({ variant: "outline", size: "icon" })}
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" />
        </Link>
      )}
      {pages.map((p, index) => (
        <span key={p} className="flex items-center gap-1.5">
          {index > 0 && p - pages[index - 1] > 1 && <span className="px-1 text-muted">…</span>}
          <Link
            href={catalogHref({ ...filters, pagina: p })}
            aria-current={p === page ? "page" : undefined}
            className={buttonClasses({ variant: p === page ? "primary" : "outline", size: "icon" })}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < pageCount && (
        <Link
          href={catalogHref({ ...filters, pagina: page + 1 })}
          className={buttonClasses({ variant: "outline", size: "icon" })}
          aria-label="Página siguiente"
        >
          <ChevronRight className="size-4" />
        </Link>
      )}
    </nav>
  );
}

function CatalogSkeleton() {
  return (
    <>
      <PageHeader eyebrow="Tienda" title="Catálogo" description="Cargando productos…" />
      <Container className="grid gap-8 py-10 lg:grid-cols-[16rem_1fr]">
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-8 animate-pulse rounded-lg bg-surface" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      </Container>
    </>
  );
}
