import { Search, Zap } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { DynamicIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { Container } from "@/components/ui/container";
import { getCategories } from "@/lib/data/catalog";
import { getStoreSettings } from "@/lib/data/settings";
import { CartButton, CartDrawer } from "./cart/cart-drawer";
import { HeaderNavLinks } from "./header-nav";
import { Marquee } from "./marquee";
import { ActiveHeaderNav } from "./header-nav-active";
import { MobileMenu } from "./mobile-menu";

export async function SiteHeader() {
  const [categories, settings] = await Promise.all([getCategories(), getStoreSettings()]);
  const menuCategories = categories.map(({ name, slug, icon }) => ({ name, slug, icon }));

  return (
    <>
      {settings.announcement && (
        <div className="relative z-50 bg-brand-600 text-white shadow-[0_0_24px_rgba(255,30,30,0.5)]">
          <Marquee
            repeat={4}
            mobileRepeat={2}
            className="h-9 items-center text-xs font-semibold tracking-wide sm:text-sm"
          >
            <p className="flex items-center gap-6 px-6 whitespace-nowrap [text-shadow:0_0_10px_rgba(255,255,255,0.45)]">
              {settings.announcement}
              <Zap className="size-3.5 fill-current text-signal-400" aria-hidden="true" />
            </p>
          </Marquee>
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-zinc-950/97 md:bg-zinc-950/85 md:backdrop-blur-md">
        <Container className="flex h-16 items-center gap-2 lg:gap-6">
          <MobileMenu categories={menuCategories} />
          <Link href="/" aria-label="Solis Racing Parts, ir al inicio" className="shrink-0">
            <Logo eager glow />
          </Link>
          <Suspense fallback={<HeaderNavLinks />}>
            <ActiveHeaderNav />
          </Suspense>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Form action="/productos" className="relative hidden md:block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                name="q"
                type="search"
                placeholder="Buscar repuestos…"
                aria-label="Buscar en la tienda"
                className="h-10 w-56 rounded-xl border border-white/10 bg-white/5 pr-3 pl-9 text-sm text-white placeholder:text-zinc-500 focus:w-72 focus:border-brand-600 focus:outline-none xl:w-64"
              />
            </Form>
            <Link
              href="/productos"
              aria-label="Buscar"
              className="flex size-10 items-center justify-center rounded-xl text-zinc-200 hover:bg-white/5 md:hidden"
            >
              <Search className="size-5" />
            </Link>
            <CartButton />
          </div>
        </Container>
        <div className="hidden border-t border-white/5 lg:block">
          <Container>
            <nav
              aria-label="Categorías"
              className="scrollbar-none flex gap-1 overflow-x-auto py-1.5 [mask-image:linear-gradient(to_right,black_92%,transparent)]"
            >
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/productos?categoria=${category.slug}`}
                  className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <DynamicIcon name={category.icon} className="size-3.5 text-brand-500" />
                  {category.name}
                </Link>
              ))}
            </nav>
          </Container>
        </div>
      </header>
      <CartDrawer freeShippingThreshold={settings.shipping.freeShippingThreshold} />
    </>
  );
}
