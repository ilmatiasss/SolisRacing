import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/store/legal-page";
import { getStoreSettings } from "@/lib/data/settings";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  alternates: { canonical: "/terminos" },
};

// Texto base: revísalo con un asesor legal y complétalo con los datos de tu empresa.
export default async function TermsPage() {
  const s = await getStoreSettings();
  return (
    <LegalPage
      title="Términos y condiciones"
      intro={`Condiciones que rigen las compras realizadas en el sitio web de ${s.storeName}.`}
    >
      <section>
        <h2>1. Identificación</h2>
        <p>
          Este sitio es operado por {s.legalName}
          {s.legalRut && <>, RUT {s.legalRut}</>}, con domicilio en {s.address}, {s.city}. Contacto: {s.email} ·{" "}
          {s.phone}.
        </p>
      </section>
      <section>
        <h2>2. Precios y stock</h2>
        <p>
          Todos los precios están expresados en pesos chilenos e incluyen IVA. Los precios y promociones son válidos
          mientras se muestren en el sitio o hasta agotar stock. El stock se valida al momento de confirmar la compra.
        </p>
      </section>
      <section>
        <h2>3. Medios de pago</h2>
        <p>
          Aceptamos pagos con tarjetas de débito, crédito y prepago a través de Webpay (Transbank) y transferencia
          bancaria. Los pedidos pagados por transferencia se confirman una vez acreditado el pago; reservamos el stock
          por el plazo indicado en las instrucciones de pago.
        </p>
      </section>
      <section>
        <h2>4. Compatibilidad de los productos</h2>
        <p>
          La información de compatibilidad con vehículos es referencial. Recomendamos verificarla con nosotros antes de
          comprar, especialmente si el vehículo tiene modificaciones. Algunas piezas de performance requieren
          instalación profesional y/o reprogramación para funcionar correctamente.
        </p>
      </section>
      <section>
        <h2>5. Uso de piezas de competición</h2>
        <p>
          Ciertos productos están diseñados para uso en pista o competición. Es responsabilidad del comprador verificar
          que su uso en vías públicas cumpla con la normativa vigente, incluida la revisión técnica y las normas de
          emisiones.
        </p>
      </section>
      <section>
        <h2>6. Despachos, cambios y devoluciones</h2>
        <p>
          Revisa nuestra <Link href="/despachos-y-devoluciones" className="text-brand-400 hover:underline">política
          de despachos y devoluciones</Link>, que incluye los derechos de garantía y retracto establecidos en la Ley N°
          19.496 sobre Protección de los Derechos de los Consumidores.
        </p>
      </section>
      <section>
        <h2>7. Datos personales</h2>
        <p>
          El tratamiento de tus datos se rige por nuestra{" "}
          <Link href="/privacidad" className="text-brand-400 hover:underline">política de privacidad</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
