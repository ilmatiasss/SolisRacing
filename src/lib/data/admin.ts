import "server-only";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, sql, sum, type SQL } from "drizzle-orm";
import { db } from "../db";
import {
  adminUsers,
  brands,
  categories,
  inquiries,
  orders,
  productFitments,
  productImages,
  products,
  services,
  vehicleMakes,
  vehicleModels,
  type InquiryStatus,
  type OrderStatus,
  type PaymentMethod,
  type ProductStatus,
} from "../db/schema";
import { searchTerms } from "../text";

export const ADMIN_PAGE_SIZE = 25;

const PAID_STATUSES: OrderStatus[] = ["paid", "processing", "shipped", "delivered"];

export async function getNavCounts() {
  const [[ordersRow], [inquiriesRow]] = await Promise.all([
    db
      .select({ value: count() })
      .from(orders)
      .where(
        or(
          inArray(orders.status, ["paid", "processing"]),
          and(eq(orders.status, "pending"), eq(orders.paymentMethod, "transfer")),
        ),
      ),
    db.select({ value: count() }).from(inquiries).where(eq(inquiries.status, "new")),
  ]);
  return { orders: ordersRow?.value ?? 0, inquiries: inquiriesRow?.value ?? 0 };
}

export async function getDashboardData() {
  const now = new Date();
  // Inicio del mes en hora de Chile (aprox.: se usa UTC-3/UTC-4 vía la base de datos).
  const monthStart = sql`date_trunc('month', now() at time zone 'America/Santiago') at time zone 'America/Santiago'`;
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [[month], [last30Row], statusCounts, recentOrders, lowStock, newInquiries] = await Promise.all([
    db
      .select({ total: sum(orders.total).mapWith(Number), orders: count() })
      .from(orders)
      .where(and(inArray(orders.status, PAID_STATUSES), gte(orders.paidAt, monthStart))),
    db
      .select({ total: sum(orders.total).mapWith(Number), orders: count() })
      .from(orders)
      .where(and(inArray(orders.status, PAID_STATUSES), gte(orders.paidAt, last30))),
    db.select({ status: orders.status, paymentMethod: orders.paymentMethod, value: count() }).from(orders).groupBy(orders.status, orders.paymentMethod),
    db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        total: orders.total,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        deliveryMethod: orders.deliveryMethod,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(8),
    db
      .select({ id: products.id, name: products.name, sku: products.sku, stock: products.stock })
      .from(products)
      .where(and(eq(products.status, "active"), lte(products.stock, 3)))
      .orderBy(asc(products.stock), asc(products.name))
      .limit(8),
    db
      .select({
        id: inquiries.id,
        name: inquiries.name,
        serviceName: inquiries.serviceName,
        kind: inquiries.kind,
        createdAt: inquiries.createdAt,
      })
      .from(inquiries)
      .where(eq(inquiries.status, "new"))
      .orderBy(desc(inquiries.createdAt))
      .limit(5),
  ]);

  const countBy = (predicate: (row: (typeof statusCounts)[number]) => boolean) =>
    statusCounts.filter(predicate).reduce((acc, row) => acc + row.value, 0);

  return {
    monthSales: month?.total ?? 0,
    monthOrders: month?.orders ?? 0,
    last30Sales: last30Row?.total ?? 0,
    toShip: countBy((row) => row.status === "paid" || row.status === "processing"),
    pendingTransfers: countBy((row) => row.status === "pending" && row.paymentMethod === "transfer"),
    recentOrders,
    lowStock,
    newInquiries,
  };
}

/* -------------------------------- Productos ------------------------------- */

export async function listProductsAdmin(filters: {
  q?: string;
  status?: ProductStatus;
  categoryId?: number;
  page: number;
}) {
  const conditions: SQL[] = [];
  for (const term of searchTerms(filters.q ?? "")) conditions.push(ilike(products.searchText, `%${term}%`));
  if (filters.status) conditions.push(eq(products.status, filters.status));
  if (filters.categoryId) conditions.push(eq(products.categoryId, filters.categoryId));
  const where = conditions.length ? and(...conditions) : undefined;

  const [[{ total }], rows] = await Promise.all([
    db.select({ total: count() }).from(products).where(where),
    db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        sku: products.sku,
        price: products.price,
        compareAtPrice: products.compareAtPrice,
        stock: products.stock,
        status: products.status,
        featured: products.featured,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        brandName: brands.name,
        imageUrl: sql<string | null>`(select ${productImages.url} from ${productImages} where ${productImages.productId} = ${products.id} order by ${productImages.sortOrder}, ${productImages.id} limit 1)`,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .where(where)
      .orderBy(desc(products.updatedAt), desc(products.id))
      .limit(ADMIN_PAGE_SIZE)
      .offset((filters.page - 1) * ADMIN_PAGE_SIZE),
  ]);
  return { rows, total, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function getProductForEdit(id: number) {
  return db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      images: { orderBy: [asc(productImages.sortOrder), asc(productImages.id)] },
      fitments: {
        orderBy: [asc(productFitments.id)],
        with: { model: { columns: { id: true, name: true, makeId: true } } },
      },
    },
  });
}

export type ProductForEdit = NonNullable<Awaited<ReturnType<typeof getProductForEdit>>>;

/** Opciones para los selectores del formulario de producto. */
export async function getProductFormOptions() {
  const [categoryRows, brandRows, makes] = await Promise.all([
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db.select({ id: brands.id, name: brands.name }).from(brands).orderBy(asc(brands.name)),
    db.query.vehicleMakes.findMany({
      orderBy: [asc(vehicleMakes.name)],
      columns: { id: true, name: true },
      with: { models: { columns: { id: true, name: true }, orderBy: [asc(vehicleModels.name)] } },
    }),
  ]);
  return { categories: categoryRows, brands: brandRows, makes };
}

/* --------------------------------- Pedidos -------------------------------- */

export async function listOrdersAdmin(filters: {
  status?: OrderStatus;
  payment?: PaymentMethod;
  q?: string;
  page: number;
}) {
  const conditions: SQL[] = [];
  if (filters.status) conditions.push(eq(orders.status, filters.status));
  if (filters.payment) conditions.push(eq(orders.paymentMethod, filters.payment));
  const q = filters.q?.trim();
  if (q) {
    const number = Number(q.replace(/^sr-?/i, ""));
    const like = `%${q.replace(/[%_\\]/g, "")}%`;
    const search = [ilike(orders.customerName, like), ilike(orders.customerEmail, like), ilike(orders.customerPhone, like)];
    if (Number.isInteger(number) && number > 0) search.push(eq(orders.id, number));
    conditions.push(or(...search)!);
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const [[{ total }], rows] = await Promise.all([
    db.select({ total: count() }).from(orders).where(where),
    db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        total: orders.total,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        deliveryMethod: orders.deliveryMethod,
        shippingCommune: orders.shippingCommune,
        createdAt: orders.createdAt,
        itemCount: sql<number>`(select coalesce(sum(quantity), 0) from order_items where order_items.order_id = ${orders.id})`.mapWith(Number),
        testPayment: sql<boolean>`coalesce(${orders.webpayResponse}->>'environment', 'production') <> 'production'`,
      })
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(ADMIN_PAGE_SIZE)
      .offset((filters.page - 1) * ADMIN_PAGE_SIZE),
  ]);
  return { rows, total, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

/* ------------------------- Categorías, marcas, autos ------------------------ */

export async function listCategoriesAdmin() {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      icon: categories.icon,
      sortOrder: categories.sortOrder,
      productCount: count(products.id),
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function listBrandsAdmin() {
  return db
    .select({ id: brands.id, name: brands.name, slug: brands.slug, productCount: count(products.id) })
    .from(brands)
    .leftJoin(products, eq(products.brandId, brands.id))
    .groupBy(brands.id)
    .orderBy(asc(brands.name));
}

export async function listVehiclesAdmin() {
  const makes = await db.query.vehicleMakes.findMany({
    orderBy: [asc(vehicleMakes.name)],
    with: { models: { orderBy: [asc(vehicleModels.name)] } },
  });
  const fitmentCounts = await db
    .select({ modelId: productFitments.modelId, value: count() })
    .from(productFitments)
    .groupBy(productFitments.modelId);
  const countByModel = new Map(fitmentCounts.map((row) => [row.modelId, row.value]));
  return makes.map((make) => ({
    ...make,
    models: make.models.map((model) => ({ ...model, productCount: countByModel.get(model.id) ?? 0 })),
  }));
}

/* ------------------------- Servicios y solicitudes ------------------------- */

export async function listServicesAdmin() {
  return db.select().from(services).orderBy(asc(services.sortOrder), asc(services.name));
}

export async function listInquiriesAdmin(filters: { status?: InquiryStatus; page: number }) {
  const where = filters.status ? eq(inquiries.status, filters.status) : undefined;
  const [[{ total }], rows] = await Promise.all([
    db.select({ total: count() }).from(inquiries).where(where),
    db
      .select()
      .from(inquiries)
      .where(where)
      .orderBy(desc(inquiries.createdAt))
      .limit(ADMIN_PAGE_SIZE)
      .offset((filters.page - 1) * ADMIN_PAGE_SIZE),
  ]);
  return { rows, total, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function listAdminUsers() {
  return db
    .select({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      lastLoginAt: adminUsers.lastLoginAt,
      createdAt: adminUsers.createdAt,
    })
    .from(adminUsers)
    .orderBy(asc(adminUsers.createdAt));
}
