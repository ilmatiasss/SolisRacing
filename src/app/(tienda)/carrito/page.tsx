import type { Metadata } from "next";
import { CartView } from "@/components/store/cart/cart-view";
import { PageHeader } from "@/components/store/section-heading";
import { Container } from "@/components/ui/container";
import { getStoreSettings } from "@/lib/data/settings";

export const metadata: Metadata = { title: "Carrito", robots: { index: false } };

export default async function CartPage() {
  const settings = await getStoreSettings();
  return (
    <>
      <PageHeader eyebrow="Tu compra" title="Carrito" />
      <Container className="py-10">
        <CartView freeShippingThreshold={settings.shipping.freeShippingThreshold} />
      </Container>
    </>
  );
}
