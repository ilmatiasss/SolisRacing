import { ArrowRight, Gauge, Headset, ShieldCheck, Truck, Wrench } from "lucide-react";
import Link from "next/link";
import { DynamicIcon } from "@/components/icons";
import { ProductGrid } from "@/components/store/product-card";
import { Eyebrow, SectionHeading } from "@/components/store/section-heading";
import { Tachometer } from "@/components/store/tachometer";
import { VehicleFinder } from "@/components/store/vehicle-finder";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  getBrands,
  getCategories,
  getFeaturedProducts,
  getLatestProducts,
  getOnSaleProducts,
  getActiveServices,
  getVehicleTree,
} from "@/lib/data/catalog";
import { getStoreSettings } from "@/lib/data/settings";
import { getCurrentYear } from "@/lib/data/time";
import { formatCLP } from "@/lib/format";

export default async function HomePage() {
  const [categories, featured, onSale, latest, services, brands, makes, currentYear, settings] =
    await Promise.all([
      getCategories(),
      getFeaturedProducts(8),
      getOnSaleProducts(4),
      getLatestProducts(8),
      getActiveServices(),
      getBrands(),
      getVehicleTree(),
      getCurrentYear(),
      getStoreSettings(),
    ]);
  const highlighted = featured.length > 0 ? featured : latest;
  const freeShipping = settings.shipping.freeShippingThreshold;

  return (
    <>
      {/* Portada */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="bg-speedlines absolute inset-0" aria-hidden="true" />
        <div
          className="absolute top-1/2 right-[-10%] size-[42rem] -translate-y-1/2 rounded-full bg-brand-600/20 blur-[120px]"
          aria-hidden="true"
        />
        <div className="absolute inset-y-0 right-[8%] hidden w-40 -skew-x-[20deg] bg-brand-600/10 lg:block" aria-hidden="true" />
        <div className="absolute inset-y-0 right-[2%] hidden w-10 -skew-x-[20deg] bg-brand-600/20 lg:block" aria-hidden="true" />
        <Container className="relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <Eyebrow>Performance · Tuning · Seteos</Eyebrow>
            <h1 className="mt-5 font-display text-5xl leading-[0.92] font-extrabold tracking-tight uppercase italic sm:text-6xl lg:text-7xl">
              Más potencia.
              <br />
              <span className="text-brand-600">Mejor manejo.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-zinc-300">
              Partes y accesorios de performance para tu auto, con despacho a todo Chile. Y cuando quieras llevarlo
              al siguiente nivel, lo seteamos en nuestro taller.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/productos" className={buttonClasses({ size: "lg" })}>
                Ver catálogo
                <ArrowRight className="size-5" />
              </Link>
              <Link href="/servicios" className={buttonClasses({ size: "lg", variant: "outline" })}>
                <Gauge className="size-5" />
                Agendar un seteo
              </Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6">
              <div>
                <dt className="text-xs tracking-wide text-muted uppercase">Despachos</dt>
                <dd className="mt-1 font-display text-xl font-bold italic">Todo Chile</dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-muted uppercase">Pago seguro</dt>
                <dd className="mt-1 font-display text-xl font-bold italic">Webpay</dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-muted uppercase">Taller</dt>
                <dd className="mt-1 font-display text-xl font-bold italic">Dinamómetro</dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <Tachometer className="pointer-events-none absolute -top-24 -right-16 hidden w-[26rem] opacity-40 lg:block" />
            <div className="relative rounded-3xl border border-white/10 bg-zinc-950/80 p-6 shadow-2xl shadow-black/50 backdrop-blur sm:p-8">
              <p className="font-display text-sm font-bold tracking-[0.2em] text-brand-500 uppercase">Busca por tu auto</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold uppercase italic">
                Encuentra repuestos compatibles
              </h2>
              <p className="mt-2 text-sm text-muted">
                Elige marca, modelo y año para ver solo las piezas que le quedan a tu auto.
              </p>
              <VehicleFinder makes={makes} currentYear={currentYear} compact className="mt-6" />
              {freeShipping > 0 && (
                <p className="mt-5 flex items-center gap-2 text-sm text-zinc-300">
                  <Truck className="size-4 text-brand-500" />
                  Despacho gratis en compras sobre {formatCLP(freeShipping)}
                </p>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Categorías */}
      {categories.length > 0 && (
        <Container className="py-16 sm:py-20">
          <SectionHeading
            eyebrow="Categorías"
            title="Todo para tu proyecto"
            action={{ href: "/productos", label: "Ver todo el catálogo" }}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/productos?categoria=${category.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-brand-600/60"
              >
                <div className="absolute -top-10 -right-10 size-24 rounded-full bg-brand-600/0 blur-2xl transition-colors group-hover:bg-brand-600/25" />
                <DynamicIcon
                  name={category.icon}
                  className="size-8 text-brand-500 transition-transform group-hover:-translate-y-0.5"
                  strokeWidth={1.5}
                />
                <p className="mt-4 font-display text-lg leading-tight font-bold uppercase italic">{category.name}</p>
                <p className="mt-1 text-xs text-muted">
                  {category.productCount} {category.productCount === 1 ? "producto" : "productos"}
                </p>
              </Link>
            ))}
          </div>
        </Container>
      )}

      {/* Destacados */}
      {highlighted.length > 0 && (
        <Container className="pb-16 sm:pb-20">
          <SectionHeading
            eyebrow="Destacados"
            title="Lo más buscado"
            description="Piezas probadas en calle y pista, elegidas por nuestro equipo."
            action={{ href: "/productos", label: "Ver más productos" }}
          />
          <ProductGrid products={highlighted} />
        </Container>
      )}

      {/* Servicios */}
      {services.length > 0 && (
        <section className="relative overflow-hidden border-y border-line bg-zinc-950">
          <div className="bg-checkered absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-brand-600/15 blur-3xl" aria-hidden="true" />
          <Container className="relative py-16 sm:py-20">
            <SectionHeading
              eyebrow="Taller"
              title="Seteos y servicios"
              description="Reprogramación de ECU, seteo en dinamómetro y puesta a punto de suspensión. Medimos antes y después."
              action={{ href: "/servicios", label: "Ver todos los servicios" }}
            />
            <div className="grid gap-4 md:grid-cols-3">
              {services.slice(0, 3).map((service) => (
                <Link
                  key={service.slug}
                  href={`/servicios#${service.slug}`}
                  className="group flex flex-col rounded-2xl border border-line bg-surface/80 p-6 backdrop-blur transition-colors hover:border-brand-600/60"
                >
                  <div className="flex size-12 items-center justify-center rounded-xl bg-brand-600/15 text-brand-500">
                    <DynamicIcon name={service.icon} className="size-6" />
                  </div>
                  <h3 className="mt-5 font-display text-2xl font-bold uppercase italic">{service.name}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted">{service.summary}</p>
                  <p className="mt-5 flex items-center justify-between text-sm">
                    <span className="font-semibold text-fg">
                      {service.priceFrom ? `Desde ${formatCLP(service.priceFrom)}` : "Cotiza sin costo"}
                    </span>
                    <ArrowRight className="size-4 text-brand-500 transition-transform group-hover:translate-x-1" />
                  </p>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Ofertas */}
      {onSale.length > 0 && (
        <Container className="py-16 sm:py-20">
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
      <Container className={onSale.length > 0 ? "pb-4" : "py-16 sm:py-20"}>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Truck, title: "Despacho a todo Chile", text: "Enviamos por courier o retira en nuestro taller." },
            { icon: ShieldCheck, title: "Pago 100 % seguro", text: "Débito, crédito y prepago con Webpay, o transferencia." },
            { icon: Headset, title: "Asesoría experta", text: "Te ayudamos a elegir la pieza correcta para tu auto." },
            { icon: Wrench, title: "Instalación y seteo", text: "Instalamos y seteamos lo que compras con nosotros." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 bg-surface p-6">
              <Icon className="size-6 shrink-0 text-brand-500" />
              <div>
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>

      {/* Marcas */}
      {brands.length > 0 && (
        <Container className="pt-16">
          <p className="text-center text-xs font-bold tracking-[0.25em] text-muted uppercase">Marcas que trabajamos</p>
          <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-4">
            {brands.map((brand) => (
              <Link
                key={brand.slug}
                href={`/productos?marca=${brand.slug}`}
                className="font-display text-xl font-bold tracking-wide text-zinc-500 uppercase italic transition-colors hover:text-white"
              >
                {brand.name}
              </Link>
            ))}
          </div>
        </Container>
      )}
    </>
  );
}
