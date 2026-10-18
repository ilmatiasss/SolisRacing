import type { Metadata } from "next";
import { LegalPage } from "@/components/store/legal-page";
import { REGIONS } from "@/lib/chile";
import { getStoreSettings } from "@/lib/data/settings";
import { formatCLP } from "@/lib/format";

export const metadata: Metadata = {
  title: "Despachos y devoluciones",
  description: "Costos y plazos de despacho a todo Chile, retiro en Antofagasta, garantía legal de 6 meses y derecho a retracto.",
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
            Retiro en tienda sin costo en {sh.pickupAddress}. {sh.pickupInstructions}
          </p>
        )}
      </section>
      {sh.shippingEnabled && (
        <section>
          <h2>Tarifas por región</h2>
          <div className="overflow-hidden rounded-lg border border-line">
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
          Si un producto nuevo presenta fallas o defectos de fabricación, o no corresponde a lo que compraste, dentro de
          los <strong>6 meses</strong> siguientes a que lo recibes puedes elegir libremente entre su reparación gratuita,
          su cambio o la devolución de lo pagado (garantía legal de la Ley N° 19.496). Solo necesitas tu boleta, factura
          o número de pedido.
        </p>
        <p>
          La garantía cubre fallas del producto, no daños causados por una instalación incorrecta o por un uso distinto
          al indicado por el fabricante. Algunos productos tienen además garantía del fabricante, con sus propias
          condiciones, que se suma a la garantía legal y no la reemplaza.
        </p>
      </section>
      <section>
        <h2>Derecho a retracto</h2>
        <p>
          En compras hechas en este sitio puedes retractarte dentro de los <strong>10 días</strong> siguientes a la
          recepción del producto, sin necesidad de dar un motivo. El producto debe estar sin uso ni instalar, en su
          embalaje original y con sus accesorios. Te devolvemos lo pagado sin descuentos ni retención de gastos, a la
          brevedad y a más tardar dentro de 45 días desde que nos avisas. Coordinamos contigo la devolución, que también
          puedes hacer directamente en la tienda.
        </p>
      </section>
      <section>
        <h2>Cómo solicitar un cambio o devolución</h2>
        <p>
          Escríbenos {s.email && <>a {s.email} o </>}por WhatsApp al {s.whatsapp} indicando tu número de pedido y el motivo. Te
          responderemos con las instrucciones para el envío o la entrega en la tienda.
        </p>
      </section>
    </LegalPage>
  );
}
