import { describe, expect, it } from "vitest";
import {
  addDays,
  availableTimes,
  DEFAULT_BOOKING,
  describeWeekdays,
  formatBookingDate,
  formatMonth,
  groupTimes,
  isDayOffered,
  monthGrid,
  normalizeBookingConfig,
  normalizeTime,
  parseServiceLocations,
  shiftMonth,
  todayInChile,
  weekday,
  weeklyLocation,
  type BookingLocation,
} from "@/lib/booking";
import { mergeSettings } from "@/lib/settings";

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

  it("un lugar semanal atiende desde mañana, hasta el máximo de días y solo en sus días", () => {
    const today = "2026-10-10";
    const antofagasta = weeklyLocation("Antofagasta");
    expect(isDayOffered(antofagasta, "2026-10-10", today, 60)).toBe(false); // hoy
    expect(isDayOffered(antofagasta, "2026-10-12", today, 60)).toBe(true); // lunes
    expect(isDayOffered(antofagasta, "2026-10-11", today, 60)).toBe(false); // domingo
    expect(isDayOffered(antofagasta, "2026-12-09", today, 60)).toBe(true); // día 60
    expect(isDayOffered(antofagasta, addDays(today, 61), today, 60)).toBe(false);
    expect(isDayOffered(antofagasta, "2026-02-30", today, 60)).toBe(false);
    expect(isDayOffered({ ...antofagasta, blocked: ["2026-10-12"] }, "2026-10-12", today, 60)).toBe(false);
  });

  it("un lugar de visitas solo atiende en sus fechas", () => {
    const today = "2026-10-10";
    const valparaiso: BookingLocation = { ...weeklyLocation("Región de Valparaíso"), mode: "dates", dates: ["2026-10-20", "2026-10-25"] };
    expect(isDayOffered(valparaiso, "2026-10-20", today, 60)).toBe(true);
    expect(isDayOffered(valparaiso, "2026-10-25", today, 60)).toBe(true); // domingo, pero es fecha de visita
    expect(isDayOffered(valparaiso, "2026-10-21", today, 60)).toBe(false);
  });

  it("no vuelve a ofrecer horas ya pedidas en ese lugar y día", () => {
    const today = "2026-10-10";
    const antofagasta = weeklyLocation("Antofagasta");
    const taken = [
      { location: "Antofagasta", date: "2026-10-12", time: "10:00" },
      { location: "Región de Valparaíso", date: "2026-10-12", time: "11:00" },
      { location: "Antofagasta", date: "2026-10-13", time: "12:00" },
    ];
    expect(availableTimes(antofagasta, "2026-10-12", today, 60, taken)).toEqual(["11:00", "12:00", "15:00", "16:00", "17:00"]);
    expect(availableTimes(antofagasta, "2026-10-11", today, 60, taken)).toEqual([]);
    const full = antofagasta.times.map((time) => ({ location: "Antofagasta", date: "2026-10-14", time }));
    expect(availableTimes(antofagasta, "2026-10-14", today, 60, full)).toEqual([]);
  });

  it("limpia la configuración guardada", () => {
    const config = normalizeBookingConfig({
      maxDays: 500,
      locations: [
        { name: " Antofagasta ", mode: "weekly", weekdays: [6, 1, 1, 9], times: ["9:30", "15:00", "25:00", "x"], dates: [], blocked: ["2026-13-01", "2026-12-25"] },
        { name: "Antofagasta", mode: "dates" },
        { name: "", mode: "dates" },
      ],
    });
    expect(config.maxDays).toBe(180);
    expect(config.locations).toEqual([
      { name: "Antofagasta", detail: "", mode: "weekly", weekdays: [1, 6], times: ["09:30", "15:00"], dates: [], blocked: ["2026-12-25"] },
    ]);
    expect(normalizeBookingConfig(null)).toEqual(DEFAULT_BOOKING);
    expect(normalizeTime("7:05")).toBe("07:05");
    expect(normalizeTime("24:00")).toBeNull();
  });

  it("pasa los lugares guardados en el formato antiguo a la agenda nueva", () => {
    const settings = mergeSettings({ serviceLocations: "Calama | Taller asociado\nAntofagasta" });
    expect(settings.booking.locations.map((location) => [location.name, location.detail, location.mode])).toEqual([
      ["Calama", "Taller asociado", "weekly"],
      ["Antofagasta", "", "weekly"],
    ]);
    expect(mergeSettings({}).booking).toEqual(DEFAULT_BOOKING);
  });

  it("describe los días y separa mañana y tarde", () => {
    expect(describeWeekdays([1, 2, 3, 4, 5, 6])).toBe("lunes a sábado");
    expect(describeWeekdays([2, 4])).toBe("martes y jueves");
    expect(describeWeekdays([1, 3, 5])).toBe("lunes, miércoles y viernes");
    expect(groupTimes(["10:00", "13:30", "15:00"])).toEqual([
      { label: "Mañana", times: ["10:00", "13:30"] },
      { label: "Tarde", times: ["15:00"] },
    ]);
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
