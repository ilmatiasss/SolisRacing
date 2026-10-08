import { expect, test } from "@playwright/test";
import { E2E_ADMIN } from "./constants";
import { loginAsAdmin, placeTransferOrder, visible } from "./helpers";

test.describe.configure({ mode: "serial" });

test("el panel exige iniciar sesión", async ({ page }) => {
  await page.goto("/admin/pedidos");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fpedidos/);
  await page.locator("#email").fill(E2E_ADMIN.email);
  await page.locator("#password").fill("clave-incorrecta");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
});

test("crear un producto con compatibilidad lo publica en la tienda", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/productos/nuevo");
  await page.locator("#name").fill("Intake de prueba para Swift Sport");
  await page.locator("#price").fill("$199.990");
  await page.locator("#compareAtPrice").fill("$229.990");
  await page.locator("#stock").fill("4");
  await page.locator("#categoryId").selectOption({ label: "Admisión" });
  await page.getByRole("button", { name: "Agregar auto compatible" }).click();
  await page.getByLabel("Marca del auto").selectOption({ label: "Suzuki" });
  await page.getByLabel("Modelo", { exact: true }).selectOption({ label: "Swift Sport" });
  await page.getByLabel("Año desde").fill("2018");
  await page.getByRole("button", { name: "Crear producto" }).click();
  await page.waitForURL(/\/admin\/productos\/\d+\?creado=1/);
  await expect(page.getByText("Producto creado.")).toBeVisible();

  await page.goto("/productos?auto=suzuki&modelo=swift-sport&anio=2021");
  await expect(page.getByRole("link", { name: "Intake de prueba para Swift Sport" })).toBeVisible();
  await page.goto("/productos?oferta=1");
  await expect(page.getByRole("link", { name: "Intake de prueba para Swift Sport" })).toBeVisible();
});

test("marcar una transferencia como pagada y despacharla", async ({ page }) => {
  const orderNumber = await placeTransferOrder(page, "liquido-de-frenos-motul-rbf-600-500-ml");
  await loginAsAdmin(page);
  await page.goto(`/admin/pedidos/${orderNumber.replace("SR-", "")}`);

  await page.locator("#status").selectOption("paid");
  await page.getByRole("button", { name: "Actualizar estado" }).click();
  await expect(page.getByText("Estado actualizado y cliente notificado.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Pagado");

  await page.locator("#status").selectOption("shipped");
  await page.locator("#trackingCourier").fill("Starken");
  await page.locator("#trackingNumber").fill("987654321");
  await page.getByRole("button", { name: "Actualizar estado" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Enviado");
  await expect(visible(page.getByText("Pedido enviado por Starken. N° de seguimiento: 987654321."))).toBeVisible();
});

test("los cambios de configuración se reflejan en la tienda", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/configuracion");
  await page.locator("#announcement").fill("Envío gratis a todo Chile este fin de semana");
  await page.getByRole("button", { name: "Guardar configuración" }).click();
  await expect(page.getByText("Configuración guardada")).toBeVisible();
  await page.goto("/");
  await expect(page.getByText("Envío gratis a todo Chile este fin de semana")).toBeVisible();
});
