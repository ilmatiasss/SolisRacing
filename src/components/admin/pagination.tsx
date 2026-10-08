import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

/** Paginación simple: conserva los filtros actuales de la URL. */
export function AdminPagination({
  basePath,
  params,
  page,
  pageCount,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;
  const href = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
    if (target > 1) search.set("pagina", String(target));
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
  };
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm">
      <span className="text-muted">
        Página {page} de {pageCount}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={href(page - 1)} className={buttonClasses({ variant: "outline", size: "sm" })}>
            <ChevronLeft className="size-4" /> Anterior
          </Link>
        )}
        {page < pageCount && (
          <Link href={href(page + 1)} className={buttonClasses({ variant: "outline", size: "sm" })}>
            Siguiente <ChevronRight className="size-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function pageParam(value: string | string[] | undefined) {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function stringParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || undefined;
}
