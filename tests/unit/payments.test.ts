import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { availablePayments, isWebpayAvailable, isWebpaySandboxForAdmins } = await import("@/lib/payments/webpay");
const { DEFAULT_SETTINGS } = await import("@/lib/settings");

const enabled = { payments: { ...DEFAULT_SETTINGS.payments, webpayEnabled: true } };

describe("Webpay en el sitio publicado", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("en producción con el ambiente de pruebas no se ofrece a clientes, solo a administradores", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("WEBPAY_ENVIRONMENT", "integration");
    expect(isWebpayAvailable()).toBe(false);
    expect(availablePayments(enabled)).toEqual({ webpayEnabled: false });
    expect(isWebpaySandboxForAdmins()).toBe(true);
    expect(availablePayments(enabled, { admin: true })).toEqual({ webpayEnabled: true });
  });

  it("tampoco con el simulador ni con un valor mal escrito", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    for (const value of ["mock", "Production", ""]) {
      vi.stubEnv("WEBPAY_ENVIRONMENT", value);
      expect(isWebpayAvailable()).toBe(false);
      // Un valor mal escrito cae en «integration»: el administrador puede probar; el simulador, nunca.
      expect(isWebpayAvailable({ admin: true })).toBe(value !== "mock");
    }
  });

  it("se ofrece en producción solo con código de comercio y API Key", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("WEBPAY_ENVIRONMENT", "production");
    vi.stubEnv("WEBPAY_COMMERCE_CODE", "");
    vi.stubEnv("WEBPAY_API_KEY", "");
    expect(isWebpayAvailable()).toBe(false);
    vi.stubEnv("WEBPAY_COMMERCE_CODE", "597000000000");
    vi.stubEnv("WEBPAY_API_KEY", "clave");
    expect(isWebpayAvailable()).toBe(true);
  });

  it("en desarrollo y vistas previas sigue disponible el modo de pruebas", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("WEBPAY_ENVIRONMENT", "integration");
    expect(isWebpayAvailable()).toBe(true);
  });

  it("respeta lo desactivado en el panel", () => {
    vi.stubEnv("VERCEL_ENV", "");
    expect(availablePayments({ payments: { ...enabled.payments, webpayEnabled: false } }).webpayEnabled).toBe(false);
  });
});
