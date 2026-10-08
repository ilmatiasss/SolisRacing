<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Proyecto: tienda Solis Racing Parts

Ecommerce para Chile (partes de performance para autos + seteos). La interfaz va en **español de Chile**; precios en CLP enteros con IVA incluido.

- **Datos públicos cacheados**: las lecturas de `src/lib/data/catalog.ts` y `settings.ts` usan `"use cache"` + `cacheTag`. Tras modificar datos, en Server Actions llama `updateTag(CATALOG_TAG | SERVICES_TAG | SETTINGS_TAG)`; en Route Handlers usa `revalidateTag(tag, "max")`.
- **Panel** (`src/app/admin/(panel)`): cada página hace `await requireAdmin()` y exporta `instant = false`; cada acción en `src/lib/actions/admin/*` empieza con `requireAdmin()`.
- **Pedidos y stock**: usa siempre las funciones de `src/lib/orders.ts` (reservan y devuelven stock en transacciones). Nunca confíes en precios enviados por el navegador.
- **Formularios**: se envían con `onSubmit` + `startTransition(() => action(formData))` para no perder lo escrito si hay errores de validación.
- **Base de datos**: Drizzle (`src/lib/db/schema.ts`). Tras cambiar el esquema ejecuta `npm run db:generate` y commitea la migración nueva; no edites migraciones ya aplicadas.
- **Entorno local** (por ejemplo en un contenedor): instala PostgreSQL, crea un usuario/BD, copia `.env.example` a `.env` con `WEBPAY_ENVIRONMENT=mock` y ejecuta `npm run db:setup`.
- **Verificación**: `npm run lint`, `npm run typecheck`, `npm test` y `npm run test:e2e` (si Chromium viene preinstalado, define `PLAYWRIGHT_CHROMIUM_EXECUTABLE`).
