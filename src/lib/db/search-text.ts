import { eq, inArray } from "drizzle-orm";
import { buildSearchText } from "../text";
import type { Database } from "./index";
import { products } from "./schema";

/**
 * Recalcula el texto de búsqueda (sin tildes) de los productos indicados, incluyendo
 * marca, categoría y los autos compatibles. Sin ids, recalcula todo el catálogo.
 */
export async function rebuildProductSearchText(db: Database, productIds?: number[]) {
  if (productIds && productIds.length === 0) return;
  const rows = await db.query.products.findMany({
    where: productIds ? inArray(products.id, productIds) : undefined,
    columns: { id: true, name: true, sku: true, shortDescription: true },
    with: {
      brand: { columns: { name: true } },
      category: { columns: { name: true } },
      fitments: {
        columns: { id: true },
        with: { model: { columns: { name: true }, with: { make: { columns: { name: true } } } } },
      },
    },
  });
  for (const row of rows) {
    const searchText = buildSearchText([
      row.name,
      row.sku,
      row.shortDescription,
      row.brand?.name,
      row.category?.name,
      ...row.fitments.flatMap((fitment) => [fitment.model.make.name, fitment.model.name]),
    ]);
    await db.update(products).set({ searchText }).where(eq(products.id, row.id));
  }
}
