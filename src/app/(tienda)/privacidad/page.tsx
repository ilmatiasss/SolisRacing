import type { Metadata } from "next";
import { LegalPage } from "@/components/store/legal-page";
import { getStoreSettings } from "@/lib/data/settings";

export const metadata: Metadata = {
  title: "Política de privacidad",
  alternates: { canonical: "/privacidad" },
};

// Texto base: revísalo con un asesor legal y complétalo con los datos de tu empresa.
export default async function PrivacyPage() {
  const s = await getStoreSettings();
  return (
    <LegalPage title="Política de privacidad" intro="Cómo recopilamos, usamos y protegemos tus datos personales.">
      <section>
        <h2>Datos que recopilamos</h2>
        <p>
          Al comprar o escribirnos te pedimos nombre, correo, teléfono, RUT (cuando corresponde a la boleta o factura) y
          dirección de despacho. No almacenamos los datos de tus tarjetas: el pago con tarjeta se procesa directamente en
          Webpay (Transbank).
        </p>
      </section>
      <section>
        <h2>Para qué los usamos</h2>
        <ul>
          <li>Procesar y despachar tus pedidos, y emitir la boleta o factura.</li>
          <li>Comunicarnos contigo sobre tu compra o solicitud de servicio.</li>
          <li>Cumplir obligaciones legales y tributarias.</li>
        </ul>
        <p>No vendemos ni compartimos tus datos con terceros, salvo con el courier y los proveedores necesarios para completar tu compra.</p>
      </section>
      <section>
        <h2>Tus derechos</h2>
        <p>
          Puedes solicitar el acceso, rectificación o eliminación de tus datos escribiéndonos {s.email ? `a ${s.email}` : `por WhatsApp al ${s.whatsapp}`}, conforme a la
          legislación chilena vigente sobre protección de datos personales.
        </p>
      </section>
      <section>
        <h2>Cookies</h2>
        <p>
          Usamos almacenamiento local del navegador para recordar tu carrito de compras. El panel de administración usa
          cookies de sesión exclusivamente para el personal de la tienda.
        </p>
      </section>
    </LegalPage>
  );
}
