import { describe, expect, it } from "vitest";
import { PRIVACY_RESPONSE_DAYS, PRIVACY_RIGHTS, privacyDeadline, privacyRightLabel } from "@/lib/privacy";
import { inquiryTitle } from "@/lib/order-status";

describe("protección de datos", () => {
  it("incluye los seis derechos de la Ley 21.719", () => {
    expect(PRIVACY_RIGHTS.map((right) => right.value)).toEqual([
      "acceso",
      "rectificacion",
      "supresion",
      "oposicion",
      "portabilidad",
      "bloqueo",
    ]);
    expect(privacyRightLabel("supresion")).toBe("Supresión");
  });

  it("calcula la fecha límite de respuesta en días corridos", () => {
    const received = new Date("2026-12-01T15:00:00Z");
    expect(PRIVACY_RESPONSE_DAYS).toBe(30);
    expect(privacyDeadline(received).toISOString()).toBe("2026-12-31T15:00:00.000Z");
  });

  it("titula las solicitudes de derechos con el derecho pedido", () => {
    expect(inquiryTitle("privacy", "Acceso")).toBe("Derechos sobre datos personales: Acceso");
    expect(inquiryTitle("harness", null)).toBe("Cotización de ramal");
  });
});
