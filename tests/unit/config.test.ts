import { afterEach, describe, expect, it, vi } from "vitest";
import { databaseEnvNames, databaseUrl } from "@/lib/db/url";
import { siteUrl } from "@/lib/site";

describe("conexión a la base de datos", () => {
  it("usa DATABASE_URL y, si falta, POSTGRES_URL", () => {
    expect(databaseUrl({ DATABASE_URL: "postgres://a", POSTGRES_URL: "postgres://b" })).toBe("postgres://a");
    expect(databaseUrl({ POSTGRES_URL: " postgres://b " })).toBe("postgres://b");
  });

  it("acepta el prefijo que agrega Vercel al conectar la base de datos", () => {
    expect(databaseUrl({ STORAGE_DATABASE_URL_UNPOOLED: "postgres://directa", STORAGE_DATABASE_URL: "postgres://pool" })).toBe(
      "postgres://pool",
    );
    expect(databaseUrl({ NEON_POSTGRES_URL: "postgres://neon" })).toBe("postgres://neon");
  });

  it("ignora la base de datos de las pruebas e2e y los valores vacíos", () => {
    expect(databaseUrl({ E2E_DATABASE_URL: "postgres://test" })).toBeUndefined();
    expect(databaseUrl({ DATABASE_URL: "  " })).toBeUndefined();
  });

  it("lista solo los nombres de las variables relacionadas", () => {
    expect(databaseEnvNames({ PGHOST: "h", DATABASE_URL_UNPOOLED: "x", HOME: "/root", POSTGRES_USER: "" })).toEqual([
      "DATABASE_URL_UNPOOLED",
      "PGHOST",
    ]);
  });
});

describe("URL del sitio", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("usa NEXT_PUBLIC_SITE_URL sin la barra final", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.tienda.cl/");
    expect(siteUrl()).toBe("https://www.tienda.cl");
  });

  it("agrega https:// si la variable viene sin protocolo", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "solisracing.vercel.app");
    expect(siteUrl()).toBe("https://solisracing.vercel.app");
  });

  it("usa el dominio de producción de Vercel si no hay una URL válida", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "solis-racing.vercel.app");
    expect(siteUrl()).toBe("https://solis-racing.vercel.app");
  });
});
