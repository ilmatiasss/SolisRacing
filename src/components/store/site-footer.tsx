import { Clock, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "@/components/icons";
import { Logo } from "@/components/logo";
import { Container } from "@/components/ui/container";
import { getCategories } from "@/lib/data/catalog";
import { getStoreSettings } from "@/lib/data/settings";
import { whatsappLink } from "@/lib/format";

export async function SiteFooter() {
  const [settings, categories] = await Promise.all([getStoreSettings(), getCategories()]);
  const socials = [
    { href: settings.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: settings.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: settings.tiktok, label: "TikTok", Icon: TikTokIcon },
    { href: settings.youtube, label: "YouTube", Icon: YouTubeIcon },
  ].filter((social) => social.href);

  return (
    <footer className="mt-24 border-t border-line bg-zinc-950">
      <div className="h-1 bg-linear-to-r from-brand-700 via-orange-500 to-brand-700" />
      <Container className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{settings.tagline}</p>
          {socials.length > 0 && (
            <div className="mt-6 flex gap-2">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-10 items-center justify-center rounded-xl border border-line text-zinc-300 transition-colors hover:border-brand-600 hover:text-white"
                >
                  <Icon className="size-4.5" />
                </a>
              ))}
            </div>
          )}
        </div>

        <FooterColumn title="Tienda" className="lg:col-span-2">
          <FooterLink href="/productos">Catálogo completo</FooterLink>
          <FooterLink href="/productos?oferta=1">Ofertas</FooterLink>
          <FooterLink href="/pedido-especial">Pedido especial de repuestos</FooterLink>
          {categories.slice(0, 5).map((category) => (
            <FooterLink key={category.slug} href={`/productos?categoria=${category.slug}`}>
              {category.name}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Ayuda" className="lg:col-span-2">
          <FooterLink href="/servicios">Servicios y seteos</FooterLink>
          <FooterLink href="/cotizador-ramal">Cotizador de ramales</FooterLink>
          <FooterLink href="/nosotros">Quiénes somos</FooterLink>
          <FooterLink href="/seguimiento">Seguimiento de pedidos</FooterLink>
          <FooterLink href="/despachos-y-devoluciones">Despachos y devoluciones</FooterLink>
          <FooterLink href="/terminos">Términos y condiciones</FooterLink>
          <FooterLink href="/privacidad">Política de privacidad</FooterLink>
          <FooterLink href="/contacto">Contacto</FooterLink>
        </FooterColumn>

        <FooterColumn title="Contacto" className="lg:col-span-4">
          <ul className="space-y-3 text-sm text-zinc-400">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-500" />
              <span>
                {settings.address}
                <br />
                {settings.city}
              </span>
            </li>
            <li className="flex gap-3">
              <WhatsAppIcon className="mt-0.5 size-4 shrink-0 text-brand-500" />
              <a href={whatsappLink(settings.whatsapp)} className="hover:text-white" target="_blank" rel="noopener noreferrer">
                {settings.whatsapp}
              </a>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-brand-500" />
              <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-white">
                {settings.phone}
              </a>
            </li>
            {settings.email && (
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-brand-500" />
                <a href={`mailto:${settings.email}`} className="hover:text-white">
                  {settings.email}
                </a>
              </li>
            )}
            <li className="flex gap-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-brand-500" />
              <span className="whitespace-pre-line">{settings.openingHours}</span>
            </li>
          </ul>
        </FooterColumn>
      </Container>
      <div className="border-t border-line">
        <Container className="flex flex-col gap-3 py-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {settings.legalName}
            {settings.legalRut && ` · RUT ${settings.legalRut}`} · Precios en pesos chilenos con IVA incluido.
          </p>
          <p className="flex items-center gap-2">
            <span>Pagos seguros con</span>
            <span className="rounded bg-white px-1.5 py-0.5 font-bold text-zinc-900">Webpay</span>
            <span className="rounded border border-line px-1.5 py-0.5 font-semibold text-zinc-300">Transferencia</span>
          </p>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <h2 className="mb-4 font-display text-sm font-bold tracking-widest text-white uppercase">{title}</h2>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm text-zinc-400 transition-colors hover:text-white">
      {children}
    </Link>
  );
}

export async function WhatsAppFloatingButton() {
  const settings = await getStoreSettings();
  if (!settings.whatsapp) return null;
  return (
    <a
      href={whatsappLink(settings.whatsapp, `Hola ${settings.storeName}, tengo una consulta.`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed right-4 bottom-4 z-30 flex size-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg shadow-black/40 transition-transform hover:scale-110 sm:right-6 sm:bottom-6"
    >
      <span aria-hidden="true" className="absolute inset-0 animate-ping-slow rounded-full bg-[#25d366]/35" />
      <WhatsAppIcon className="relative size-7" />
    </a>
  );
}
