import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/data/catalog";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const { products, categories } = await getSitemapEntries();
  const staticPages = ["", "/productos", "/servicios", "/nosotros", "/pedido-especial", "/cotizador-ramal", "/contacto", "/seguimiento", "/despachos-y-devoluciones", "/terminos", "/privacidad"];
  return [
    ...staticPages.map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.6 })),
    ...categories.map((category) => ({
      url: `${base}/productos?categoria=${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: `${base}/productos/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
