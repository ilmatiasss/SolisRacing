import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite compilar las pruebas e2e en otra carpeta sin pisar el build normal.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    serverActions: {
      // Las fotos se comprimen en el navegador antes de subirlas, pero dejamos margen.
      bodySizeLimit: "5mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async rewrites() {
    // Prueba de integración con Fullpyme: si su conector usa la URL como dominio y le agrega /v1/…
    // (como la API de Jumpseller), también llega al registro.
    return [{ source: "/v1/:path*", destination: "/api/jumpseller/v1/:path*" }];
  },
  async redirects() {
    // La galería de Instagram partió como "Proyectos" y pasó a ser "Quiénes somos".
    // El seguimiento de pedidos se quitó: cada cliente recibe el link de su pedido por correo.
    return [
      { source: "/proyectos", destination: "/nosotros", permanent: true },
      { source: "/seguimiento", destination: "/contacto", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Solo HTTPS (seguridad de los datos personales en tránsito).
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Sin restringir scripts (Instagram, Next): bloquea plugins, cambio de <base>, que otros sitios nos
          // enmarquen y que un formulario envíe datos fuera de la tienda (salvo al pago de Webpay).
          {
            key: "Content-Security-Policy",
            value: [
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'self'",
              "form-action 'self' https://webpay3g.transbank.cl https://webpay3gint.transbank.cl",
            ].join("; "),
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
