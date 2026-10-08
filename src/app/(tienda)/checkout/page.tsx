import type { Metadata } from "next";
import { CheckoutForm } from "@/components/store/checkout/checkout-form";
import { PageHeader } from "@/components/store/section-heading";
import { Container } from "@/components/ui/container";
import { getStoreSettings } from "@/lib/data/settings";
import { webpayEnvironment } from "@/lib/payments/webpay";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export default async function CheckoutPage() {
  const settings = await getStoreSettings();
  return (
    <>
      <PageHeader eyebrow="Pago seguro" title="Finalizar compra" />
      <Container className="py-10">
        <CheckoutForm
          shipping={settings.shipping}
          payments={{
            webpayEnabled: settings.payments.webpayEnabled,
            transferEnabled: settings.payments.transferEnabled,
          }}
          webpayEnvironment={webpayEnvironment()}
        />
      </Container>
    </>
  );
}
