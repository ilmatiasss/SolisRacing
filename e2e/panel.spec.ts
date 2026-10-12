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
  await page.locator("#name").fill("Sensor de prueba para Swift Sport");
  await page.locator("#price").fill("$199.990");
  await page.locator("#compareAtPrice").fill("$229.990");
  await page.locator("#stock").fill("4");
  await page.locator("#categoryId").selectOption({ label: "Sensores" });
  await page.getByRole("button", { name: "Agregar auto compatible" }).click();
  await page.getByLabel("Marca del auto").selectOption({ label: "Suzuki" });
  await page.getByLabel("Modelo", { exact: true }).selectOption({ label: "Swift Sport" });
  await page.getByLabel("Año desde").fill("2018");
  await page.getByRole("button", { name: "Crear producto" }).click();
  await page.waitForURL(/\/admin\/productos\/\d+\?creado=1/);
  await expect(page.getByText("Producto creado.")).toBeVisible();

  await page.goto("/productos?auto=suzuki&modelo=swift-sport&anio=2021");
  await expect(page.getByRole("link", { name: "Sensor de prueba para Swift Sport" })).toBeVisible();
  await page.goto("/productos?oferta=1");
  await expect(page.getByRole("link", { name: "Sensor de prueba para Swift Sport" })).toBeVisible();
});

test("marcar una transferencia como pagada y despacharla", async ({ page }) => {
  const orderNumber = await placeTransferOrder(page, "pod-para-reloj-de-52-mm");
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
  // El anuncio se desplaza en una banda que lo repite: basta con la primera copia.
  await expect(page.getByText("Envío gratis a todo Chile este fin de semana").first()).toBeVisible();
});

test("un borrador sin precio no se puede publicar", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/productos?q=Fitting ORB");
  await page.getByRole("link", { name: "Fitting ORB" }).click();
  await page.waitForURL(/\/admin\/productos\/\d+/);
  await page.locator("#status").selectOption("active");
  await page.locator("#price").fill("0");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Para publicar el producto, ingresa un precio mayor a $0.")).toBeVisible();
  await page.goto("/productos?q=fitting orb");
  await expect(page.getByRole("link", { name: "Fitting ORB" })).toHaveCount(0);
});

test("los videos de Instagram del panel aparecen en Quiénes somos", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/configuracion");
  await page.locator("#instagramPosts").fill("https://www.instagram.com/solis_racingparts/");
  await page.getByRole("button", { name: "Guardar configuración" }).click();
  await expect(page.getByText("no es un link de publicación de Instagram")).toBeVisible();
  await page
    .locator("#instagramPosts")
    .fill("https://www.instagram.com/p/C0ProyectoE2E/ | Programación FuelTech | Nissan Skyline R34");
  await page.getByRole("button", { name: "Guardar configuración" }).click();
  await expect(page.getByText("Configuración guardada")).toBeVisible();
  await page.goto("/proyectos");
  await expect(page).toHaveURL(/\/nosotros$/);
  await expect(page.getByText("Nissan Skyline R34", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Programación FuelTech/ }).first()).toHaveAttribute(
    "href",
    "https://www.instagram.com/p/C0ProyectoE2E/",
  );
});

test("la agenda del panel define fechas de visita y no repite horas pedidas", async ({ page }) => {
  // Fecha de visita: en 9 días (hora de Chile).
  const visit = new Date(Date.now() + 9 * 86_400_000).toLocaleDateString("en-CA", { timeZone: "America/Santiago" });

  await loginAsAdmin(page);
  await page.goto("/admin/agenda");
  const valparaiso = page.getByRole("region", { name: "Región de Valparaíso" });
  await valparaiso.getByText("Solo en fechas de visita").click();
  await valparaiso.getByLabel("Fechas de visita", { exact: true }).fill(visit);
  await valparaiso.getByRole("button", { name: "Agregar" }).first().click();
  await page.getByRole("button", { name: "Guardar agenda" }).click();
  await expect(page.getByText("Agenda guardada")).toBeVisible();

  const pickVisitDay = async () => {
    await page.goto("/servicios");
    await page.getByText("Región de Valparaíso", { exact: true }).click();
    const days = page.locator("#agendar button[aria-pressed]:not([disabled])");
    if ((await days.count()) === 0) await page.getByRole("button", { name: "Mes siguiente" }).click();
    await expect(days).toHaveCount(1);
    await days.first().click();
  };

  await pickVisitDay();
  await page.getByText("15:00", { exact: true }).click();
  await page.locator("#booking-name").fill("Camila Rojas");
  await page.locator("#booking-email").fill("camila@example.com");
  await page.locator("#booking-phone").fill("+56 9 4444 5555");
  await page.getByRole("button", { name: "Solicitar hora" }).click();
  await expect(page.getByRole("status").filter({ hasText: "¡Solicitud enviada!" })).toContainText("a las 15:00");

  // La hora pedida ya no se ofrece; las demás sí.
  await pickVisitDay();
  await expect(page.getByText("16:00", { exact: true })).toBeVisible();
  await expect(page.getByText("15:00", { exact: true })).toHaveCount(0);

  await page.goto("/admin/agenda");
  await expect(page.getByRole("listitem").filter({ hasText: "Camila Rojas" }).last()).toContainText("15:00");
});

test("una solicitud de supresión de datos llega al panel y se puede atender", async ({ page }) => {
  await page.goto("/privacidad");
  await expect(page.getByRole("heading", { name: /Tus derechos/ })).toBeVisible();
  await page.getByRole("link", { name: "formulario de derechos" }).first().click();
  await expect(page).toHaveURL(/\/privacidad\/derechos$/);

  await page.getByRole("button", { name: "Enviar solicitud" }).click();
  await expect(page.getByText("Elige qué derecho quieres ejercer")).toBeVisible();
  await page.getByText("Supresión", { exact: true }).click();
  await page.locator("#privacy-name").fill("Paula Contreras");
  await page.locator("#privacy-email").fill("paula@example.com");
  await page.locator("#privacy-rut").fill("12.345.678-0");
  await page.locator("#privacy-message").fill("Quiero que eliminen mis datos de contacto.");
  await page.getByRole("button", { name: "Enviar solicitud" }).click();
  await expect(page.getByText("El RUT no es válido")).toBeVisible();
  await page.locator("#privacy-rut").fill("");
  await page.getByRole("button", { name: "Enviar solicitud" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Solicitud recibida" })).toBeVisible();

  await loginAsAdmin(page);
  await page.goto("/admin/solicitudes");
  const request = page.locator("section").filter({ hasText: "Paula Contreras" });
  await expect(request).toContainText("Derechos sobre datos personales: Supresión");
  await expect(request).toContainText("Responder antes del");

  await page.goto("/admin/privacidad?correo=paula@example.com");
  await expect(page.getByText("Solicitudes y mensajes (1)")).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Descargar sus datos (JSON)" }).click();
  expect((await download).suggestedFilename()).toBe("datos-paula-example-com.json");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Eliminar sus solicitudes y mensajes" }).click();
  await expect(page.getByText("Se eliminó 1 solicitud.")).toBeVisible();
});

test("la prueba de integración registra las consultas tipo Jumpseller sin guardar el token", async ({ page, request }) => {
  const auth = { Authorization: `Basic ${Buffer.from("solis-prueba:prueba-1234").toString("base64")}` };
  const products = await request.get("/api/jumpseller/v1/products.json?page=1&limit=50", { headers: auth });
  expect(products.ok()).toBe(true);
  expect(await products.json()).toEqual([]);
  // Si Fullpyme usa la URL como dominio, /v1/… también llega.
  const store = await request.get("/v1/store/info.json?login=solis-prueba&authtoken=prueba-1234");
  expect((await store.json()).store.currency).toBe("CLP");
  await request.put("/api/jumpseller/v1/products/15.json", { headers: auth, data: { product: { stock: 3, price: 19990 } } });

  await loginAsAdmin(page);
  await page.goto("/admin/integraciones");
  await expect(page.getByText("Consultas recibidas (3)")).toBeVisible();
  await expect(page.getByText("/v1/products.json?page=1&limit=50")).toBeVisible();
  await expect(page.getByText("/v1/products/15.json")).toBeVisible();
  await expect(page.getByText(/usuario=solis-prueba token=pru…\(11\)/).first()).toBeVisible();
  await expect(page.getByText("/v1/store/info.json?login=solis-prueba&authtoken=pru…(11)")).toBeVisible();
  // En el registro (no en las instrucciones) el token nunca aparece completo.
  await expect(page.locator("section").filter({ hasText: "Consultas recibidas" })).not.toContainText("prueba-1234");
});
