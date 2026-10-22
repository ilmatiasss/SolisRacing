import { describe, expect, it } from "vitest";
import { isLiveSite } from "@/lib/deploy";

describe("sitio publicado", () => {
  it("en Vercel manda VERCEL_ENV", () => {
    expect(isLiveSite({ VERCEL_ENV: "production", NODE_ENV: "production" })).toBe(true);
    expect(isLiveSite({ VERCEL_ENV: "preview", NODE_ENV: "production" })).toBe(false);
  });

  it("en otro hosting se puede fijar con APP_ENV", () => {
    expect(isLiveSite({ APP_ENV: "production", NODE_ENV: "production" })).toBe(true);
    expect(isLiveSite({ APP_ENV: "Preview", NODE_ENV: "production" })).toBe(false);
    expect(isLiveSite({ APP_ENV: "test", NODE_ENV: "production" })).toBe(false);
  });

  it("sin indicaciones, un servidor de producción cuenta como sitio publicado (protege a los clientes)", () => {
    expect(isLiveSite({ NODE_ENV: "production" })).toBe(true);
    expect(isLiveSite({ NODE_ENV: "development" })).toBe(false);
  });
});
