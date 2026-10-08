import { describe, expect, it } from "vitest";
import {
  discountPercent,
  formatCLP,
  formatOrderNumber,
  normalizeChileanPhone,
  parseCLP,
  parseOrderNumber,
  whatsappLink,
} from "@/lib/format";

describe("formato de pesos chilenos", () => {
  it("formatea montos sin decimales y con puntos de miles", () => {
    expect(formatCLP(1290000)).toBe("$1.290.000");
    expect(formatCLP(4990)).toBe("$4.990");
    expect(formatCLP(0)).toBe("$0");
    expect(formatCLP(999.6)).toBe("$1.000");
  });

  it("interpreta montos escritos a mano", () => {
    expect(parseCLP("$1.290.000")).toBe(1290000);
    expect(parseCLP("249990")).toBe(249990);
    expect(parseCLP(" 49.990 ")).toBe(49990);
    expect(parseCLP("")).toBeNull();
    expect(parseCLP("abc")).toBeNull();
  });

  it("calcula el porcentaje de descuento", () => {
    expect(discountPercent(89990, 99990)).toBe(10);
    expect(discountPercent(100, null)).toBe(0);
    expect(discountPercent(100, 90)).toBe(0);
  });
});

describe("números de pedido", () => {
  it("usa el prefijo SR-", () => {
    expect(formatOrderNumber(1001)).toBe("SR-1001");
  });

  it("acepta distintas formas de escribirlo", () => {
    expect(parseOrderNumber("SR-1001")).toBe(1001);
    expect(parseOrderNumber("sr1001")).toBe(1001);
    expect(parseOrderNumber(" 1001 ")).toBe(1001);
    expect(parseOrderNumber("SR-")).toBeNull();
    expect(parseOrderNumber("pedido 1001")).toBeNull();
  });
});

describe("teléfonos y WhatsApp", () => {
  it("normaliza números chilenos", () => {
    expect(normalizeChileanPhone("+56 9 1234 5678")).toBe("56912345678");
    expect(normalizeChileanPhone("9 1234 5678")).toBe("56912345678");
    expect(normalizeChileanPhone("(2) 2345 6789")).toBe("56223456789");
  });

  it("arma links de WhatsApp con mensaje", () => {
    expect(whatsappLink("+56 9 1234 5678", "Hola, ¿tienen stock?")).toBe(
      "https://wa.me/56912345678?text=Hola%2C%20%C2%BFtienen%20stock%3F",
    );
  });
});
