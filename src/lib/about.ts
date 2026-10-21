/*
 * «Quiénes somos»: la persona detrás de la tienda, su historia, algunos logros y proyectos con
 * foto. Se edita en Panel → Quiénes somos y se guarda dentro de la configuración de la tienda.
 */

export type AboutProject = {
  title: string;
  /** Qué se hizo: auto, motor, piezas, resultado. */
  detail: string;
  /** Foto subida desde el panel (Vercel Blob o /uploads en local). */
  image: string;
};

export type AboutSettings = {
  name: string;
  /** Ej: «Fundador · Preparación y programación FuelTech». */
  role: string;
  photo: string;
  /** Historia: párrafos separados por una línea en blanco. */
  story: string;
  /** Logros: uno por línea, `valor | texto` (ej: «+10 | años preparando autos»). */
  highlights: string;
  projects: AboutProject[];
};

export const DEFAULT_ABOUT: AboutSettings = {
  name: "Diego Solis",
  role: "",
  photo: "",
  story: "",
  highlights: "",
  projects: [],
};

export const MAX_PROJECTS = 12;
export const MAX_HIGHLIGHTS = 4;

/**
 * Solo fotos subidas desde el panel (Vercel Blob, el mismo dominio permitido en next.config) o del
 * catálogo del sitio: nada de HTML, otros esquemas ni dominios que next/image no puede mostrar.
 */
const IMAGE_URL = /^(?:https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[\w./-]+|\/(?:uploads|catalogo)\/[\w./-]+)$/;

export function isImageUrl(value: string) {
  return IMAGE_URL.test(value) && !value.includes("..");
}

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/** Proyectos válidos (con foto y título), recortados a largos razonables. */
export function normalizeProjects(raw: unknown): AboutProject[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const value = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
      return { title: text(value.title, 80), detail: text(value.detail, 300), image: text(value.image, 500) };
    })
    .filter((project) => project.title && isImageUrl(project.image))
    .slice(0, MAX_PROJECTS);
}

export type Highlight = { value: string; label: string };

export function parseHighlights(source: string): Highlight[] {
  return source
    .split("\n")
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter(([value, label]) => value && label)
    .map(([value, label]) => ({ value: value.slice(0, 12), label: label.slice(0, 60) }))
    .slice(0, MAX_HIGHLIGHTS);
}

/** Líneas con contenido que no siguen el formato `valor | texto` (para avisar en el panel). */
export function invalidHighlightLines(source: string): string[] {
  return source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      const [value, label] = line.split("|").map((part) => part.trim());
      return !value || !label;
    });
}

export function storyParagraphs(story: string): string[] {
  return story
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/** La sección de la persona se muestra cuando hay al menos historia o foto. */
export function hasOwnerSection(about: AboutSettings) {
  return Boolean(about.story.trim() || isImageUrl(about.photo));
}
