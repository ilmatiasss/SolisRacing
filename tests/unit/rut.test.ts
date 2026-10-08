import { describe, expect, it } from "vitest";
import { cleanRut, computeRutVerifier, formatRut, isValidRut } from "@/lib/rut";

describe("RUT chileno", () => {
  it("calcula el dígito verificador (incluye K y 0)", () => {
    expect(computeRutVerifier("11111111")).toBe("1");
    expect(computeRutVerifier("12345678")).toBe("5");
    expect(computeRutVerifier("10000013")).toBe("K");
    expect(computeRutVerifier("76086428")).toBe("5");
  });

  it("valida RUT con o sin formato", () => {
    expect(isValidRut("12.345.678-5")).toBe(true);
    expect(isValidRut("123456785")).toBe(true);
    expect(isValidRut("12345678-5")).toBe(true);
    expect(isValidRut("10.000.013-k")).toBe(true);
    expect(isValidRut("12.345.678-9")).toBe(false);
    expect(isValidRut("1-9")).toBe(false);
    expect(isValidRut("abc")).toBe(false);
    expect(isValidRut("")).toBe(false);
  });

  it("formatea con puntos y guion", () => {
    expect(formatRut("123456785")).toBe("12.345.678-5");
    expect(formatRut("10000013k")).toBe("10.000.013-K");
    expect(formatRut(" 7.654.321-6 ")).toBe("7.654.321-6");
    expect(cleanRut("12.345.678-k")).toBe("12345678K");
  });
});
