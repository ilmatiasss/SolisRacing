import { expect, type Locator, type Page } from "@playwright/test";
import { E2E_ADMIN } from "./constants";

/**
 * Next.js conserva oculta la página anterior para volver atrás al instante, así que un
 * mismo texto puede existir dos veces en el DOM: filtramos por elementos visibles.
 */
export const visible = (locator: Locator) => locator.filter({ visible: true });

export async function addProductToCart(page: Page, slug: string, quantity = 1) {
  await page.goto(`/productos/${slug}`);
  for (let i = 1; i < quantity; i++) await page.getByRole("button", { name: "Aumentar cantidad" }).click();
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

export async function fillCheckout(
  page: Page,
  options: { payment: "webpay" | "transfer"; delivery?: "shipping" | "pickup" | "shipping_collect" },
) {
  await page.goto("/checkout");
  await page.locator("#name").fill("Camila Rojas");
  await page.locator("#email").fill("camila@example.com");
  await page.locator("#phone").fill("+56 9 5555 4444");
  await page.locator("#rut").fill("12.345.678-5");
  const delivery = options.delivery ?? "shipping";
  await page.locator(`label:has(input[name=deliveryMethod][value=${delivery}])`).click();
  if (delivery !== "pickup") {
    await page.locator("#region").selectOption("VS");
    await page.locator("#commune").selectOption("Viña del Mar");
    await page.locator("#address").fill("Av. Libertad 1100");
  }
  await page.locator(`label:has(input[name=paymentMethod][value=${options.payment}])`).click();
  await page.locator("input[name=acceptTerms]").check();
}

/** Crea un pedido por transferencia como cliente y devuelve su número (ej: "SR-1005"). */
export async function placeTransferOrder(page: Page, slug: string) {
  await addProductToCart(page, slug);
  await fillCheckout(page, { payment: "transfer" });
  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  await page.waitForURL(/\/pedido\/\d+\?t=/);
  return (await page.getByRole("heading", { level: 1 }).innerText()).trim();
}

export async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.locator("#email").fill(E2E_ADMIN.email);
  await page.locator("#password").fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL("/admin");
}
