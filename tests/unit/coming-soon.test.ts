import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { PREVIEW_SCRIPT, PREVIEW_STORAGE_KEY } from "@/lib/coming-soon";

/** Ejecuta el script real que va en la página y devuelve si quedó <html data-preview>. */
function isPreview(hostname: string, search = "", stored?: string) {
  const store = new Map<string, string>(stored ? [[PREVIEW_STORAGE_KEY, stored]] : []);
  const dataset: Record<string, string> = {};
  runInNewContext(PREVIEW_SCRIPT, {
    document: { documentElement: { dataset } },
    location: { hostname, search },
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    },
    URLSearchParams,
    RegExp,
  });
  return { preview: dataset.preview === "1", stored: store.get(PREVIEW_STORAGE_KEY) };
}

describe("aviso Próximamente: vista previa", () => {
  it("el dominio público ve el aviso", () => {
    expect(isPreview("solisracingparts.cl").preview).toBe(false);
    expect(isPreview("www.solisracingparts.cl").preview).toBe(false);
  });

  it("los dominios de prueba ven la tienda", () => {
    expect(isPreview("solis-racing.vercel.app").preview).toBe(true);
    expect(isPreview("solis-racing-git-rama-equipo.vercel.app").preview).toBe(true);
    expect(isPreview("localhost").preview).toBe(true);
    expect(isPreview("127.0.0.1").preview).toBe(true);
  });

  it("no confunde dominios parecidos", () => {
    expect(isPreview("vercel.app.malo.cl").preview).toBe(false);
    expect(isPreview("notvercel.app").preview).toBe(false);
  });

  it("?preview=1 se guarda y muestra la tienda en el dominio público", () => {
    const first = isPreview("solisracingparts.cl", "?preview=1");
    expect(first).toEqual({ preview: true, stored: "1" });
    expect(isPreview("solisracingparts.cl", "", "1").preview).toBe(true);
  });

  it("?preview=0 muestra el aviso incluso en un dominio de prueba", () => {
    expect(isPreview("solis-racing.vercel.app", "?preview=0")).toEqual({ preview: false, stored: "0" });
    expect(isPreview("localhost", "", "0").preview).toBe(false);
  });
});
