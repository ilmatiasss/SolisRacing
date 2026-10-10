import { Save } from "lucide-react";
import type { Metadata } from "next";
import { ActionForm, ActionSubmit } from "@/components/admin/action-form";
import { AdminPageHeader, Card, Notice } from "@/components/admin/ui";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { saveSettings } from "@/lib/actions/admin/settings";
import { requireAdmin } from "@/lib/auth";
import { REGIONS } from "@/lib/chile";
import { readStoreSettings } from "@/lib/data/settings";
import { webpayEnvironment } from "@/lib/payments/webpay";

export const metadata: Metadata = { title: "Configuración" };

// Página del panel: siempre se consulta la base de datos al momento (no se prerenderiza).
export const instant = false;

export default async function SettingsPage() {
  await requireAdmin();
  const s = await readStoreSettings();
  const env = webpayEnvironment();

  return (
    <>
      <AdminPageHeader title="Configuración" description="Datos de la tienda, pagos y despachos." />
      <ActionForm action={saveSettings} className="space-y-6">
        <Card title="Tienda">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre de la tienda" htmlFor="storeName">
              <Input id="storeName" name="storeName" defaultValue={s.storeName} required />
            </Field>
            <Field label="Frase (slogan)" htmlFor="tagline">
              <Input id="tagline" name="tagline" defaultValue={s.tagline} />
            </Field>
            <Field label="Barra de anuncios" htmlFor="announcement" optional hint="Franja roja sobre el menú. Déjala vacía para ocultarla." className="md:col-span-2">
              <Input id="announcement" name="announcement" defaultValue={s.announcement} />
            </Field>
            <Field label="Razón social" htmlFor="legalName" hint="Aparece en el pie de página y en los comprobantes.">
              <Input id="legalName" name="legalName" defaultValue={s.legalName} />
            </Field>
            <Field label="RUT de la empresa" htmlFor="legalRut" optional>
              <Input id="legalRut" name="legalRut" defaultValue={s.legalRut} placeholder="76.543.210-K" />
            </Field>
          </div>
        </Card>

        <Card title="Contacto y redes">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Correo" htmlFor="email" hint="Aquí llegan los avisos de pedidos y solicitudes.">
              <Input id="email" name="email" type="email" defaultValue={s.email} placeholder="ventas@tudominio.cl" />
            </Field>
            <Field label="WhatsApp" htmlFor="whatsapp" hint="Con código de país, ej: +56 9 1234 5678.">
              <Input id="whatsapp" name="whatsapp" defaultValue={s.whatsapp} />
            </Field>
            <Field label="Teléfono" htmlFor="phone">
              <Input id="phone" name="phone" defaultValue={s.phone} />
            </Field>
            <Field label="Dirección de la tienda" htmlFor="address">
              <Input id="address" name="address" defaultValue={s.address} />
            </Field>
            <Field label="Ciudad / comuna" htmlFor="city">
              <Input id="city" name="city" defaultValue={s.city} />
            </Field>
            <Field label="Link de Google Maps" htmlFor="mapsUrl" optional>
              <Input id="mapsUrl" name="mapsUrl" defaultValue={s.mapsUrl} placeholder="https://maps.app.goo.gl/…" />
            </Field>
            <Field label="Horario de atención" htmlFor="openingHours" className="md:col-span-2">
              <Textarea id="openingHours" name="openingHours" rows={2} defaultValue={s.openingHours} />
            </Field>
            <Field label="Instagram" htmlFor="instagram" optional>
              <Input id="instagram" name="instagram" defaultValue={s.instagram} placeholder="https://instagram.com/…" />
            </Field>
            <Field label="Facebook" htmlFor="facebook" optional>
              <Input id="facebook" name="facebook" defaultValue={s.facebook} placeholder="https://facebook.com/…" />
            </Field>
            <Field label="TikTok" htmlFor="tiktok" optional>
              <Input id="tiktok" name="tiktok" defaultValue={s.tiktok} placeholder="https://tiktok.com/@…" />
            </Field>
            <Field label="YouTube" htmlFor="youtube" optional>
              <Input id="youtube" name="youtube" defaultValue={s.youtube} placeholder="https://youtube.com/@…" />
            </Field>
          </div>
        </Card>

        <Card title="Agenda de servicios">
          <Field
            label="Lugares de atención"
            htmlFor="serviceLocations"
            hint="Uno por línea: nombre | detalle. El cliente elige uno al agendar. Ej: Región de Valparaíso | En visitas programadas a la Quinta Región."
          >
            <Textarea id="serviceLocations" name="serviceLocations" rows={3} defaultValue={s.serviceLocations} />
          </Field>
        </Card>

        <Card title="Videos de Instagram (Quiénes somos)">
          <Field
            label="Publicaciones"
            htmlFor="instagramPosts"
            optional
            hint="Uno por línea: link de la publicación o reel | título | etiqueta. Ej: https://www.instagram.com/reel/ABC123/ | Seteo FuelTech FT550 | Honda Civic 1998. Se muestran en la portada y en /nosotros."
          >
            <Textarea
              id="instagramPosts"
              name="instagramPosts"
              rows={6}
              defaultValue={s.instagramPosts}
              placeholder="https://www.instagram.com/reel/… | Título | Etiqueta"
              className="font-mono text-xs"
            />
          </Field>
        </Card>

        <Card title="Medios de pago">
          <div className="space-y-5">
            <Checkbox
              name="payments.webpayEnabled"
              defaultChecked={s.payments.webpayEnabled}
              label="Webpay (débito, crédito y prepago)"
              description={
                env === "production"
                  ? "Conectado a Transbank en modo producción."
                  : `Modo actual: ${env === "mock" ? "simulador" : "integración (pruebas)"}. Las credenciales se configuran en las variables de entorno.`
              }
            />
            <Checkbox
              name="payments.transferEnabled"
              defaultChecked={s.payments.transferEnabled}
              label="Transferencia bancaria"
              description="El pedido queda pendiente hasta que confirmes el pago."
            />
            <div className="grid gap-4 border-t border-line pt-5 md:grid-cols-2">
              <Field label="Banco" htmlFor="transferBank">
                <Input id="transferBank" name="payments.transferBank" defaultValue={s.payments.transferBank} />
              </Field>
              <Field label="Tipo de cuenta" htmlFor="transferAccountType">
                <Input id="transferAccountType" name="payments.transferAccountType" defaultValue={s.payments.transferAccountType} />
              </Field>
              <Field label="Número de cuenta" htmlFor="transferAccountNumber">
                <Input id="transferAccountNumber" name="payments.transferAccountNumber" defaultValue={s.payments.transferAccountNumber} />
              </Field>
              <Field label="Titular" htmlFor="transferHolder">
                <Input id="transferHolder" name="payments.transferHolder" defaultValue={s.payments.transferHolder} />
              </Field>
              <Field label="RUT del titular" htmlFor="transferRut">
                <Input id="transferRut" name="payments.transferRut" defaultValue={s.payments.transferRut} />
              </Field>
              <Field label="Correo para comprobantes" htmlFor="transferEmail">
                <Input id="transferEmail" name="payments.transferEmail" type="email" defaultValue={s.payments.transferEmail} />
              </Field>
              <Field label="Instrucciones" htmlFor="transferInstructions" className="md:col-span-2">
                <Textarea id="transferInstructions" name="payments.transferInstructions" rows={2} defaultValue={s.payments.transferInstructions} />
              </Field>
            </div>
          </div>
        </Card>

        <Card title="Entregas y despachos">
          <div className="space-y-6">
            <div className="space-y-3">
              <Checkbox name="shipping.pickupEnabled" defaultChecked={s.shipping.pickupEnabled} label="Retiro en tienda (gratis)" />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Dirección de retiro" htmlFor="pickupAddress">
                  <Input id="pickupAddress" name="shipping.pickupAddress" defaultValue={s.shipping.pickupAddress} />
                </Field>
                <Field label="Instrucciones de retiro" htmlFor="pickupInstructions">
                  <Input id="pickupInstructions" name="shipping.pickupInstructions" defaultValue={s.shipping.pickupInstructions} />
                </Field>
              </div>
            </div>
            <div className="space-y-3 border-t border-line pt-5">
              <Checkbox name="shipping.collectEnabled" defaultChecked={s.shipping.collectEnabled} label="Envío por pagar (el cliente paga el courier al recibir)" />
              <Field label="Texto explicativo" htmlFor="collectNote">
                <Input id="collectNote" name="shipping.collectNote" defaultValue={s.shipping.collectNote} />
              </Field>
            </div>
            <div className="space-y-4 border-t border-line pt-5">
              <Checkbox name="shipping.shippingEnabled" defaultChecked={s.shipping.shippingEnabled} label="Despacho a domicilio con tarifa por región" />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Despacho gratis desde (CLP)" htmlFor="freeShippingThreshold" hint="0 = sin despacho gratis.">
                  <Input id="freeShippingThreshold" name="shipping.freeShippingThreshold" inputMode="numeric" defaultValue={s.shipping.freeShippingThreshold} />
                </Field>
                <Field label="Plazo y courier" htmlFor="shippingNote">
                  <Input id="shippingNote" name="shipping.shippingNote" defaultValue={s.shipping.shippingNote} />
                </Field>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Tarifas por región (CLP)</p>
                <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
                  {REGIONS.map((region) => (
                    <label key={region.code} className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-1.5 text-sm">
                      <span className="truncate">{region.shortName}</span>
                      <Input
                        name={`shipping.rates.${region.code}`}
                        inputMode="numeric"
                        defaultValue={s.shipping.rates[region.code]}
                        aria-label={`Tarifa ${region.name}`}
                        className="h-9 w-28 bg-surface text-right"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Notice tone="info">Los cambios se reflejan en la tienda apenas guardas.</Notice>
        <div className="sticky bottom-4 z-10 flex justify-end">
          <ActionSubmit size="lg" className="shadow-lg">
            <Save className="size-4.5" /> Guardar configuración
          </ActionSubmit>
        </div>
      </ActionForm>
    </>
  );
}
