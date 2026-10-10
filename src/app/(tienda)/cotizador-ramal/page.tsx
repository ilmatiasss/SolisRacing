import type { Metadata } from "next";
import { HarnessQuote } from "@/components/store/harness-quote";
import { PageHeader } from "@/components/store/section-heading";
import { Container } from "@/components/ui/container";
import { getStoreSettings } from "@/lib/data/settings";
import { harnessPricing } from "@/lib/harness";

export const metadata: Metadata = {
  title: "Cotizador de ramales a medida",
  description:
    "Arma tu ramal para FuelTech: elige el motor, la computadora, los sensores y los extras, y ve al instante un valor aproximado.",
  alternates: { canonical: "/cotizador-ramal" },
};

export default async function HarnessQuotePage() {
  const settings = await getStoreSettings();
  return (
    <>
      <PageHeader
        eyebrow="Ramales a medida"
        title="Cotiza tu ramal"
        description="Fabricamos ramales a medida para FuelTech. Cuéntanos tu motor, la computadora y los sensores, y te mostramos al instante un valor aproximado."
      />
      <Container className="py-14">
        <HarnessQuote pricing={harnessPricing(settings)} whatsapp={settings.whatsapp} />
      </Container>
    </>
  );
}
