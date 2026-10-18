import type { StoreSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/site";

/** Ficha de la tienda física para buscadores (negocio local: dirección, teléfono y redes). */
export function StoreJsonLd({ settings }: { settings: StoreSettings }) {
  const url = siteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "AutoPartsStore",
    name: settings.storeName,
    description: settings.tagline,
    url,
    logo: `${url}/icon.png`,
    image: `${url}/opengraph-image.jpg`,
    telephone: settings.phone || undefined,
    email: settings.email || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address,
      addressLocality: settings.city,
      addressCountry: "CL",
    },
    areaServed: "CL",
    currenciesAccepted: "CLP",
    sameAs: [settings.instagram, settings.facebook, settings.tiktok, settings.youtube].filter(Boolean),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
