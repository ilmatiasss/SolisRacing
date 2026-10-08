"use client";

import { CreditCard, Landmark, Lock, ShieldCheck, Store, Truck, PackageOpen, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ProductImage } from "@/components/store/product-image";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field, FieldError, Input, Select, Textarea } from "@/components/ui/field";
import { placeOrder, type CheckoutState } from "@/lib/actions/checkout";
import { REGIONS, getRegion } from "@/lib/chile";
import { cn } from "@/lib/cn";
import type { DeliveryMethod, DocumentType, PaymentMethod } from "@/lib/db/schema";
import { formatCLP } from "@/lib/format";
import { formatRut } from "@/lib/rut";
import type { PaymentSettings, ShippingSettings } from "@/lib/settings";
import { isDeliveryMethodEnabled, quoteShipping } from "@/lib/shipping";
import { cartStore, cartTotals, useCartItems } from "../cart/cart-store";
import { useCartRefresh, useHydrated } from "../cart/use-cart-refresh";
import { WebpayRedirect } from "./webpay-redirect";

const DRAFT_KEY = "solis-racing-checkout-v1";
const DRAFT_FIELDS = [
  "name",
  "email",
  "phone",
  "rut",
  "documentType",
  "companyName",
  "companyRut",
  "companyGiro",
  "companyAddress",
  "deliveryMethod",
  "region",
  "commune",
  "address",
  "address2",
  "paymentMethod",
] as const;
type Draft = Partial<Record<(typeof DRAFT_FIELDS)[number], string>>;

function readDraft(): Draft {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? "{}");
    return typeof parsed === "object" && parsed !== null ? (parsed as Draft) : {};
  } catch {
    return {};
  }
}

function saveDraft(formData: FormData) {
  try {
    const draft: Draft = {};
    for (const field of DRAFT_FIELDS) {
      const value = formData.get(field);
      if (typeof value === "string" && value) draft[field] = value;
    }
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Sin almacenamiento disponible: no pasa nada, solo no se recuerdan los datos.
  }
}

export type CheckoutConfig = {
  shipping: ShippingSettings;
  payments: Pick<PaymentSettings, "webpayEnabled" | "transferEnabled">;
  webpayEnvironment: "integration" | "production" | "mock";
};

export function CheckoutForm(props: CheckoutConfig) {
  const hydrated = useHydrated();
  if (!hydrated) return <div className="h-96 animate-pulse rounded-2xl bg-surface" />;
  return <CheckoutFormInner {...props} />;
}

function CheckoutFormInner({ shipping, payments, webpayEnvironment }: CheckoutConfig) {
  const items = useCartItems();
  const { notices, refresh, refreshing } = useCartRefresh();
  const [draft] = useState(readDraft);
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(placeOrder, {});

  const deliveryOptions = (["shipping", "shipping_collect", "pickup"] as const).filter((method) =>
    isDeliveryMethodEnabled(shipping, method),
  );
  const paymentOptions = (["webpay", "transfer"] as const).filter((method) =>
    method === "webpay" ? payments.webpayEnabled : payments.transferEnabled,
  );

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | undefined>(() => {
    const saved = draft.deliveryMethod as DeliveryMethod | undefined;
    return saved && deliveryOptions.includes(saved) ? saved : deliveryOptions[0];
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(() => {
    const saved = draft.paymentMethod as PaymentMethod | undefined;
    return saved && paymentOptions.includes(saved) ? saved : paymentOptions[0];
  });
  const [documentType, setDocumentType] = useState<DocumentType>(
    draft.documentType === "factura" ? "factura" : "boleta",
  );
  const [region, setRegion] = useState(getRegion(draft.region) ? draft.region! : "");
  const [commune, setCommune] = useState(
    draft.region && getRegion(draft.region)?.communes.includes(draft.commune ?? "") ? draft.commune! : "",
  );

  // Ajusta el carrito si el servidor detectó falta de stock o cambios de precio.
  useEffect(() => {
    if (state.stockIssues?.length) {
      cartStore.sync(
        state.stockIssues.map((issue) => ({
          productId: issue.productId,
          available: issue.available > 0,
          maxQuantity: issue.available,
        })),
      );
    }
    if (state.pricesChanged) void refresh();
  }, [state, refresh]);

  const { count, subtotal } = cartTotals(items);
  const quote = deliveryMethod ? quoteShipping(shipping, deliveryMethod, region || null, subtotal) : null;
  const shippingCost = quote?.ok ? quote.cost : 0;
  const total = subtotal + shippingCost;
  const errors = state.fieldErrors ?? {};
  const communes = getRegion(region)?.communes ?? [];
  const needsAddress = deliveryMethod !== "pickup";

  if (state.webpay) {
    return <WebpayRedirect url={state.webpay.url} token={state.webpay.token} />;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
        <PackageOpen className="size-10 text-muted" />
        <p className="mt-4 font-display text-2xl font-bold uppercase italic">No hay productos para pagar</p>
        <Link href="/productos" className={buttonClasses({ className: "mt-6" })}>
          Ir al catálogo
        </Link>
      </div>
    );
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    saveDraft(formData);
    // Se invoca la acción manualmente para que el formulario no se borre si hay errores.
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_24rem]">
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(items.map(({ productId, quantity }) => ({ productId, quantity })))}
      />
      <input type="hidden" name="expectedTotal" value={total} />

      <div className="space-y-6">
        {webpayEnvironment !== "production" && paymentOptions.includes("webpay") && (
          <div className="flex gap-3 rounded-2xl border border-signal-400/30 bg-signal-400/10 p-4 text-sm" role="note">
            <TriangleAlert className="mt-0.5 size-4.5 shrink-0 text-signal-400" />
            <p>
              <strong>Webpay está en modo de prueba</strong>
              {webpayEnvironment === "mock"
                ? " (simulador local): no se realizan cobros."
                : ": usa las tarjetas de prueba de Transbank, no se realizan cobros reales."}
            </p>
          </div>
        )}

        <Section number={1} title="Tus datos">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre y apellido" htmlFor="name" error={errors.name} className="sm:col-span-2">
              <Input id="name" name="name" autoComplete="name" defaultValue={draft.name} aria-invalid={!!errors.name} />
            </Field>
            <Field label="Correo" htmlFor="email" error={errors.email} hint="Te enviaremos la confirmación aquí.">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={draft.email}
                aria-invalid={!!errors.email}
              />
            </Field>
            <Field label="Teléfono / WhatsApp" htmlFor="phone" error={errors.phone}>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+56 9 1234 5678"
                defaultValue={draft.phone}
                aria-invalid={!!errors.phone}
              />
            </Field>
          </div>
        </Section>

        <Section number={2} title="Documento tributario">
          <div className="grid gap-3 sm:grid-cols-2">
            <OptionCard
              name="documentType"
              value="boleta"
              checked={documentType === "boleta"}
              onChange={() => setDocumentType("boleta")}
              title="Boleta"
              description="Para personas"
            />
            <OptionCard
              name="documentType"
              value="factura"
              checked={documentType === "factura"}
              onChange={() => setDocumentType("factura")}
              title="Factura"
              description="Para empresas"
            />
          </div>
          {documentType === "boleta" ? (
            <Field label="RUT" htmlFor="rut" optional error={errors.rut} className="mt-4 sm:max-w-xs">
              <Input
                id="rut"
                name="rut"
                placeholder="12.345.678-5"
                defaultValue={draft.rut}
                onBlur={(event) => {
                  if (event.target.value) event.target.value = formatRut(event.target.value);
                }}
                aria-invalid={!!errors.rut}
              />
            </Field>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Razón social" htmlFor="companyName" error={errors.companyName}>
                <Input id="companyName" name="companyName" defaultValue={draft.companyName} aria-invalid={!!errors.companyName} />
              </Field>
              <Field label="RUT empresa" htmlFor="companyRut" error={errors.companyRut}>
                <Input
                  id="companyRut"
                  name="companyRut"
                  placeholder="76.543.210-K"
                  defaultValue={draft.companyRut}
                  onBlur={(event) => {
                    if (event.target.value) event.target.value = formatRut(event.target.value);
                  }}
                  aria-invalid={!!errors.companyRut}
                />
              </Field>
              <Field label="Giro" htmlFor="companyGiro" error={errors.companyGiro}>
                <Input id="companyGiro" name="companyGiro" defaultValue={draft.companyGiro} aria-invalid={!!errors.companyGiro} />
              </Field>
              <Field label="Dirección comercial" htmlFor="companyAddress" optional error={errors.companyAddress}>
                <Input id="companyAddress" name="companyAddress" defaultValue={draft.companyAddress} />
              </Field>
            </div>
          )}
        </Section>

        <Section number={3} title="Entrega">
          {deliveryOptions.length === 0 ? (
            <p className="text-sm text-red-400">No hay métodos de entrega disponibles. Contáctanos para coordinar.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {deliveryOptions.includes("shipping") && (
                <OptionCard
                  name="deliveryMethod"
                  value="shipping"
                  checked={deliveryMethod === "shipping"}
                  onChange={() => setDeliveryMethod("shipping")}
                  icon={<Truck className="size-5" />}
                  title="Despacho a domicilio"
                  description={
                    shipping.freeShippingThreshold > 0
                      ? `Gratis sobre ${formatCLP(shipping.freeShippingThreshold)}`
                      : "Tarifa según región"
                  }
                />
              )}
              {deliveryOptions.includes("shipping_collect") && (
                <OptionCard
                  name="deliveryMethod"
                  value="shipping_collect"
                  checked={deliveryMethod === "shipping_collect"}
                  onChange={() => setDeliveryMethod("shipping_collect")}
                  icon={<PackageOpen className="size-5" />}
                  title="Envío por pagar"
                  description="Pagas el courier al recibir"
                />
              )}
              {deliveryOptions.includes("pickup") && (
                <OptionCard
                  name="deliveryMethod"
                  value="pickup"
                  checked={deliveryMethod === "pickup"}
                  onChange={() => setDeliveryMethod("pickup")}
                  icon={<Store className="size-5" />}
                  title="Retiro en taller"
                  description="Sin costo"
                />
              )}
            </div>
          )}
          <FieldError message={errors.deliveryMethod} />

          {deliveryMethod === "pickup" && (
            <p className="mt-4 rounded-xl bg-surface-2 p-4 text-sm text-zinc-300">
              <strong className="text-fg">Retira en:</strong> {shipping.pickupAddress}
              <br />
              <span className="text-muted">{shipping.pickupInstructions}</span>
            </p>
          )}
          {deliveryMethod === "shipping_collect" && (
            <p className="mt-4 rounded-xl bg-surface-2 p-4 text-sm text-muted">{shipping.collectNote}</p>
          )}
          {deliveryMethod === "shipping" && (
            <p className="mt-4 text-sm text-muted">{shipping.shippingNote}</p>
          )}

          {needsAddress && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Región" htmlFor="region" error={errors.region}>
                <Select
                  id="region"
                  name="region"
                  value={region}
                  onChange={(event) => {
                    setRegion(event.target.value);
                    setCommune("");
                  }}
                  aria-invalid={!!errors.region}
                >
                  <option value="">Selecciona tu región</option>
                  {REGIONS.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Comuna" htmlFor="commune" error={errors.commune}>
                <Select
                  id="commune"
                  name="commune"
                  value={commune}
                  onChange={(event) => setCommune(event.target.value)}
                  disabled={!region}
                  aria-invalid={!!errors.commune}
                >
                  <option value="">{region ? "Selecciona tu comuna" : "Primero elige la región"}</option>
                  {communes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Dirección" htmlFor="address" error={errors.address}>
                <Input
                  id="address"
                  name="address"
                  autoComplete="street-address"
                  placeholder="Calle y número"
                  defaultValue={draft.address}
                  aria-invalid={!!errors.address}
                />
              </Field>
              <Field label="Depto, oficina o casa" htmlFor="address2" optional>
                <Input id="address2" name="address2" defaultValue={draft.address2} />
              </Field>
            </div>
          )}
          <Field label="Notas para el pedido" htmlFor="notes" optional error={errors.notes} className="mt-4">
            <Textarea id="notes" name="notes" rows={2} placeholder="Referencias de la dirección, horario de entrega…" />
          </Field>
        </Section>

        <Section number={4} title="Pago">
          {paymentOptions.length === 0 ? (
            <p className="text-sm text-red-400">No hay medios de pago disponibles. Contáctanos para coordinar.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {paymentOptions.includes("webpay") && (
                <OptionCard
                  name="paymentMethod"
                  value="webpay"
                  checked={paymentMethod === "webpay"}
                  onChange={() => setPaymentMethod("webpay")}
                  icon={<CreditCard className="size-5" />}
                  title="Webpay"
                  description="Débito, crédito o prepago"
                />
              )}
              {paymentOptions.includes("transfer") && (
                <OptionCard
                  name="paymentMethod"
                  value="transfer"
                  checked={paymentMethod === "transfer"}
                  onChange={() => setPaymentMethod("transfer")}
                  icon={<Landmark className="size-5" />}
                  title="Transferencia bancaria"
                  description="Te mostramos los datos al confirmar"
                />
              )}
            </div>
          )}
          <FieldError message={errors.paymentMethod} />
        </Section>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-line bg-surface p-6 lg:sticky lg:top-32">
        <h2 className="font-display text-2xl font-bold uppercase italic">Tu pedido</h2>
        {notices.length > 0 && (
          <div className="space-y-1 rounded-xl border border-signal-400/30 bg-signal-400/10 p-3 text-xs" role="status">
            {notices.map((notice) => (
              <p key={notice}>{notice}</p>
            ))}
          </div>
        )}
        <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
          {items.map((line) => (
            <li key={line.productId} className="flex items-center gap-3">
              <div className="relative shrink-0">
                <ProductImage src={line.imageUrl} alt={line.name} sizes="56px" className="size-14 rounded-lg border border-line" />
                <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-zinc-700 text-[11px] font-bold">
                  {line.quantity}
                </span>
              </div>
              <p className="line-clamp-2 flex-1 text-sm">{line.name}</p>
              <p className="text-sm font-medium tabular-nums">{formatCLP(line.price * line.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal ({count} {count === 1 ? "producto" : "productos"})</dt>
            <dd className="tabular-nums">{formatCLP(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Despacho</dt>
            <dd className="text-right tabular-nums">
              {deliveryMethod === "pickup"
                ? "Retiro gratis"
                : deliveryMethod === "shipping_collect"
                  ? "Por pagar"
                  : quote?.ok
                    ? quote.free
                      ? "Gratis"
                      : formatCLP(quote.cost)
                    : "Elige tu región"}
            </dd>
          </div>
        </dl>
        <div className="flex items-baseline justify-between border-t border-line pt-4">
          <span className="font-semibold">Total</span>
          <span className="font-display text-3xl font-bold tabular-nums">{formatCLP(total)}</span>
        </div>
        <p className="text-xs text-muted">Precios en pesos chilenos, IVA incluido.</p>

        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" name="acceptTerms" className="mt-0.5 size-4.5 shrink-0 accent-brand-600" />
          <span className="text-zinc-300">
            Acepto los{" "}
            <Link href="/terminos" target="_blank" className="text-brand-400 hover:underline">
              términos y condiciones
            </Link>{" "}
            y la{" "}
            <Link href="/despachos-y-devoluciones" target="_blank" className="text-brand-400 hover:underline">
              política de despachos
            </Link>
            .
          </span>
        </label>
        <FieldError message={errors.acceptTerms} />

        {state.error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300" role="alert">
            {state.error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={pending || refreshing || deliveryOptions.length === 0 || paymentOptions.length === 0}
        >
          <Lock className="size-4.5" />
          {pending
            ? "Procesando…"
            : paymentMethod === "webpay"
              ? `Pagar ${formatCLP(total)} con Webpay`
              : "Confirmar pedido"}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
          <ShieldCheck className="size-3.5" /> Tus datos viajan cifrados. No guardamos datos de tarjetas.
        </p>
      </aside>
    </form>
  );
}

function Section({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="mb-5 flex items-center gap-3 font-display text-xl font-bold uppercase italic">
        <span className="flex size-7 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white not-italic">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function OptionCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  icon,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-500",
        checked ? "border-brand-600 bg-brand-600/10" : "border-line bg-surface-2 hover:border-line-strong",
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      {icon && <span className={cn("mt-0.5", checked ? "text-brand-500" : "text-muted")}>{icon}</span>}
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
      </span>
    </label>
  );
}
