import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { availablePayments, isWebpayAvailable } = await import("@/lib/payments/webpay");
const { DEFAULT_SETTINGS, hasTransferAccount } = await import("@/lib/settings");

const enabled = { payments: { ...DEFAULT_SETTINGS.payments, webpayEnabled: true, transferEnabled: true } };

describe("Webpay en el sitio publicado", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("no se ofrece en producción con el ambiente de pruebas de Transbank", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("WEBPAY_ENVIRONMENT", "integration");
    expect(isWebpayAvailable()).toBe(false);
    expect(availablePayments(enabled)).toEqual({ webpayEnabled: false, transferEnabled: true });
  });

  it("tampoco con el simulador ni con un valor mal escrito", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    for (const value of ["mock", "Production", ""]) {
      vi.stubEnv("WEBPAY_ENVIRONMENT", value);
      expect(isWebpayAvailable()).toBe(false);
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

describe("datos para transferir", () => {
  it("no muestra la cuenta de ejemplo ni una vacía", () => {
    expect(hasTransferAccount({ transferAccountNumber: "" })).toBe(false);
    expect(hasTransferAccount({ transferAccountNumber: " 00-000-00000-00 " })).toBe(false);
    expect(hasTransferAccount({ transferAccountNumber: "12345678" })).toBe(true);
  });
});
