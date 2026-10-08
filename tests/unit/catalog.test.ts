import { describe, expect, it } from "vitest";
import { parseRichText } from "@/components/rich-text";
import { catalogHref, parseCatalogFilters } from "@/lib/catalog-filters";
import { ORDER_TRANSITIONS } from "@/lib/order-status";
import { buildSearchText, normalizeText, searchTerms, slugify } from "@/lib/text";

describe("textos y búsqueda", () => {
  it("genera slugs sin tildes ni símbolos", () => {
    expect(slugify("Kit Turbo Garrett GT2860")).toBe("kit-turbo-garrett-gt2860");
    expect(slugify("Válvula blow-off  Ñandú & Cía.")).toBe("valvula-blow-off-nandu-cia");
    expect(slugify('Downpipe 3" con catalizador')).toBe("downpipe-3-con-catalizador");
  });

  it("normaliza para buscar sin tildes", () => {
    expect(normalizeText("  ADMISIÓN  ")).toBe("admision");
    expect(buildSearchText(["Filtro K&N", null, "Admisión", "Subaru"])).toBe("filtro k&n admision subaru");
    expect(searchTerms("Válvula   WRX 100%")).toEqual(["valvula", "wrx", "100"]);
  });
});

describe("filtros del catálogo", () => {
  it("interpreta los parámetros de la URL", () => {
    const filters = parseCatalogFilters({
      q: "  frenos ",
      categoria: "frenos",
      auto: "subaru",
      modelo: "wrx",
      anio: "2018",
      oferta: "1",
      orden: "precio-asc",
      pagina: "3",
    });
    expect(filters).toMatchObject({
      q: "frenos",
      categoria: "frenos",
      auto: "subaru",
      modelo: "wrx",
      anio: 2018,
      oferta: true,
      orden: "precio-asc",
      pagina: 3,
    });
  });

  it("descarta valores inválidos", () => {
    const filters = parseCatalogFilters({ categoria: "../../etc", orden: "hack", anio: "dos mil", pagina: "-1", modelo: "wrx" });
    expect(filters.categoria).toBeUndefined();
    expect(filters.orden).toBe("relevancia");
    expect(filters.pagina).toBe(1);
    expect(filters.modelo).toBeUndefined(); // sin marca de auto no hay modelo
  });

  it("arma URLs limpias", () => {
    expect(catalogHref({})).toBe("/productos");
    expect(catalogHref({ categoria: "escape", orden: "relevancia", pagina: 1 })).toBe("/productos?categoria=escape");
    expect(catalogHref({ auto: "subaru", modelo: "wrx", anio: 2018 })).toBe("/productos?auto=subaru&modelo=wrx&anio=2018");
  });
});

describe("descripciones con formato simple", () => {
  it("separa párrafos y listas", () => {
    expect(parseRichText("Intro del producto.\n\n- Punto uno\n- Punto dos\nCierre")).toEqual([
      { type: "p", text: "Intro del producto." },
      { type: "ul", items: ["Punto uno", "Punto dos"] },
      { type: "p", text: "Cierre" },
    ]);
  });

  it("no interpreta HTML", () => {
    expect(parseRichText("<script>alert(1)</script>")).toEqual([{ type: "p", text: "<script>alert(1)</script>" }]);
  });
});

describe("estados de pedido", () => {
  it("no permite reabrir pedidos cancelados", () => {
    expect(ORDER_TRANSITIONS.cancelled).toEqual([]);
  });

  it("un pedido pendiente solo puede pagarse o cancelarse", () => {
    expect(ORDER_TRANSITIONS.pending).toEqual(["paid", "cancelled"]);
  });
});
