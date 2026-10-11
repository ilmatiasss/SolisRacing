import { expect, test } from "@playwright/test";
import { addProductToCart, fillCheckout, placeTransferOrder, visible } from "./helpers";

test.describe.configure({ mode: "serial" });

test("la portada muestra los destacados y el catálogo por categoría", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Más potencia/i })).toBeVisible();
  await expect(page.getByText(/Despacho gratis en compras sobre/)).toBeVisible();
  await expect(page.getByRole("tab", { name: /Destacados/ })).toHaveAttribute("aria-selected", "true");

  const tab = page.getByRole("tab", { name: /Red Line/ });
  await tab.click();
  await expect(tab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel").getByRole("link", { name: "Aceite Race 60WT Red Line" })).toBeVisible();
});

test("el buscador por auto filtra repuestos compatibles", async ({ page }) => {
  await page.goto("/productos");
  await page.locator("#finder-make").selectOption("honda");
  await page.locator("#finder-model").selectOption("civic");
  await page.locator("#finder-year").selectOption("1998");
  await page.getByRole("button", { name: "Buscar repuestos" }).click();
  await expect(page).toHaveURL(/\/productos\?auto=honda&modelo=civic&anio=1998/);
  await expect(page.getByRole("heading", { name: "Repuestos para Honda Civic 1998" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Pieza de prueba para Honda Civic" })).toBeVisible();
  // Una pieza solo compatible con otro auto no aparece.
  await expect(page.getByRole("link", { name: "Pieza de prueba para Lancer Evolution" })).toHaveCount(0);
});

test("el buscador encuentra productos aunque se escriba sin tildes", async ({ page }) => {
  await page.goto("/productos?q=presion");
  await expect(page.getByRole("link", { name: "Kit reloj de presión de aceite 52 mm con pod" })).toBeVisible();
});

test("compra con Webpay aprobada: descuenta stock y vacía el carrito", async ({ page }) => {
  await addProductToCart(page, "sensor-de-presion-ps10b-fueltech", 2);
  await fillCheckout(page, { payment: "webpay" });
  await expect(page.getByText("Webpay está en modo de prueba")).toBeVisible();
  // 2 × $135.000 supera el mínimo para despacho gratis.
  await expect(visible(page.getByText("Gratis", { exact: true }))).toBeVisible();
  await page.getByRole("button", { name: "Pagar $270.000 con Webpay" }).click();

  await page.waitForURL(/\/pago\/simulado\/pagar/);
  await expect(page.getByText("$270.000")).toBeVisible();
  await page.getByRole("button", { name: "Aprobar pago" }).click();

  await page.waitForURL(/\/pedido\/\d+\?t=.*pago=aprobado/);
  await expect(page.getByText("¡Pago aprobado!")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Comprobante de pago" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("solis-racing-cart-v1"))).toBe("[]");
});

test("pago rechazado: cancela el pedido, devuelve el stock y conserva el carrito", async ({ page }) => {
  await addProductToCart(page, "fueltech-ft550");
  await fillCheckout(page, { payment: "webpay", delivery: "pickup" });
  await page.getByRole("button", { name: /Pagar .* con Webpay/ }).click();
  await page.waitForURL(/\/pago\/simulado\/pagar/);
  await page.getByRole("button", { name: "Rechazar pago" }).click();

  await page.waitForURL(/pago=rechazado/);
  await expect(page.getByText("El pago fue rechazado", { exact: true })).toBeVisible();
  const cart = await page.evaluate(() => localStorage.getItem("solis-racing-cart-v1"));
  expect(cart).toContain("fueltech-ft550");

  // La FT550 (única unidad en las pruebas) vuelve a estar disponible.
  await page.goto("/productos/fueltech-ft550");
  await expect(visible(page.getByText("¡Última unidad!"))).toBeVisible();
});

test("pago anulado en Webpay también cancela el pedido", async ({ page }) => {
  await addProductToCart(page, "fueltech-ft550");
  await fillCheckout(page, { payment: "webpay", delivery: "pickup" });
  await page.getByRole("button", { name: /Pagar .* con Webpay/ }).click();
  await page.waitForURL(/\/pago\/simulado\/pagar/);
  await page.getByRole("button", { name: "Anular y volver al comercio" }).click();
  await page.waitForURL(/pago=anulado/);
  await expect(page.getByText("Pago anulado", { exact: true })).toBeVisible();
  await page.goto("/productos/fueltech-ft550");
  await expect(visible(page.getByText("¡Última unidad!"))).toBeVisible();
});

test("compra por transferencia con factura, despacho pagado y seguimiento", async ({ page }) => {
  await addProductToCart(page, "riel-para-union-de-2-bombas-externas-epman");
  await fillCheckout(page, { payment: "transfer" });
  await page.locator("label:has(input[name=documentType][value=factura])").click();
  await page.locator("#companyName").fill("Taller Rojas SpA");
  await page.locator("#companyRut").fill("76.086.428-5");
  await page.locator("#companyGiro").fill("Mecánica automotriz");
  await page.getByRole("button", { name: "Confirmar pedido" }).click();

  await page.waitForURL(/\/pedido\/\d+\?t=/);
  await expect(page.getByText("¡Pedido recibido! Falta tu transferencia")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Datos para transferir" })).toBeVisible();
  await expect(page.getByText("Factura a Taller Rojas SpA (76.086.428-5)")).toBeVisible();
  // $38.000 + despacho a Valparaíso ($7.990)
  await expect(visible(page.getByText("$45.990")).first()).toBeVisible();
  const orderNumber = (await page.getByRole("heading", { level: 1 }).innerText()).trim();

  await page.goto("/seguimiento");
  await page.locator("#number").fill(orderNumber);
  await page.locator("#email").fill("CAMILA@example.com");
  await page.getByRole("button", { name: "Ver mi pedido" }).click();
  await page.waitForURL(/\/pedido\/\d+\?t=/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(orderNumber);
});

test("el seguimiento no muestra pedidos con un correo distinto", async ({ page }) => {
  const orderNumber = await placeTransferOrder(page, "bujia-ngk-bkr7e");
  await page.goto("/seguimiento");
  await page.locator("#number").fill(orderNumber);
  await page.locator("#email").fill("otra-persona@example.com");
  await page.getByRole("button", { name: "Ver mi pedido" }).click();
  await expect(page.getByText("No encontramos un pedido con esos datos")).toBeVisible();
});

test("el checkout valida los datos sin borrar lo escrito", async ({ page }) => {
  await addProductToCart(page, "copla-recta-2-a-2-5");
  await page.goto("/checkout");
  await page.locator("#name").fill("A");
  await page.locator("#email").fill("correo-invalido");
  await page.locator("#rut").fill("12.345.678-9");
  await page.getByRole("button", { name: /Pagar|Confirmar/ }).click();
  await expect(page.getByText("Ingresa tu nombre y apellido")).toBeVisible();
  await expect(page.getByText("Ingresa un correo válido")).toBeVisible();
  await expect(page.getByText("RUT inválido")).toBeVisible();
  await expect(page.getByText("Debes aceptar los términos y condiciones")).toBeVisible();
  await expect(page.locator("#name")).toHaveValue("A");
});

test("la agenda de servicios pide lugar, día y hora, y se envía", async ({ page }) => {
  await page.goto("/servicios");
  await page.locator("#booking-name").fill("Diego Fuentes");
  await page.locator("#booking-email").fill("diego@example.com");
  await page.locator("#booking-phone").fill("+56 9 2222 3333");
  await page.getByRole("button", { name: "Solicitar hora" }).click();
  await expect(page.getByText("Elige un día disponible en el calendario")).toBeVisible();
  await expect(page.getByText("Elige una hora", { exact: true })).toBeVisible();

  await page.getByText("Región de Valparaíso", { exact: true }).click();
  const days = page.locator("#agendar button[aria-pressed]:not([disabled])");
  if ((await days.count()) === 0) await page.getByRole("button", { name: "Mes siguiente" }).click();
  await days.first().click();
  await page.getByText("16:00", { exact: true }).click();
  await page.getByRole("button", { name: "Solicitar hora" }).click();
  const confirmation = page.getByRole("status").filter({ hasText: "¡Solicitud enviada!" });
  await expect(confirmation).toContainText("Región de Valparaíso");
  await expect(confirmation).toContainText("a las 16:00");
});

test("el pedido especial de un repuesto pide auto y teléfono, y se envía", async ({ page }) => {
  await page.goto("/pedido-especial");
  await page.locator("#part-name").fill("Camila Rojas");
  await page.locator("#part-email").fill("camila@example.com");
  await page.locator("#part-message").fill("Bomba de combustible Walbro 450 lph");
  await page.getByRole("button", { name: "Pedir cotización" }).click();
  await expect(page.getByText("Indica tu auto")).toBeVisible();
  await expect(page.getByText("Déjanos un teléfono o WhatsApp")).toBeVisible();
  await expect(page.locator("#part-message")).toHaveValue("Bomba de combustible Walbro 450 lph");
  await page.locator("#part-phone").fill("+56 9 4444 5555");
  await page.locator("#part-vehicle").fill("Mitsubishi Lancer Evo IX 2006");
  await page.getByRole("button", { name: "Pedir cotización" }).click();
  await expect(page.getByText("¡Mensaje enviado!")).toBeVisible();
});

test("el cotizador de ramales muestra el valor aproximado y envía la cotización", async ({ page }) => {
  await page.goto("/cotizador-ramal");
  await page.locator("#harness-make").selectOption("Mitsubishi");
  await page.locator("#harness-model").fill("Lancer Evo IX 4G63");
  await page.getByRole("radio", { name: "FT550" }).click();
  // FT550 + 4 cilindros + 6 sensores originales marcados por defecto = 230.000 + 48.000 + 48.000 + 24.000.
  await expect(page.locator("#valor-ramal").getByText("$300.000 – $405.000")).toBeVisible();
  await page.getByLabel("Acelerador electrónico").check();
  await expect(page.locator("#valor-ramal").getByText("$330.000 – $450.000")).toBeVisible();
  await page.locator("#harness-name").fill("Tomás Vera");
  await page.locator("#harness-phone").fill("+56 9 7777 8888");
  await page.locator("#harness-email").fill("tomas@example.com");
  await page.getByRole("button", { name: "Pedir cotización formal" }).click();
  await expect(page.getByText("¡Cotización enviada!")).toBeVisible();
});

test("el aviso «Próximamente» solo lo ven los visitantes, no la vista previa", async ({ page }) => {
  // En localhost (como en *.vercel.app) se ve la tienda completa.
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Más potencia/i })).toBeVisible();
  await expect(page.getByRole("region", { name: "Próximamente" })).toBeHidden();

  // ?preview=0 muestra el aviso como lo ve un visitante del dominio público.
  await page.goto("/?preview=0");
  const aviso = page.getByRole("region", { name: "Próximamente" });
  await expect(aviso).toBeVisible();
  await expect(aviso.getByRole("heading", { name: /lo mejor del racing en Chile/i })).toBeVisible();
  await expect(aviso.getByText("por Diego Solis")).toBeVisible();
  await expect(aviso.getByRole("link", { name: "Instagram" })).toBeVisible();

  // ?preview=1 vuelve a la tienda y queda guardado en el navegador.
  await page.goto("/?preview=1");
  await expect(aviso).toBeHidden();
  await page.goto("/servicios");
  await expect(aviso).toBeHidden();
});
