import type { Metadata } from "next";
import { LegalPage } from "@/components/store/legal-page";
import { REGIONS } from "@/lib/chile";
import { getStoreSettings } from "@/lib/data/settings";
import { formatCLP } from "@/lib/format";

export const metadata: Metadata = {
  title: "Despachos y devoluciones",
  alternates: { canonical: "/despachos-y-devoluciones" },
};

// Texto base: revísalo con un asesor legal y ajústalo a tus condiciones reales.
export default async function ShippingPolicyPage() {
  const s = await getStoreSettings();
  const sh = s.shipping;
  return (
    <LegalPage title="Despachos y devoluciones" intro="Plazos, costos de envío, garantía y cambios.">
      <section>
        <h2>Despachos</h2>
        {sh.shippingEnabled && (
          <p>
            Despachamos a todo Chile. {sh.shippingNote}{" "}
            {sh.freeShippingThreshold > 0 && <>El despacho es gratis en compras sobre {formatCLP(sh.freeShippingThreshold)}.</>}
          </p>
        )}
        {sh.collectEnabled && <p>Envío por pagar: {sh.collectNote}</p>}
        {sh.pickupEnabled && (
          <p>
            Retiro en taller sin costo en {sh.pickupAddress}. {sh.pickupInstructions}
          </p>
        )}
      </section>
      {sh.shippingEnabled && (
        <section>
          <h2>Tarifas por región</h2>
          <div className="overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-line">
                {REGIONS.map((region) => (
                  <tr key={region.code} className="bg-surface">
                    <td className="px-4 py-2.5">{region.name}</td>
                    <td className="px-4 py-2.5 text-right font-semibold whitespace-nowrap tabular-nums">
                      {formatCLP(sh.rates[region.code])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <section>
        <h2>Garantía legal</h2>
        <p>
          Si un producto presenta fallas de fabricación, tienes derecho a elegir entre su reparación, cambio o la
          devolución del dinero dentro de los plazos de la garantía legal que establece la Ley N° 19.496. Las piezas
          deben haber sido instaladas correctamente; los daños por instalación inadecuada, uso en competición o
          modificaciones no están cubiertos por la garantía del fabricante.
        </p>
      </section>
      <section>
        <h2>Derecho a retracto</h2>
        <p>
          En compras a distancia puedes ejercer tu derecho a retracto dentro de los 10 días siguientes a la recepción del
          producto, siempre que no haya sido usado ni instalado y se devuelva en su embalaje original. Los costos de
          envío de la devolución pueden ser de cargo del cliente.
        </p>
      </section>
      <section>
        <h2>Cómo solicitar un cambio o devolución</h2>
        <p>
          Escríbenos {s.email && <>a {s.email} o </>}por WhatsApp al {s.whatsapp} indicando tu número de pedido y el motivo. Te
          responderemos con las instrucciones para el envío o la entrega en el taller.
        </p>
      </section>
    </LegalPage>
  );
}
