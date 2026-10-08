import { defineConfig, devices } from "@playwright/test";
import { E2E_ADMIN } from "./e2e/constants";

/**
 * Pruebas end-to-end: levantan la tienda (build de producción) contra una base de datos
 * de pruebas que se reinicia en cada ejecución, con Webpay en modo simulador.
 *
 *   E2E_DATABASE_URL=postgres://usuario:clave@localhost:5432/solisracing_test npm run test:e2e
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const DATABASE_URL = process.env.E2E_DATABASE_URL ?? "postgres://solis:solis@localhost:5432/solisracing_test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "es-CL",
    timezoneId: "America/Santiago",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx tsx scripts/e2e-db.ts && npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL,
      NEXT_DIST_DIR: ".next-e2e",
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
      WEBPAY_ENVIRONMENT: "mock",
      ADMIN_EMAIL: E2E_ADMIN.email,
      ADMIN_PASSWORD: E2E_ADMIN.password,
      AUTH_SECRET: "secreto-solo-para-pruebas-e2e-0123456789",
      SEED_DEMO_DATA: "true",
      SMTP_HOST: "",
      BLOB_READ_WRITE_TOKEN: "",
    },
  },
});
