import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/*                                   Enums                                    */
/* -------------------------------------------------------------------------- */

export const productStatusEnum = pgEnum("product_status", ["active", "draft", "archived"]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", ["webpay", "transfer"]);

/** pickup = retiro en tienda, shipping = despacho pagado, shipping_collect = envío por pagar. */
export const deliveryMethodEnum = pgEnum("delivery_method", [
  "pickup",
  "shipping",
  "shipping_collect",
]);

export const documentTypeEnum = pgEnum("document_type", ["boleta", "factura"]);

/** service = pedir hora, contact = mensaje, part = pedido especial de un repuesto que no está en el catálogo. */
export const inquiryKindEnum = pgEnum("inquiry_kind", ["service", "contact", "part"]);

export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "new",
  "contacted",
  "scheduled",
  "closed",
]);

export type ProductStatus = (typeof productStatusEnum.enumValues)[number];
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];
export type DeliveryMethod = (typeof deliveryMethodEnum.enumValues)[number];
export type DocumentType = (typeof documentTypeEnum.enumValues)[number];
export type InquiryKind = (typeof inquiryKindEnum.enumValues)[number];
export type InquiryStatus = (typeof inquiryStatusEnum.enumValues)[number];

export type ProductSpec = { label: string; value: string };

/** Respuesta del commit de Webpay Plus que guardamos como comprobante. */
export type WebpayCommitData = {
  vci?: string;
  amount: number;
  status: string;
  buy_order: string;
  session_id: string;
  card_detail?: { card_number?: string };
  accounting_date?: string;
  transaction_date?: string;
  authorization_code?: string;
  payment_type_code?: string;
  response_code: number;
  installments_amount?: number;
  installments_number?: number;
  balance?: number;
  /** Ambiente en que se procesó: "production", "integration" (pruebas) o "mock" (simulador). */
  environment?: string;
};

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

/* -------------------------------------------------------------------------- */
/*                                  Catálogo                                  */
/* -------------------------------------------------------------------------- */

export const categories = pgTable("categories", {
  id: serial().primaryKey(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  description: text(),
  icon: text().default("wrench").notNull(),
  sortOrder: integer().default(0).notNull(),
  ...timestamps,
});

export const brands = pgTable("brands", {
  id: serial().primaryKey(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  ...timestamps,
});

export const products = pgTable(
  "products",
  {
    id: serial().primaryKey(),
    name: text().notNull(),
    slug: text().notNull().unique(),
    sku: text().unique(),
    brandId: integer().references(() => brands.id, { onDelete: "set null" }),
    categoryId: integer().references(() => categories.id, { onDelete: "set null" }),
    shortDescription: text(),
    description: text(),
    /** Precio final en pesos chilenos, IVA incluido. */
    price: integer().notNull(),
    /** Precio anterior (tachado) para mostrar ofertas. */
    compareAtPrice: integer(),
    stock: integer().default(0).notNull(),
    status: productStatusEnum().default("draft").notNull(),
    featured: boolean().default(false).notNull(),
    /** Universal: sirve para cualquier vehículo (aceites, herramientas, etc.). */
    universal: boolean().default(false).notNull(),
    specs: jsonb().$type<ProductSpec[]>().default([]).notNull(),
    /** Texto normalizado (sin tildes) usado por el buscador. */
    searchText: text().default("").notNull(),
    ...timestamps,
  },
  (t) => [
    index().on(t.status),
    index().on(t.categoryId),
    index().on(t.brandId),
    check("products_price_non_negative", sql`${t.price} >= 0`),
    check("products_stock_non_negative", sql`${t.stock} >= 0`),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: serial().primaryKey(),
    productId: integer()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text().notNull(),
    alt: text(),
    sortOrder: integer().default(0).notNull(),
  },
  (t) => [index().on(t.productId)],
);

export const vehicleMakes = pgTable("vehicle_makes", {
  id: serial().primaryKey(),
  name: text().notNull(),
  slug: text().notNull().unique(),
});

export const vehicleModels = pgTable(
  "vehicle_models",
  {
    id: serial().primaryKey(),
    makeId: integer()
      .notNull()
      .references(() => vehicleMakes.id, { onDelete: "cascade" }),
    name: text().notNull(),
    slug: text().notNull(),
  },
  (t) => [uniqueIndex().on(t.makeId, t.slug)],
);

/** Compatibilidad producto ↔ modelo de auto, con rango de años opcional. */
export const productFitments = pgTable(
  "product_fitments",
  {
    id: serial().primaryKey(),
    productId: integer()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    modelId: integer()
      .notNull()
      .references(() => vehicleModels.id, { onDelete: "cascade" }),
    yearFrom: integer(),
    yearTo: integer(),
    notes: text(),
  },
  (t) => [index().on(t.productId), index().on(t.modelId)],
);

/* -------------------------------------------------------------------------- */
/*                                  Pedidos                                   */
/* -------------------------------------------------------------------------- */

export const orders = pgTable(
  "orders",
  {
    /** El id es también el número de pedido visible (SR-1001, SR-1002…). */
    id: integer().primaryKey().generatedAlwaysAsIdentity({ startWith: 1001 }),
    /** Token secreto para que el cliente vea su pedido sin cuenta. */
    publicToken: text().notNull().unique(),
    status: orderStatusEnum().default("pending").notNull(),
    paymentMethod: paymentMethodEnum().notNull(),
    deliveryMethod: deliveryMethodEnum().notNull(),

    customerName: text().notNull(),
    customerEmail: text().notNull(),
    customerPhone: text().notNull(),
    customerRut: text(),

    documentType: documentTypeEnum().default("boleta").notNull(),
    companyName: text(),
    companyRut: text(),
    companyGiro: text(),
    companyAddress: text(),

    shippingRegion: text(),
    shippingCommune: text(),
    shippingAddress: text(),
    shippingAddress2: text(),
    customerNotes: text(),

    subtotal: integer().notNull(),
    shippingCost: integer().default(0).notNull(),
    total: integer().notNull(),

    trackingCourier: text(),
    trackingNumber: text(),
    adminNotes: text(),
    cancelReason: text(),

    webpayToken: text().unique(),
    webpayResponse: jsonb().$type<WebpayCommitData>(),

    paidAt: timestamp({ withTimezone: true }),
    shippedAt: timestamp({ withTimezone: true }),
    deliveredAt: timestamp({ withTimezone: true }),
    cancelledAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [index().on(t.status), index().on(t.createdAt), index().on(t.customerEmail)],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial().primaryKey(),
    orderId: integer()
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer().references(() => products.id, { onDelete: "set null" }),
    productName: text().notNull(),
    productSku: text(),
    productSlug: text(),
    imageUrl: text(),
    unitPrice: integer().notNull(),
    quantity: integer().notNull(),
    lineTotal: integer().notNull(),
  },
  (t) => [index().on(t.orderId), check("order_items_quantity_positive", sql`${t.quantity} > 0`)],
);

/** Historial de cambios de estado de cada pedido. */
export const orderEvents = pgTable(
  "order_events",
  {
    id: serial().primaryKey(),
    orderId: integer()
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: orderStatusEnum(),
    message: text().notNull(),
    /** Visible para el cliente en la página de seguimiento. */
    public: boolean().default(true).notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index().on(t.orderId)],
);

/* -------------------------------------------------------------------------- */
/*                          Servicios y solicitudes                           */
/* -------------------------------------------------------------------------- */

export const services = pgTable("services", {
  id: serial().primaryKey(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  summary: text(),
  description: text(),
  /** Precio referencial "desde", en CLP. */
  priceFrom: integer(),
  duration: text(),
  icon: text().default("gauge").notNull(),
  active: boolean().default(true).notNull(),
  sortOrder: integer().default(0).notNull(),
  ...timestamps,
});

export const inquiries = pgTable(
  "inquiries",
  {
    id: serial().primaryKey(),
    kind: inquiryKindEnum().notNull(),
    serviceId: integer().references(() => services.id, { onDelete: "set null" }),
    serviceName: text(),
    name: text().notNull(),
    email: text().notNull(),
    phone: text(),
    vehicle: text(),
    preferredDate: date({ mode: "string" }),
    message: text(),
    status: inquiryStatusEnum().default("new").notNull(),
    adminNotes: text(),
    ...timestamps,
  },
  (t) => [index().on(t.status), index().on(t.createdAt)],
);

/* -------------------------------------------------------------------------- */
/*                         Configuración y usuarios                           */
/* -------------------------------------------------------------------------- */

export const settings = pgTable("settings", {
  key: text().primaryKey(),
  value: jsonb().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const adminUsers = pgTable("admin_users", {
  id: serial().primaryKey(),
  /** Siempre en minúsculas. */
  email: text().notNull().unique(),
  name: text().notNull(),
  passwordHash: text().notNull(),
  lastLoginAt: timestamp({ withTimezone: true }),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/*                                 Relaciones                                 */
/* -------------------------------------------------------------------------- */

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  images: many(productImages),
  fitments: many(productFitments),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const vehicleMakesRelations = relations(vehicleMakes, ({ many }) => ({
  models: many(vehicleModels),
}));

export const vehicleModelsRelations = relations(vehicleModels, ({ one, many }) => ({
  make: one(vehicleMakes, { fields: [vehicleModels.makeId], references: [vehicleMakes.id] }),
  fitments: many(productFitments),
}));

export const productFitmentsRelations = relations(productFitments, ({ one }) => ({
  product: one(products, { fields: [productFitments.productId], references: [products.id] }),
  model: one(vehicleModels, {
    fields: [productFitments.modelId],
    references: [vehicleModels.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
  events: many(orderEvents),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, { fields: [orderEvents.orderId], references: [orders.id] }),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  inquiries: many(inquiries),
}));

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  service: one(services, { fields: [inquiries.serviceId], references: [services.id] }),
}));
