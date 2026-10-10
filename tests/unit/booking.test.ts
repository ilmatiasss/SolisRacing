import { describe, expect, it } from "vitest";
import {
  addDays,
  formatBookingDate,
  formatMonth,
  isBookableDate,
  monthGrid,
  parseServiceLocations,
  shiftMonth,
  todayInChile,
  weekday,
} from "@/lib/booking";

describe("agenda de servicios", () => {
  it("usa la fecha de Chile, no la del servidor", () => {
    // 02:30 UTC del 10 de octubre = 23:30 del 9 de octubre en Chile (UTC-3).
    expect(todayInChile(new Date("2026-10-10T02:30:00Z"))).toBe("2026-10-09");
  });

  it("calcula días y semanas sin errores de zona horaria", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(weekday("2026-10-11")).toBe(0);
    expect(formatBookingDate("2026-10-17")).toBe("sábado, 17 de octubre");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(formatMonth("2026-10")).toBe("Octubre de 2026");
  });

  it("solo deja pedir desde mañana, hasta 60 días y nunca en domingo", () => {
    const today = "2026-10-10";
    expect(isBookableDate("2026-10-10", today)).toBe(false);
    expect(isBookableDate("2026-10-12", today)).toBe(true);
    expect(isBookableDate("2026-10-11", today)).toBe(false);
    expect(isBookableDate("2026-12-09", today)).toBe(true); // día 60, miércoles
    expect(isBookableDate(addDays(today, 61), today)).toBe(false);
    expect(isBookableDate("2026-02-30", today)).toBe(false);
  });

  it("arma el mes partiendo en lunes", () => {
    const grid = monthGrid("2026-10");
    expect(grid.slice(0, 4)).toEqual([null, null, null, "2026-10-01"]);
    expect(grid.filter(Boolean)).toHaveLength(31);
  });

  it("lee los lugares del panel", () => {
    expect(parseServiceLocations("Antofagasta | En la tienda\n\nRegión de Valparaíso\nAntofagasta")).toEqual([
      { name: "Antofagasta", detail: "En la tienda" },
      { name: "Región de Valparaíso", detail: "" },
    ]);
  });
});
