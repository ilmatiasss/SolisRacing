/** Quita tildes y pasa a minúsculas: "Válvula Blow-Off" → "valvula blow-off". */
export function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Genera un slug para URLs: "Kit Turbo Garrett GT2860" → "kit-turbo-garrett-gt2860". */
export function slugify(input: string): string {
  return normalizeText(input)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Texto indexable para la búsqueda sin tildes del catálogo. */
export function buildSearchText(parts: Array<string | null | undefined>): string {
  return normalizeText(parts.filter(Boolean).join(" ")).replace(/\s+/g, " ");
}

/** Separa la búsqueda en términos (máximo 6) para buscarlos todos. */
export function searchTerms(query: string): string[] {
  return normalizeText(query)
    .split(/\s+/)
    .map((term) => term.replace(/[%_\\]/g, ""))
    .filter((term) => term.length > 0)
    .slice(0, 6);
}

export function truncate(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max - 1).trimEnd()}…`;
}
