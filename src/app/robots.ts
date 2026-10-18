import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // "/pedido/" con barra: sin ella también bloquearía /pedido-especial.
      disallow: ["/admin", "/carrito", "/checkout", "/pedido/", "/pago"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
