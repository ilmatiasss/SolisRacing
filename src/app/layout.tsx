import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Solis Racing Parts · Partes de performance y seteos",
    template: "%s · Solis Racing Parts",
  },
  description:
    "Autopartes de performance en Antofagasta: FuelTech, sistemas de combustible, sensores, fittings, relojería y seteos. Despachos a todo Chile y pago con Webpay.",
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
    <html lang="es-CL" className={`${inter.variable} ${barlow.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
