/** Filtros del catálogo, compartidos entre la URL (/productos?…) y las consultas. */

export const SORT_OPTIONS = {
  relevancia: "Más relevantes",
  nuevos: "Más nuevos",
  "precio-asc": "Precio: menor a mayor",
  "precio-desc": "Precio: mayor a menor",
  nombre: "Nombre A-Z",
} as const;

export type SortOption = keyof typeof SORT_OPTIONS;

export type CatalogFilters = {
  q?: string;
  categoria?: string;
  marca?: string;
  /** Marca del auto (slug). */
  auto?: string;
  /** Modelo del auto (slug). */
  modelo?: string;
  anio?: number;
  oferta?: boolean;
  stock?: boolean;
  orden: SortOption;
  pagina: number;
};

export const PAGE_SIZE = 24;

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed.slice(0, 100) : undefined;
}

function slugParam(value: string | string[] | undefined): string | undefined {
  const raw = first(value);
  return raw && /^[a-z0-9-]+$/.test(raw) ? raw : undefined;
}

export function parseCatalogFilters(searchParams: SearchParams): CatalogFilters {
  const year = Number(first(searchParams.anio));
  const page = Number(first(searchParams.pagina));
  const sort = first(searchParams.orden);
  const auto = slugParam(searchParams.auto);
  return {
    q: first(searchParams.q),
    categoria: slugParam(searchParams.categoria),
    marca: slugParam(searchParams.marca),
    auto,
    modelo: auto ? slugParam(searchParams.modelo) : undefined,
    anio: auto && Number.isInteger(year) && year > 1950 && year < 2100 ? year : undefined,
    oferta: first(searchParams.oferta) === "1" || undefined,
    stock: first(searchParams.stock) === "1" || undefined,
    orden: sort && sort in SORT_OPTIONS ? (sort as SortOption) : "relevancia",
    pagina: Number.isInteger(page) && page > 1 ? Math.min(page, 500) : 1,
  };
}

/** Construye la URL del catálogo con los filtros dados (omite valores por defecto). */
export function catalogHref(filters: Partial<CatalogFilters>): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.categoria) params.set("categoria", filters.categoria);
  if (filters.marca) params.set("marca", filters.marca);
  if (filters.auto) params.set("auto", filters.auto);
  if (filters.auto && filters.modelo) params.set("modelo", filters.modelo);
  if (filters.auto && filters.anio) params.set("anio", String(filters.anio));
  if (filters.oferta) params.set("oferta", "1");
  if (filters.stock) params.set("stock", "1");
  if (filters.orden && filters.orden !== "relevancia") params.set("orden", filters.orden);
  if (filters.pagina && filters.pagina > 1) params.set("pagina", String(filters.pagina));
  const query = params.toString();
  return query ? `/productos?${query}` : "/productos";
}
