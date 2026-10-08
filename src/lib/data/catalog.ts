import "server-only";
import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  gt,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  gte,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { PAGE_SIZE, type CatalogFilters } from "../catalog-filters";
import { db } from "../db";
import {
  brands,
  categories,
  productFitments,
  productImages,
  products,
  services,
  vehicleMakes,
  vehicleModels,
} from "../db/schema";
import { searchTerms } from "../text";

export const CATALOG_TAG = "catalog";
export const SERVICES_TAG = "services";

export type ProductCardData = {
  id: number;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  universal: boolean;
  brandName: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
};

export type CategoryData = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  productCount: number;
};

export type VehicleMakeData = {
  id: number;
  name: string;
  slug: string;
  models: { id: number; name: string; slug: string }[];
};

/* --------------------------------- Helpers -------------------------------- */

const cardColumns = {
  id: products.id,
  name: products.name,
  slug: products.slug,
  price: products.price,
  compareAtPrice: products.compareAtPrice,
  stock: products.stock,
  universal: products.universal,
  brandName: brands.name,
  categoryName: categories.name,
  categoryIcon: categories.icon,
};

type CardRow = Omit<ProductCardData, "imageUrl" | "imageAlt">;

async function attachMainImages(rows: CardRow[]): Promise<ProductCardData[]> {
  if (rows.length === 0) return [];
  const images = await db
    .select({ productId: productImages.productId, url: productImages.url, alt: productImages.alt })
    .from(productImages)
    .where(
      inArray(
        productImages.productId,
        rows.map((row) => row.id),
      ),
    )
    .orderBy(asc(productImages.sortOrder), asc(productImages.id));
  const mainImage = new Map<number, { url: string; alt: string | null }>();
  for (const image of images) {
    if (!mainImage.has(image.productId)) mainImage.set(image.productId, image);
  }
  return rows.map((row) => ({
    ...row,
    imageUrl: mainImage.get(row.id)?.url ?? null,
    imageAlt: mainImage.get(row.id)?.alt ?? null,
  }));
}

function cardQuery() {
  return db
    .select(cardColumns)
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(categories, eq(products.categoryId, categories.id));
}

const isActive = eq(products.status, "active");

/* --------------------------------- Lecturas -------------------------------- */

export async function getCategories(): Promise<CategoryData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  const productCount = sql<number>`count(${products.id}) filter (where ${products.status} = 'active')`.mapWith(
    Number,
  );
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      icon: categories.icon,
      productCount,
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function getBrands() {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  return db
    .select({ id: brands.id, name: brands.name, slug: brands.slug })
    .from(brands)
    .where(exists(db.select({ one: sql`1` }).from(products).where(and(eq(products.brandId, brands.id), isActive))))
    .orderBy(asc(brands.name));
}

/** Marcas y modelos de autos para el buscador "Encuentra repuestos para tu auto". */
export async function getVehicleTree(): Promise<VehicleMakeData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  const makes = await db.query.vehicleMakes.findMany({
    orderBy: [asc(vehicleMakes.name)],
    with: {
      models: {
        columns: { id: true, name: true, slug: true },
        orderBy: [asc(vehicleModels.name)],
      },
    },
  });
  return makes.map((make) => ({ id: make.id, name: make.name, slug: make.slug, models: make.models }));
}

export async function getFeaturedProducts(limit = 8) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  const rows = await cardQuery()
    .where(and(isActive, eq(products.featured, true)))
    .orderBy(desc(gt(products.stock, 0)), desc(products.createdAt))
    .limit(limit);
  return attachMainImages(rows);
}

export async function getOnSaleProducts(limit = 8) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  const rows = await cardQuery()
    .where(and(isActive, isNotNull(products.compareAtPrice), gt(products.compareAtPrice, products.price)))
    .orderBy(desc(gt(products.stock, 0)), desc(products.createdAt))
    .limit(limit);
  return attachMainImages(rows);
}

export async function getLatestProducts(limit = 8) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  const rows = await cardQuery().where(isActive).orderBy(desc(products.createdAt)).limit(limit);
  return attachMainImages(rows);
}

export type CatalogResult = {
  products: ProductCardData[];
  total: number;
  page: number;
  pageCount: number;
  vehicle: { make: string; model: string | null; year: number | null } | null;
};

export async function searchProducts(filters: CatalogFilters): Promise<CatalogResult> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const conditions: SQL[] = [isActive];
  let vehicleFilter: SQL | undefined;
  let vehicle: CatalogResult["vehicle"] = null;

  if (filters.categoria) {
    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, filters.categoria));
    conditions.push(category ? eq(products.categoryId, category.id) : sql`false`);
  }
  if (filters.marca) {
    const [brand] = await db.select({ id: brands.id }).from(brands).where(eq(brands.slug, filters.marca));
    conditions.push(brand ? eq(products.brandId, brand.id) : sql`false`);
  }
  for (const term of searchTerms(filters.q ?? "")) {
    conditions.push(ilike(products.searchText, `%${term}%`));
  }
  if (filters.stock) conditions.push(gt(products.stock, 0));
  if (filters.oferta) {
    conditions.push(isNotNull(products.compareAtPrice), gt(products.compareAtPrice, products.price));
  }

  if (filters.auto) {
    const make = await db.query.vehicleMakes.findFirst({
      where: eq(vehicleMakes.slug, filters.auto),
      with: { models: { columns: { id: true, name: true, slug: true } } },
    });
    const model = make?.models.find((m) => m.slug === filters.modelo);
    const modelIds = model ? [model.id] : (make?.models.map((m) => m.id) ?? []);
    if (!make || modelIds.length === 0) {
      conditions.push(sql`false`);
    } else {
      vehicle = { make: make.name, model: model?.name ?? null, year: filters.anio ?? null };
      const fitmentConditions: SQL[] = [
        eq(productFitments.productId, products.id),
        inArray(productFitments.modelId, modelIds),
      ];
      if (filters.anio) {
        fitmentConditions.push(
          or(isNull(productFitments.yearFrom), lte(productFitments.yearFrom, filters.anio))!,
          or(isNull(productFitments.yearTo), gte(productFitments.yearTo, filters.anio))!,
        );
      }
      vehicleFilter = exists(
        db
          .select({ one: sql`1` })
          .from(productFitments)
          .where(and(...fitmentConditions)),
      );
      // Los productos universales también sirven, pero se muestran después de los específicos.
      conditions.push(or(vehicleFilter, eq(products.universal, true))!);
    }
  }

  const where = and(...conditions);
  const [{ total }] = await db.select({ total: count() }).from(products).where(where);

  const orderBy: SQL[] = [];
  if (vehicleFilter) orderBy.push(desc(vehicleFilter));
  switch (filters.orden) {
    case "precio-asc":
      orderBy.push(asc(products.price));
      break;
    case "precio-desc":
      orderBy.push(desc(products.price));
      break;
    case "nuevos":
      orderBy.push(desc(products.createdAt));
      break;
    case "nombre":
      orderBy.push(asc(products.name));
      break;
    default:
      orderBy.push(desc(gt(products.stock, 0)), desc(products.featured), desc(products.createdAt));
  }
  orderBy.push(asc(products.id));

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.pagina, pageCount);
  const rows = await cardQuery()
    .where(where)
    .orderBy(...orderBy)
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  return { products: await attachMainImages(rows), total, page, pageCount, vehicle };
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  const product = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), isActive),
    columns: { searchText: false },
    with: {
      brand: { columns: { name: true, slug: true } },
      category: { columns: { name: true, slug: true, icon: true } },
      images: {
        columns: { id: true, url: true, alt: true },
        orderBy: [asc(productImages.sortOrder), asc(productImages.id)],
      },
      fitments: {
        columns: { id: true, yearFrom: true, yearTo: true, notes: true },
        with: {
          model: {
            columns: { name: true, slug: true },
            with: { make: { columns: { name: true, slug: true } } },
          },
        },
      },
    },
  });
  if (!product) return null;
  const fitments = [...product.fitments].sort(
    (a, b) =>
      a.model.make.name.localeCompare(b.model.make.name) ||
      a.model.name.localeCompare(b.model.name) ||
      (a.yearFrom ?? 0) - (b.yearFrom ?? 0),
  );
  return { ...product, fitments };
}

export async function getRelatedProducts(productId: number, categoryId: number | null, limit = 4) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  if (!categoryId) return [];
  const rows = await cardQuery()
    .where(and(isActive, eq(products.categoryId, categoryId), ne(products.id, productId)))
    .orderBy(desc(gt(products.stock, 0)), desc(products.featured), desc(products.createdAt))
    .limit(limit);
  return attachMainImages(rows);
}

export async function getActiveServices() {
  "use cache";
  cacheLife("hours");
  cacheTag(SERVICES_TAG);
  return db
    .select({
      id: services.id,
      name: services.name,
      slug: services.slug,
      summary: services.summary,
      description: services.description,
      priceFrom: services.priceFrom,
      duration: services.duration,
      icon: services.icon,
    })
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.sortOrder), asc(services.name));
}

/** Datos para el sitemap. */
export async function getSitemapEntries() {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  const [productRows, categoryRows] = await Promise.all([
    db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(isActive),
    db.select({ slug: categories.slug, updatedAt: categories.updatedAt }).from(categories),
  ]);
  return { products: productRows, categories: categoryRows };
}
