import { ArrowRight, Cable, Gauge, Headset, ShieldCheck, Star, Truck, Wrench } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { DynamicIcon, InstagramIcon, WhatsAppIcon } from "@/components/icons";
import { CatalogTabs } from "@/components/store/catalog-tabs";
import { HeroSpotlight } from "@/components/store/hero-spotlight";
import { Marquee } from "@/components/store/marquee";
import { DragTree, GlitchText, LightTrails, NeonFloor, NeonSign, ScannerLine } from "@/components/store/neon";
import { Price } from "@/components/store/price";
import { ProductGrid } from "@/components/store/product-card";
import { ProductImage } from "@/components/store/product-image";
import { InstagramGallery } from "@/components/store/instagram-gallery";
import { Rotator } from "@/components/store/rotator";
import { Eyebrow, SectionHeading } from "@/components/store/section-heading";
import { Tachometer } from "@/components/store/tachometer";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { REGIONS } from "@/lib/chile";
import { cn } from "@/lib/cn";
import {
  getActiveServices,
  getBrands,
  getCatalogPreview,
  getCategories,
  getFeaturedProducts,
  getOnSaleProducts,
  type ProductCardData,
} from "@/lib/data/catalog";
import { getStoreSettings } from "@/lib/data/settings";
import { formatCLP, whatsappLink } from "@/lib/format";
import { parseInstagramPosts } from "@/lib/instagram";

const PERKS = [
  "Despachos a todo Chile",
  "Tienda física en Antofagasta",
  "Paga con Webpay o transferencia",
  "Programación e instalación",
  "Asesoría experta",
];

export default async function HomePage() {
  const [categories, featured, onSale, catalog, services, brands, settings] = await Promise.all([
    getCategories(),
    getFeaturedProducts(8),
    getOnSaleProducts(4),
    getCatalogPreview(),
    getActiveServices(),
    getBrands(),
    getStoreSettings(),
  ]);
  const spotlight = (featured.length > 0 ? featured : catalog).slice(0, 8);
  const shelves = categories
    .map((category) => ({ category, products: catalog.filter((product) => product.categorySlug === category.slug) }))
    .filter((shelf) => shelf.products.length > 0);
  const freeShipping = settings.shipping.freeShippingThreshold;
  const instagramPosts = parseInstagramPosts(settings.instagramPosts);

  return (
    <>
      {/* Portada */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="bg-speedlines absolute inset-y-0 -right-[260px] left-0 animate-speedlines" />
        </div>
        <NeonFloor className="h-[32%] opacity-45 sm:h-[42%] sm:opacity-60" />
        <LightTrails />
        <HeroSpotlight />
        <div
          className="glow-hero-a absolute top-1/2 right-[-10%] size-[42rem] -translate-y-1/2 animate-glow"
          aria-hidden="true"
        />
        <div className="glow-hero-b absolute -top-48 left-[-15%] size-[30rem] animate-glow [animation-delay:-3s]" aria-hidden="true" />
        {/* Barras inclinadas de neón */}
        <div
          className="absolute inset-y-0 right-[8%] hidden w-40 -skew-x-[20deg] animate-neon-pulse border-l-2 border-red-500/70 bg-brand-600/10 shadow-[0_0_60px_rgba(255,0,0,0.3)] lg:block"
          aria-hidden="true"
        />
        <div
          className="absolute inset-y-0 right-[2%] hidden w-10 -skew-x-[20deg] animate-neon-pulse bg-brand-600/35 shadow-[0_0_44px_rgba(255,20,20,0.6)] [animation-delay:-1.5s] lg:block"
          aria-hidden="true"
        />

        <Container className="relative grid items-center gap-x-12 gap-y-8 py-10 [grid-template-areas:'text'_'show'_'stats'] sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20 lg:[grid-template-areas:'text_show'_'stats_show']">
          <div className="[grid-area:text]">
            <Eyebrow className="animate-rise tracking-[0.06em] sm:tracking-[0.2em]">Performance · Electrónica · Programación</Eyebrow>
            <div className="mt-5 flex items-center justify-between gap-6 sm:justify-start sm:gap-10">
              <h1 className="font-display text-[2.6rem] leading-[0.92] font-extrabold tracking-normal uppercase italic min-[420px]:text-5xl sm:text-6xl lg:text-7xl">
                <span className="block animate-rise [animation-delay:100ms]">
                  <GlitchText>Más potencia.</GlitchText>
                </span>
                <span className="block animate-rise [animation-delay:220ms]">
                  <NeonSign className="pr-3">Más control.</NeonSign>
                </span>
              </h1>
              <DragTree className="shrink-0 animate-rise [animation-delay:300ms]" />
            </div>
            <p className="mt-6 max-w-xl animate-rise text-base text-zinc-300 [animation-delay:340ms] sm:text-lg">
              FuelTech, sistemas de combustible, sensores, fittings, relojería y lubricantes Red Line y VP para tu
              proyecto. Tienda física en Antofagasta, despachos a todo Chile y asesoría para elegir bien cada pieza.
            </p>
            <div className="mt-8 flex animate-rise flex-col gap-3 [animation-delay:460ms] sm:flex-row sm:flex-wrap">
              <span className="relative flex">
                <span aria-hidden="true" className="neon-cta-glow absolute inset-0 rounded-lg" />
                <span aria-hidden="true" className="neon-cta-glow neon-cta-glow--peak absolute inset-0 rounded-lg" />
                <Link
                  href={catalog.length > 0 ? "#catalogo" : "/productos"}
                  className={buttonClasses({ size: "lg", className: "neon-cta group w-full" })}
                >
                  Ver catálogo
                  <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </span>
              {/* En el celular van lado a lado, a mitad de ancho cada uno. */}
              <div className="grid grid-cols-2 gap-3 sm:flex">
                {[
                  { href: "/servicios", icon: Gauge, label: "Programación" },
                  { href: "/cotizador-ramal", icon: Cable, label: "Ramal a medida" },
                ].map(({ href, icon: Icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={buttonClasses({
                      size: "lg",
                      variant: "outline",
                      className:
                        "gap-2 px-3 text-sm whitespace-nowrap hover:border-brand-500 hover:shadow-[0_0_24px_rgba(255,30,30,0.45)] sm:gap-2.5 sm:px-6 sm:text-base",
                    })}
                  >
                    <Icon className="size-5 shrink-0" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <dl className="grid max-w-lg animate-rise grid-cols-3 gap-6 self-start border-t border-white/10 pt-6 [grid-area:stats] [animation-delay:580ms]">
            <Stat value={catalog.length} label="Productos" />
            <Stat value={brands.length} label="Marcas" />
            <Stat value={REGIONS.length} label="Regiones con despacho" />
          </dl>

          {spotlight.length > 0 && (
            <div className="relative animate-rise [grid-area:show] [animation-delay:260ms]">
              <Tachometer animated className="pointer-events-none absolute -top-24 -right-16 hidden w-[26rem] opacity-60 lg:block" />
              <div className="neon-beam relative rounded-3xl border border-white/10 bg-zinc-950/90 p-5 shadow-2xl shadow-black/50 sm:p-7">
                <span aria-hidden="true" className="neon-beam__ring" />
                <div className="mb-5 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2.5 font-display text-sm font-bold tracking-[0.2em] text-brand-500 uppercase">
                    <span className="relative flex size-2.5" aria-hidden="true">
                      <span className="absolute inline-flex size-full animate-ping-slow rounded-full bg-brand-500" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-brand-500" />
                    </span>
                    Lo más buscado
                  </p>
                  <Link href="/productos" className="text-sm font-semibold text-zinc-300 hover:text-white">
                    Ver todo
                  </Link>
                </div>
                <Rotator
                  label="Productos destacados"
                  slides={spotlight.map((product, index) => ({
                    id: String(product.id),
                    label: product.name,
                    content: <SpotlightSlide product={product} eager={index === 0} />,
                  }))}
                />
                {freeShipping > 0 && (
                  <p className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-sm text-zinc-300">
                    <Truck className="size-4 text-brand-500" />
                    Despacho gratis en compras sobre {formatCLP(freeShipping)}
                  </p>
                )}
                <span aria-hidden="true" className="neon-halo absolute inset-0 animate-neon-pulse rounded-[inherit]" />
              </div>
            </div>
          )}
        </Container>
        <ScannerLine className="bottom-0" />
      </section>

      {/* Bandas en movimiento */}
      <section aria-label="Lo que ofrecemos" className="cv-auto relative h-40 overflow-hidden sm:h-48">
        {shelves.length > 0 && (
          <div className="absolute top-[30%] -left-[5%] w-[110%] -translate-y-1/2 rotate-[2.5deg] bg-zinc-100 py-2.5 text-zinc-950 shadow-xl shadow-black/40 sm:top-1/2 sm:py-3">
            <Marquee reverse repeat={3}>
              {shelves.map(({ category }) => (
                <span
                  key={category.slug}
                  className="flex items-center gap-3 px-6 font-display text-xl font-extrabold tracking-wide uppercase italic sm:text-2xl"
                >
                  <DynamicIcon name={category.icon} className="size-5 text-brand-600" />
                  {category.name}
                </span>
              ))}
            </Marquee>
          </div>
        )}
        <div
          className={cn(
            "absolute -left-[5%] w-[110%] -translate-y-1/2 -rotate-[2.5deg] border-y border-red-300/40 bg-brand-600 py-3 text-white shadow-[0_0_50px_rgba(255,20,20,0.55)] [text-shadow:0_0_14px_rgba(255,255,255,0.5)] sm:top-1/2 sm:py-4",
            shelves.length > 0 ? "top-[70%]" : "top-1/2",
          )}
        >
          <Marquee repeat={3}>
            {PERKS.map((perk) => (
              <span
                key={perk}
                className="flex items-center gap-6 px-6 font-display text-2xl font-extrabold tracking-wide uppercase italic sm:text-3xl"
              >
                {perk}
                <span aria-hidden="true" className="font-display text-2xl opacity-60">/</span>
              </span>
            ))}
          </Marquee>
        </div>
      </section>

      {/* Catálogo por categoría */}
      {catalog.length > 0 && (
        <section id="catalogo" className="cv-auto scroll-mt-32 pt-10 pb-16 sm:pb-20">
          <Container className="reveal">
            <SectionHeading
              eyebrow="Catálogo"
              title="Lo que tenemos en la tienda"
              description={`${catalog.length} productos en ${shelves.length} categorías, para despacho o retiro en Antofagasta. Si no está acá, lo buscamos.`}
              action={{ href: "/productos", label: "Ver catálogo completo" }}
            />
            <CatalogTabs
              label="Categorías del catálogo"
              products={catalog}
              tabs={[
                {
                  id: "destacados",
                  label: (
                    <>
                      <Star className="size-4" aria-hidden="true" />
                      Destacados
                    </>
                  ),
                  productIds: spotlight.map((product) => product.id),
                  href: "/productos",
                  linkLabel: "Ver todo el catálogo",
                },
                ...shelves.map(({ category, products }) => ({
                  id: category.slug,
                  label: (
                    <>
                      <DynamicIcon name={category.icon} className="size-4" />
                      {category.name}
                      <span className="text-xs opacity-60">{products.length}</span>
                    </>
                  ),
                  productIds: products.slice(0, 8).map((product) => product.id),
                  href: `/productos?categoria=${category.slug}`,
                  linkLabel: products.length > 8 ? `Ver los ${products.length} de ${category.name}` : `Ver ${category.name}`,
                })),
              ]}
            />
          </Container>
        </section>
      )}

      {/* Pedido especial */}
      <Container className="cv-auto reveal pb-16">
        <div className="flex flex-col gap-6 rounded-lg border border-line border-l-4 border-l-brand-600 bg-surface p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-wide uppercase sm:text-3xl">¿No encuentras tu repuesto?</h2>
            <p className="mt-1 max-w-xl text-muted">Cuéntanos qué buscas y para qué auto. Lo conseguimos y te mandamos precio y plazo.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link href="/pedido-especial" className={buttonClasses({ size: "lg", className: "group" })}>
              Pedir un repuesto
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href={whatsappLink(settings.whatsapp, "Hola, busco un repuesto que no está en la web.")}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: "outline", size: "lg" })}
            >
              <WhatsAppIcon className="size-5" />
              WhatsApp
            </a>
          </div>
        </div>
      </Container>

      {/* Servicios */}
      {services.length > 0 && (
        <section className="cv-auto border-y border-line bg-surface">
          <Container className="reveal py-16 sm:py-20">
            <SectionHeading
              eyebrow="Taller"
              title="Programación e instalaciones"
              description="Instalamos y programamos tu FuelTech, armamos el arnés de tu motor y dejamos el combustible listo para la potencia que buscas."
              action={{ href: "/servicios", label: "Ver todos los servicios" }}
            />
            <Link
              href="/cotizador-ramal"
              className="group mb-8 flex items-center justify-between gap-4 rounded-lg border border-dashed border-zinc-600 px-5 py-4 transition-colors hover:border-brand-500"
            >
              <span>
                <span className="block font-semibold">¿Necesitas un ramal a medida para tu FuelTech?</span>
                <span className="text-sm text-muted">Cotízalo en línea y ve el valor aproximado al tiro.</span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-brand-500 transition-transform group-hover:translate-x-1" />
            </Link>
            <ol className="grid gap-x-10 gap-y-8 md:grid-cols-3">
              {services.slice(0, 3).map((service, index) => (
                <li key={service.slug} className="border-t-2 border-zinc-700 pt-5">
                  <Link href={`/servicios#${service.slug}`} className="group block">
                    <span className="font-display text-5xl leading-none font-bold text-zinc-700 transition-colors group-hover:text-brand-600">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-3 font-display text-2xl font-bold tracking-wide uppercase">{service.name}</h3>
                    <p className="mt-2 text-sm text-muted">{service.summary}</p>
                    <p className="mt-4 flex items-center justify-between text-sm">
                      <span className="font-semibold text-fg">
                        {service.priceFrom ? `Desde ${formatCLP(service.priceFrom)}` : "Cotiza sin costo"}
                      </span>
                      <ArrowRight className="size-4 text-brand-500 transition-transform group-hover:translate-x-1" />
                    </p>
                  </Link>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      )}

      {/* Quiénes somos (videos de Instagram cargados en el panel) */}
      {instagramPosts.length > 0 && (
        <Container className="cv-auto reveal pt-16 sm:pt-20">
          <SectionHeading
            eyebrow="Quiénes somos"
            title="Así trabajamos"
            description="La tienda, el taller y los proyectos del día a día, tal como los subimos a Instagram."
            action={{ href: "/nosotros", label: "Conócenos" }}
          />
          <InstagramGallery posts={instagramPosts.slice(0, 3)} />
        </Container>
      )}

      {/* Ofertas */}
      {onSale.length > 0 && (
        <Container className="cv-auto reveal py-16 sm:py-20">
          <SectionHeading
            eyebrow="Ofertas"
            title="Precios en boxes"
            description="Descuentos por tiempo limitado o hasta agotar stock."
            action={{ href: "/productos?oferta=1", label: "Ver todas las ofertas" }}
          />
          <ProductGrid products={onSale} />
        </Container>
      )}

      {/* Beneficios */}
      <Container className={onSale.length > 0 ? "cv-auto reveal pb-4" : "cv-auto reveal py-16 sm:py-20"}>
        <ul className="grid gap-8 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Truck, title: "Despacho a todo Chile", text: "Por courier hasta tu puerta, o retiras en la tienda de Antofagasta." },
            { icon: ShieldCheck, title: "Pagas tranquilo", text: "Webpay con débito, crédito o prepago, o transferencia." },
            { icon: Headset, title: "Te ayudamos a elegir", text: "Cuéntanos tu auto y te decimos qué pieza necesitas." },
            { icon: Wrench, title: "Instalación y programación", text: "Si quieres, lo instalamos y lo dejamos programado nosotros." },
          ].map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <Icon className="mt-0.5 size-6 shrink-0 text-brand-500" strokeWidth={1.6} />
              <div>
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>

      {/* Instagram */}
      {settings.instagram && (
        <Container className="cv-auto reveal pt-16">
          <div className="flex flex-col gap-6 rounded-lg border border-line bg-surface p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div className="flex items-center gap-5">
              <InstagramIcon className="size-9 shrink-0 text-zinc-300" />
              <div>
                <h2 className="font-display text-3xl font-bold tracking-wide uppercase">Mira lo que estamos haciendo</h2>
                <p className="mt-1 text-muted">Trabajos, instalaciones, productos nuevos y ofertas, todo en nuestro Instagram.</p>
              </div>
            </div>
            <a
              href={settings.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: "light", size: "lg" })}
            >
              <InstagramIcon className="size-5" />@{instagramHandle(settings.instagram)}
            </a>
          </div>
        </Container>
      )}

      {/* Marcas */}
      {brands.length > 0 && (
        <section aria-labelledby="marcas-titulo" className="cv-auto pt-16">
          <p id="marcas-titulo" className="text-center text-xs font-semibold tracking-[0.25em] text-muted uppercase">
            Marcas que trabajamos
          </p>
          <Marquee
            repeat={4}
            className="mt-6 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
          >
            {brands.map((brand) => (
              <Link
                key={brand.slug}
                href={`/productos?marca=${brand.slug}`}
                className="px-8 font-display text-3xl font-bold tracking-wide whitespace-nowrap text-zinc-600 uppercase transition-colors hover:text-fg"
              >
                {brand.name}
              </Link>
            ))}
          </Marquee>
        </section>
      )}
    </>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted uppercase">{label}</dt>
      <dd className="mt-1 font-display text-3xl font-bold italic [text-shadow:0_0_18px_rgba(255,40,40,0.75)]">
        <span className="sr-only">{value}</span>
        <span aria-hidden="true" className="count-up tabular-nums" style={{ "--to": value } as CSSProperties} />
      </dd>
    </div>
  );
}

function SpotlightSlide({ product, eager }: { product: ProductCardData; eager: boolean }) {
  return (
    <Link
      href={`/productos/${product.slug}`}
      className="group/slide grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-center gap-4 sm:gap-6"
    >
      <div className="relative">
        {/* Equivale al círculo desenfocado de antes (inset-4 con blur de 40px), sin filtro. */}
        <div className="glow-slide absolute -inset-[104px]" aria-hidden="true" />
        <ProductImage
          src={product.imageUrl}
          alt={product.imageAlt ?? product.name}
          icon={product.categoryIcon}
          sizes="(min-width: 1024px) 240px, 40vw"
          eager={eager}
          className="relative aspect-square animate-float rounded-2xl border border-white/10 shadow-2xl shadow-black/60"
        />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-wider text-brand-500 uppercase">
          {product.brandName ?? product.categoryName}
        </p>
        <h2 className="mt-1 line-clamp-3 font-display text-2xl leading-tight font-extrabold uppercase italic sm:text-3xl">
          {product.name}
        </h2>
        <div className="mt-3">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} />
        </div>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-200 transition-colors group-hover/slide:text-white">
          Ver producto
          <ArrowRight className="size-4 text-brand-500 transition-transform group-hover/slide:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

function instagramHandle(url: string) {
  try {
    return new URL(url).pathname.split("/").filter(Boolean)[0] ?? "instagram";
  } catch {
    return "instagram";
  }
}
