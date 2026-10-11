import type { Metadata, Viewport } from "next";
import { Saira_Condensed, Titillium_Web } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

// Texto: Titillium Web (aire de telemetría de carrera). Títulos y números: Saira Condensed (la cursiva es inclinación del navegador).
const titillium = Titillium_Web({
  variable: "--font-titillium",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const saira = Saira_Condensed({
  variable: "--font-saira",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Solis Racing Parts · Partes de performance y programación",
    template: "%s · Solis Racing Parts",
  },
  description:
    "Autopartes de performance en Antofagasta: FuelTech, sistemas de combustible, sensores, fittings, relojería y programación. Despachos a todo Chile y pago con Webpay.",
  applicationName: "Solis Racing Parts",
  openGraph: {
    type: "website",
    locale: "es_CL",
    siteName: "Solis Racing Parts",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CL" className={`${titillium.variable} ${saira.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
