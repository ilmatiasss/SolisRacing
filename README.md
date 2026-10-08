# Solis Racing · Tienda online

Ecommerce a medida para **Solis Racing**: venta de partes de performance para autos y agenda de seteos, pensado para Chile (pesos chilenos, regiones y comunas, RUT, boleta o factura, Webpay y transferencia).

## Qué incluye

**Tienda**

- Portada con buscador **«Encuentra repuestos para tu auto»** (marca → modelo → año).
- Catálogo con búsqueda sin tildes, filtros por categoría, marca, auto, ofertas y stock, y orden por precio o novedad.
- Ficha de producto con galería, precio con oferta, stock, especificaciones, tabla de compatibilidad, productos relacionados y consulta por WhatsApp.
- Carrito que se guarda en el navegador y se actualiza con los precios y el stock reales.
- Checkout chileno: región y comuna (16 regiones, 346 comunas), boleta o factura con validación de RUT, despacho a domicilio (tarifa por región y despacho gratis desde un monto), envío por pagar o retiro en taller.
- Pago con **Webpay Plus** (débito, crédito y prepago) o **transferencia bancaria**.
- Página del pedido con comprobante de pago, datos para transferir e historial; seguimiento con número de pedido + correo.
- Página de **servicios y seteos** con formulario para agendar hora, contacto, despachos y devoluciones, términos y privacidad.
- SEO: metadatos, sitemap, robots y datos estructurados de producto.

**Panel de administración** (`/admin`)

- Resumen: ventas del mes, pedidos por despachar, transferencias pendientes, stock bajo y solicitudes nuevas.
- Productos: crear y editar con fotos (arrastrar y soltar, se optimizan solas), compatibilidad por auto, especificaciones, ofertas, stock y estado.
- Pedidos: filtros, detalle, cambio de estado con aviso por correo, número de seguimiento del courier, notas internas.
- Categorías, marcas, vehículos (marcas y modelos), servicios, solicitudes, usuarios y configuración de la tienda (contacto, redes, datos bancarios, tarifas de despacho).

**Reglas de negocio importantes**

- Los precios y el stock **siempre se recalculan en el servidor**; nunca se confía en lo que envía el navegador.
- El stock se reserva al crear el pedido y **se devuelve automáticamente** si el pago se rechaza, se anula, expira o si cancelas el pedido.
- Los pagos con Webpay se confirman (commit) solo cuando Transbank devuelve al cliente, verificando monto, orden de compra y sesión.

## Tecnologías

Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4, PostgreSQL con Drizzle ORM, SDK oficial de Transbank, Vercel Blob para imágenes y Nodemailer para correos. Pruebas con Vitest y Playwright.

---

## Publicar la tienda en Vercel (paso a paso)

1. **Crea una cuenta en [Vercel](https://vercel.com)** con tu cuenta de GitHub e importa este repositorio (*Add New → Project*).
2. **Base de datos**: en el proyecto, ve a *Storage → Create Database → Neon (Postgres)* y conéctala al proyecto. Esto crea la variable `DATABASE_URL`.
3. **Fotos**: en *Storage → Create → Blob*, crea un almacenamiento **público** y conéctalo. Esto crea `BLOB_READ_WRITE_TOKEN`.
4. **Variables de entorno** (*Settings → Environment Variables*):

   | Variable | Valor |
   | --- | --- |
   | `ADMIN_EMAIL` | Tu correo para entrar al panel |
   | `ADMIN_PASSWORD` | Una contraseña segura (mínimo 8 caracteres) |
   | `AUTH_SECRET` | Texto aleatorio largo (por ejemplo, el resultado de `openssl rand -base64 32`) |
   | `NEXT_PUBLIC_SITE_URL` | La URL de tu tienda, ej. `https://solisracing.cl` |
   | `WEBPAY_ENVIRONMENT` | `integration` mientras pruebas, `production` para cobrar |
   | `SEED_DEMO_DATA` | `true` si quieres partir con el catálogo de ejemplo, `false` para partir vacío |

5. **Deploy**. En cada publicación, Vercel ejecuta `npm run vercel-build`, que aplica las migraciones de la base de datos, crea el usuario administrador (si no existe) y carga los datos de ejemplo (si corresponde) antes de compilar.
6. Entra a `https://tu-dominio/admin` con `ADMIN_EMAIL` y `ADMIN_PASSWORD`, completa **Configuración** (WhatsApp, dirección, datos bancarios, tarifas) y carga tus productos.
7. **Dominio propio**: en *Settings → Domains* agrega tu dominio (ej. `solisracing.cl`, que se compra en [NIC Chile](https://www.nic.cl)).

> Si cambias variables de entorno en Vercel, vuelve a desplegar para que se apliquen.

## Webpay Plus (Transbank)

La tienda parte en el **ambiente de integración** de Transbank: puedes hacer compras de prueba de punta a punta sin dinero real. En el pago usa las [tarjetas de prueba de Transbank](https://www.transbankdevelopers.cl/documentacion/como_empezar#tarjetas-de-prueba), por ejemplo:

- VISA `4051 8856 0044 6623`, CVV `123`, cualquier fecha futura → **aprobada**
- Cuando pida autenticación: RUT `11.111.111-1`, clave `123`

Mientras Webpay no esté en producción, la tienda y el panel muestran un aviso, y los pedidos pagados en pruebas se marcan como **PRUEBA** en el panel (no los despaches).

**Para cobrar de verdad:**

1. Contrata **Webpay Plus** con Transbank (como comercio, en [transbank.cl](https://www.transbank.cl)).
2. Completa el proceso de validación que te pida Transbank con la tienda en ambiente de integración.
3. Transbank te entregará tu **código de comercio** y tu **API Key secreta**. Configúralas en Vercel:
   - `WEBPAY_ENVIRONMENT=production`
   - `WEBPAY_COMMERCE_CODE=<tu código de comercio>`
   - `WEBPAY_API_KEY=<tu API Key secreta>`
4. Vuelve a desplegar y haz una compra real de bajo monto para confirmar.

## Correos

Se envían correos al cliente (pedido recibido, pago confirmado, despacho con seguimiento, etc.) y avisos a la tienda (nuevos pedidos y solicitudes) al correo configurado en el panel. Configura un servidor SMTP con `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` y `SMTP_FROM` (sirven Gmail/Google Workspace con contraseña de aplicación, Zoho, Brevo, Resend, etc.). Sin SMTP, la tienda funciona igual pero no envía correos.

## Desarrollo local

Requisitos: Node.js 20.9 o superior y PostgreSQL 16.

```bash
npm install
cp .env.example .env          # completa DATABASE_URL y el resto
npm run db:setup              # migraciones + administrador + catálogo de ejemplo
npm run dev                   # http://localhost:3000 (panel en /admin)
```

Para probar pagos sin conexión a Transbank, usa `WEBPAY_ENVIRONMENT=mock`: el checkout te lleva a un simulador donde eliges aprobar, rechazar, anular o dejar expirar el pago.

### Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilar y ejecutar en modo producción |
| `npm run lint` / `npm run typecheck` | Revisiones de código |
| `npm test` | Pruebas unitarias (RUT, precios, despachos, filtros…) |
| `npm run test:e2e` | Pruebas de punta a punta: compras con Webpay simulado, transferencias y panel. Usan una base de datos de pruebas que se reinicia (`E2E_DATABASE_URL`, por defecto `solisracing_test`) |
| `npm run db:generate` | Genera una migración después de cambiar `src/lib/db/schema.ts` |
| `npm run db:migrate` | Aplica migraciones pendientes |
| `npm run db:seed` | Carga el catálogo de ejemplo si no hay productos |
| `npm run db:studio` | Explorador visual de la base de datos |

## Estructura

```
src/
  app/(tienda)/      Páginas públicas (portada, catálogo, producto, carrito, checkout, pedido…)
  app/admin/         Panel de administración
  app/pago/          Retorno de Webpay y simulador de pagos
  components/        Componentes de la tienda (store/), del panel (admin/) y base (ui/)
  lib/data/          Consultas a la base de datos (las públicas se cachean)
  lib/actions/       Acciones del servidor (checkout, panel, formularios)
  lib/db/            Esquema, datos de ejemplo y conexión
  lib/orders.ts      Pedidos: reserva y devolución de stock, pagos, estados
  lib/payments/      Integración con Webpay Plus
drizzle/             Migraciones SQL
scripts/             Tareas de base de datos (setup, seed, pruebas)
e2e/, tests/unit/    Pruebas
```

## Antes de lanzar

- Reemplaza el logo provisorio (`src/components/logo.tsx` y `src/app/icon.svg`) por el oficial.
- Borra o edita los productos y servicios de ejemplo, y sube fotos reales (idealmente con fondo blanco).
- Completa la configuración de la tienda: razón social, RUT, contacto, datos bancarios y tarifas de despacho.
- Revisa con un asesor los textos de **términos, privacidad y despachos y devoluciones** (son una base general y deben ajustarse a tu empresa).
- Activa Webpay en producción y configura el correo SMTP.

## Ideas para siguientes etapas

Mercado Pago como medio de pago adicional, cuentas de cliente con historial de compras, cupones de descuento, emisión automática de boleta/factura electrónica (SII), cotización de despacho en línea con couriers, reseñas de productos y analítica (Google Analytics / Meta Pixel).
