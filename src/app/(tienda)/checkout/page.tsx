import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/store/checkout/checkout-form";
import { PageHeader } from "@/components/store/section-heading";
import { Container } from "@/components/ui/container";
import { getCurrentAdmin } from "@/lib/auth";
import { getStoreSettings } from "@/lib/data/settings";
import { availablePayments, isWebpaySandboxForAdmins, webpayEnvironment } from "@/lib/payments/webpay";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <>
      <PageHeader eyebrow="Pago seguro" title="Finalizar compra" />
      <Container className="py-10">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-surface" />}>
          <Checkout />
        </Suspense>
      </Container>
    </>
  );
}

/** Lee la sesión: un administrador puede probar Webpay de pruebas en el sitio publicado. */
async function Checkout() {
  const [settings, admin] = await Promise.all([getStoreSettings(), getCurrentAdmin()]);
  const viewer = { admin: Boolean(admin) };
  return (
    <CheckoutForm
      shipping={settings.shipping}
      payments={availablePayments(settings, viewer)}
      webpayEnvironment={webpayEnvironment()}
      adminSandbox={viewer.admin && isWebpaySandboxForAdmins()}
    />
  );
}
