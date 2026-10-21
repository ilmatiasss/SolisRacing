import { describe, expect, it } from "vitest";
import {
  hasOwnerSection,
  invalidHighlightLines,
  isImageUrl,
  normalizeProjects,
  parseHighlights,
  storyParagraphs,
  DEFAULT_ABOUT,
} from "@/lib/about";
import { mergeSettings } from "@/lib/settings";

describe("Quiénes somos", () => {
  it("acepta solo fotos subidas o del catálogo", () => {
    expect(isImageUrl("https://abc.public.blob.vercel-storage.com/productos/2026/x.webp")).toBe(true);
    expect(isImageUrl("/uploads/productos/2026/x.webp")).toBe(true);
    expect(isImageUrl("/catalogo/fueltech-ft550.webp")).toBe(true);
    expect(isImageUrl("javascript:alert(1)")).toBe(false);
    expect(isImageUrl("/uploads/../.env")).toBe(false);
    expect(isImageUrl('https://x.cl/a.webp" onerror="x')).toBe(false);
    expect(isImageUrl("https://otro-sitio.cl/foto.webp")).toBe(false);
  });

  it("deja los proyectos con foto y título, recortados y como máximo 12", () => {
    const projects = normalizeProjects([
      { title: "  Skyline R34 ", detail: "FT600", image: "/uploads/a.webp" },
      { title: "", detail: "sin título", image: "/uploads/b.webp" },
      { title: "Sin foto", image: "" },
      "basura",
      ...Array.from({ length: 20 }, (_, i) => ({ title: `Auto ${i}`, image: "/catalogo/x.webp" })),
    ]);
    expect(projects[0]).toEqual({ title: "Skyline R34", detail: "FT600", image: "/uploads/a.webp" });
    expect(projects).toHaveLength(12);
    expect(normalizeProjects("no es lista")).toEqual([]);
  });

  it("lee los logros «valor | texto» y avisa las líneas mal escritas", () => {
    expect(parseHighlights("+10 | años preparando autos\n\n+300 | autos programados")).toEqual([
      { value: "+10", label: "años preparando autos" },
      { value: "+300", label: "autos programados" },
    ]);
    expect(invalidHighlightLines("+10 | años\nsolo texto\n | sin valor")).toEqual(["solo texto", "| sin valor"]);
  });

  it("separa la historia en párrafos por línea en blanco", () => {
    expect(storyParagraphs("Uno\nsigue\n\n  Dos  \n\n\n")).toEqual(["Uno\nsigue", "Dos"]);
  });

  it("muestra la sección de la persona solo con historia o foto", () => {
    expect(hasOwnerSection(DEFAULT_ABOUT)).toBe(false);
    expect(hasOwnerSection({ ...DEFAULT_ABOUT, story: "Hola" })).toBe(true);
    expect(hasOwnerSection({ ...DEFAULT_ABOUT, photo: "/uploads/yo.webp" })).toBe(true);
  });

  it("la configuración guardada sin «about» toma los valores por defecto y limpia proyectos inválidos", () => {
    expect(mergeSettings({}).about).toEqual(DEFAULT_ABOUT);
    const merged = mergeSettings({ about: { name: "Diego", projects: [{ title: "A", image: "x" }] } });
    expect(merged.about.name).toBe("Diego");
    expect(merged.about.projects).toEqual([]);
  });
});
