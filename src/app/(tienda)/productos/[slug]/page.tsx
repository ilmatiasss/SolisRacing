import { CheckCircle2, ChevronRight, MessageCircle, Store, Truck, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { RichText } from "@/components/rich-text";
import { AddToCartPanel } from "@/components/store/cart/add-to-cart";
import { Price, StockStatus } from "@/components/store/price";
import { ProductGrid } from "@/components/store/product-card";
import { ProductGallery } from "@/components/store/product-gallery";
import { SectionHeading } from "@/components/store/section-heading";
import { Container } from "@/components/ui/container";
import { getProductBySlug, getRelatedProducts, type ProductDetail } from "@/lib/data/catalog";
import { getStoreSettings } from "@/lib/data/settings";
import { formatCLP, whatsappLink } from "@/lib/format";
import { siteUrl } from "@/lib/site";
import { truncate } from "@/lib/text";

type Props = PageProps<"/productos/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };
  const description = truncate(
    product.shortDescription ?? product.description ?? `${product.name} en Solis Racing Parts.`,
    160,
  );
  return {
    title: product.name,
    description,
    alternates: { canonical: `/productos/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      images: product.images[0] ? [{ url: product.images[0].url, alt: product.images[0].alt ?? product.name }] : undefined,
    },
  };
}

export default function ProductPage({ params }: Props) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductView params={params} />
    </Suspense>
  );
}

async function ProductView({ params }: { params: Props["params"] }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const [related, settings] = await Promise.all([
    getRelatedProducts(product.id, product.categoryId),
    getStoreSettings(),
  ]);
  const mainImage = product.images[0]?.url ?? null;
  const freeShipping = settings.shipping.freeShippingThreshold;

  return (
    <>
      <ProductJsonLd product={product} />
      <Container className="pt-6">
        <nav aria-label="Ruta de navegación" className="flex flex-wrap items-center gap-1 text-sm text-muted">
          <Link href="/" className="hover:text-fg">
            Inicio
          </Link>
          <ChevronRight className="size-3.5" />
          <Link href="/productos" className="hover:text-fg">
            Catálogo
          </Link>
          {product.category && (
            <>
              <ChevronRight className="size-3.5" />
              <Link href={`/productos?categoria=${product.category.slug}`} className="hover:text-fg">
                {product.category.name}
              </Link>
            </>
          )}
        </nav>
      </Container>

      <Container className="grid gap-10 py-8 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} name={product.name} icon={product.category?.icon ?? null} />

        <div>
          {product.brand && (
            <Link
              href={`/productos?marca=${product.brand.slug}`}
              className="text-sm font-bold tracking-widest text-brand-500 uppercase hover:text-brand-400"
            >
              {product.brand.name}
            </Link>
          )}
          <h1 className="mt-2 font-display text-4xl leading-none font-extrabold tracking-tight text-balance uppercase italic sm:text-5xl">
            {product.name}
          </h1>
          {product.sku && <p className="mt-3 text-sm text-muted">SKU: {product.sku}</p>}

          <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-y border-line py-5">
            <div>
              <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
              <p className="mt-1 text-xs text-muted">IVA incluido</p>
            </div>
            <StockStatus stock={product.stock} />
          </div>

          {product.shortDescription && <p className="mt-6 text-zinc-300">{product.shortDescription}</p>}

          <div className="mt-6">
            <AddToCartPanel
              product={{
                productId: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                imageUrl: mainImage,
                maxQuantity: product.stock,
              }}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-line bg-surface p-4">
            {product.universal ? (
              <p className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-emerald-400" />
                <span>
                  <strong className="font-semibold">Producto universal.</strong>{" "}
                  <span className="text-muted">Sirve para la mayoría de los autos; revisa las especificaciones.</span>
                </span>
              </p>
            ) : product.fitments.length > 0 ? (
              <p className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-emerald-400" />
                <span>
                  <strong className="font-semibold">
                    Compatible con {product.fitments.length}{" "}
                    {product.fitments.length === 1 ? "modelo" : "modelos"}.
                  </strong>{" "}
                  <a href="#compatibilidad" className="text-brand-400 hover:underline">
                    Ver compatibilidad
                  </a>
                </span>
              </p>
            ) : (
              <p className="flex items-start gap-3 text-sm text-muted">
                <MessageCircle className="mt-0.5 size-4.5 shrink-0 text-brand-500" />
                Consúltanos la compatibilidad con tu auto antes de comprar.
              </p>
            )}
            <a
              href={whatsappLink(
                settings.whatsapp,
                `Hola, quiero confirmar si "${product.name}"${product.sku ? ` (${product.sku})` : ""} le sirve a mi auto: `,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-3 text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              <WhatsAppIcon className="size-4.5" />
              ¿Dudas? Te ayudamos por WhatsApp
            </a>
          </div>

          <ul className="mt-6 space-y-3 text-sm text-zinc-300">
            {settings.shipping.shippingEnabled && (
              <li className="flex gap-3">
                <Truck className="size-5 shrink-0 text-brand-500" />
                <span>
                  Despacho a todo Chile.{" "}
                  {freeShipping > 0 && <>Gratis sobre {formatCLP(freeShipping)}. </>}
                  <span className="text-muted">{settings.shipping.shippingNote}</span>
                </span>
              </li>
            )}
            {settings.shipping.pickupEnabled && (
              <li className="flex gap-3">
                <Store className="size-5 shrink-0 text-brand-500" />
                <span>
                  Retiro gratis en tienda: <span className="text-muted">{settings.shipping.pickupAddress}</span>
                </span>
              </li>
            )}
            <li className="flex gap-3">
              <Wrench className="size-5 shrink-0 text-brand-500" />
              <span>
                ¿Necesitas instalación o seteo?{" "}
                <Link href="/servicios" className="text-brand-400 hover:underline">
                  Cotiza con nosotros
                </Link>
              </span>
            </li>
          </ul>
        </div>
      </Container>

      <Container className="grid gap-10 border-t border-line py-12 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="descripcion">
          <h2 id="descripcion" className="font-display text-2xl font-extrabold uppercase italic">
            Descripción
          </h2>
          <RichText
            text={product.description || product.shortDescription || "Sin descripción."}
            className="mt-4 text-zinc-300"
          />
        </section>
        {product.specs.length > 0 && (
          <section aria-labelledby="especificaciones">
            <h2 id="especificaciones" className="font-display text-2xl font-extrabold uppercase italic">
              Especificaciones
            </h2>
            <dl className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line">
              {product.specs.map((spec, index) => (
                <div key={index} className="grid grid-cols-2 gap-4 bg-surface px-4 py-3 text-sm">
                  <dt className="text-muted">{spec.label}</dt>
                  <dd className="font-medium">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </Container>

      {product.fitments.length > 0 && (
        <Container className="pb-12">
          <section id="compatibilidad" aria-labelledby="compatibilidad-titulo" className="scroll-mt-32">
            <h2 id="compatibilidad-titulo" className="font-display text-2xl font-extrabold uppercase italic">
              Compatibilidad
            </h2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="bg-surface-2 text-xs tracking-wider text-muted uppercase">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Marca</th>
                    <th className="px-4 py-3 font-semibold">Modelo</th>
                    <th className="px-4 py-3 font-semibold">Años</th>
                    <th className="px-4 py-3 font-semibold">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-surface">
                  {product.fitments.map((fitment) => (
                    <tr key={fitment.id}>
                      <td className="px-4 py-3">{fitment.model.make.name}</td>
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/productos?auto=${fitment.model.make.slug}&modelo=${fitment.model.slug}`}
                          className="hover:text-brand-400"
                        >
                          {fitment.model.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{formatYears(fitment.yearFrom, fitment.yearTo)}</td>
                      <td className="px-4 py-3 text-muted">{fitment.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted">
              La compatibilidad es referencial. Si tu auto tiene modificaciones o versiones especiales, consúltanos.
            </p>
          </section>
        </Container>
      )}

      {related.length > 0 && (
        <Container className="border-t border-line pt-12">
          <SectionHeading eyebrow="También te puede interesar" title="Productos relacionados" />
          <ProductGrid products={related} />
        </Container>
      )}
    </>
  );
}

function formatYears(from: number | null, to: number | null) {
  if (from && to) return from === to ? String(from) : `${from} – ${to}`;
  if (from) return `${from} en adelante`;
  if (to) return `Hasta ${to}`;
  return "Todos";
}

function ProductJsonLd({ product }: { product: ProductDetail }) {
  const url = `${siteUrl()}/productos/${product.slug}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? undefined,
    sku: product.sku ?? undefined,
    image: product.images.map((image) => (image.url.startsWith("http") ? image.url : `${siteUrl()}${image.url}`)),
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    category: product.category?.name,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "CLP",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

function ProductSkeleton() {
  return (
    <Container className="grid gap-10 py-14 lg:grid-cols-2 lg:gap-14">
      <div className="aspect-square animate-pulse rounded-3xl bg-surface" />
      <div className="space-y-4">
        <div className="h-4 w-24 animate-pulse rounded bg-surface" />
        <div className="h-12 w-3/4 animate-pulse rounded bg-surface" />
        <div className="h-10 w-40 animate-pulse rounded bg-surface" />
        <div className="h-24 animate-pulse rounded-2xl bg-surface" />
        <div className="h-13 animate-pulse rounded-xl bg-surface" />
      </div>
    </Container>
  );
}
