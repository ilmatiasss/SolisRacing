import bcrypt from "bcryptjs";
import { count } from "drizzle-orm";
import { slugify } from "../text";
import type { Database } from "./index";
import {
  adminUsers,
  brands,
  categories,
  productFitments,
  productImages,
  products,
  services,
  vehicleMakes,
  vehicleModels,
  type ProductSpec,
} from "./schema";
import { rebuildProductSearchText } from "./search-text";

/* -------------------------------------------------------------------------- */
/*  Catálogo inicial de Solis Racing Parts, tomado de su catálogo de WhatsApp */
/*  (nombres y precios) y de Instagram (kit de presión de aceite). El stock   */
/*  es provisorio: ajústalo en el panel antes de publicar la tienda.          */
/* -------------------------------------------------------------------------- */

const INITIAL_CATEGORIES = [
  { name: "FuelTech", icon: "cpu", description: "ECU programables, wideband y sensores FuelTech." },
  { name: "Sensores", icon: "thermometer", description: "Sondas lambda wideband Bosch y sensores para ECU programable." },
  { name: "Combustible", icon: "fuel", description: "Rieles, soportes de bombas y tanques de combustible." },
  { name: "Fittings", icon: "plug", description: "Fittings, abrazaderas y herramientas para armar tus líneas." },
  { name: "Relojería", icon: "gauge", description: "Relojes, pods, cañerías y kits de instrumentos." },
  { name: "Red Line", icon: "droplet", description: "Aceites de motor y de competición, líquido de frenos y aditivos Red Line." },
  { name: "VP Racing", icon: "flask-conical", description: "Refrigerante, aditivos y líquido de frenos VP Racing." },
  { name: "Varios", icon: "package", description: "Bujías, wastegates, coplas, empaques y más para tu proyecto." },
];

const INITIAL_BRANDS = ["FuelTech", "Bosch", "EPMAN", "NGK", "Red Line", "VP Racing"];

const INITIAL_VEHICLES: Record<string, string[]> = {
  Honda: ["Civic", "Civic Si", "Integra", "Accord"],
  Mitsubishi: ["Lancer Evolution", "Lancer", "L200"],
  Subaru: ["Impreza WRX", "WRX", "BRZ"],
  Toyota: ["Hilux", "Corolla", "GT86"],
  Nissan: ["Navara", "Sentra", "350Z"],
  Volkswagen: ["Golf GTI", "Gol"],
  Suzuki: ["Swift Sport", "Swift"],
  Mazda: ["MX-5", "RX-8"],
  Chevrolet: ["Camaro", "Sail"],
};

type InitialFitment = { make: string; model: string; from?: number; to?: number; notes?: string };

type InitialProduct = {
  name: string;
  sku: string;
  brand?: string;
  category: string;
  /** 0 = sin precio publicado: se carga como borrador hasta que lo completes. */
  price: number;
  compareAtPrice?: number;
  stock: number;
  status?: "active" | "draft";
  featured?: boolean;
  universal?: boolean;
  shortDescription: string;
  description: string;
  specs: ProductSpec[];
  fitments?: InitialFitment[];
  /** Foto en `public/catalogo/`. */
  image?: string;
};

/** Stock provisorio para los productos publicados (WhatsApp no muestra el stock). */
const PROVISIONAL_STOCK = 5;

const INITIAL_PRODUCTS: InitialProduct[] = [
  /* FuelTech */
  {
    name: "FuelTech FT550",
    image: "/catalogo/fueltech-ft550.webp",
    sku: "SR-FT-001",
    brand: "FuelTech",
    category: "FuelTech",
    price: 1999000,
    stock: PROVISIONAL_STOCK,
    featured: true,
    universal: true,
    shortDescription: "ECU programable FuelTech FT550.",
    description:
      "ECU programable FuelTech FT550 para controlar la inyección y el encendido de tu motor.\n\nTe asesoramos para elegir los sensores y el arnés que necesitas, y coordinamos la instalación y el seteo.",
    specs: [{ label: "Tipo", value: "ECU programable" }],
  },
  {
    name: "Wideband Nano V2",
    image: "/catalogo/wideband-nano-v2.webp",
    sku: "SR-FT-002",
    brand: "FuelTech",
    category: "FuelTech",
    price: 380000,
    stock: PROVISIONAL_STOCK,
    featured: true,
    universal: true,
    shortDescription: "Medidor de mezcla aire/combustible (wideband) FuelTech.",
    description: "Wideband FuelTech Nano V2 para leer la mezcla aire/combustible de tu motor.",
    specs: [{ label: "Tipo", value: "Wideband (mezcla aire/combustible)" }],
  },
  {
    name: "Sensor de presión PS10B FuelTech",
    image: "/catalogo/sensor-de-presion-ps10b-fueltech.webp",
    sku: "SR-FT-003",
    brand: "FuelTech",
    category: "FuelTech",
    price: 135000,
    stock: PROVISIONAL_STOCK,
    featured: true,
    universal: true,
    shortDescription: "Sensor de presión de 0 a 10 bar para aceite o combustible.",
    description: "Sensor de presión FuelTech PS10B para monitorear la presión de aceite o de combustible en tu ECU.",
    specs: [{ label: "Rango", value: "0 a 10 bar" }],
  },

  /* Sensores */
  {
    name: "Sensor wideband Bosch LSU 4.2",
    image: "/catalogo/sensor-wideband-bosch-lsu-4-2.webp",
    sku: "SR-SEN-001",
    brand: "Bosch",
    category: "Sensores",
    price: 130000,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Sonda lambda de banda ancha Bosch original.",
    description: "Sonda lambda wideband Bosch LSU 4.2 original. Revisa que sea compatible con tu controlador o ECU.",
    specs: [{ label: "Modelo", value: "Bosch LSU 4.2" }],
  },
  {
    name: "Sensor wideband Bosch LSU 4.9",
    image: "/catalogo/sensor-wideband-bosch-lsu-4-9.webp",
    sku: "SR-SEN-002",
    brand: "Bosch",
    category: "Sensores",
    price: 130000,
    stock: PROVISIONAL_STOCK,
    featured: true,
    universal: true,
    shortDescription: "Sonda lambda de banda ancha Bosch original.",
    description: "Sonda lambda wideband Bosch LSU 4.9 original. Revisa que sea compatible con tu controlador o ECU.",
    specs: [{ label: "Modelo", value: "Bosch LSU 4.9" }],
  },
  {
    name: "Sensor de velocidad de rueda para ECU programable",
    image: "/catalogo/sensor-de-velocidad-de-rueda-para-ecu-programable.webp",
    sku: "SR-SEN-003",
    category: "Sensores",
    price: 40000,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Sensor para leer la velocidad de rueda en tu ECU programable.",
    description: "Sensor de velocidad de rueda para ECU programable.",
    specs: [],
  },

  /* Combustible */
  {
    name: "Riel para unión de 2 bombas externas EPMAN",
    image: "/catalogo/riel-para-union-de-2-bombas-externas-epman.webp",
    sku: "SR-COM-001",
    brand: "EPMAN",
    category: "Combustible",
    price: 38000,
    stock: PROVISIONAL_STOCK,
    featured: true,
    universal: true,
    shortDescription: "Riel para unir 2 bombas de combustible externas.",
    description:
      "Riel EPMAN para conectar dos bombas de combustible externas: flujo constante, mayor presión y alimentación estable.\n\nCombínalo con el soporte doble para bomba externa.",
    specs: [{ label: "Bombas", value: "2 externas (no incluidas)" }],
  },
  {
    name: "Soporte doble para bomba de combustible externa EPMAN",
    image: "/catalogo/soporte-doble-para-bomba-de-combustible-externa-epman.webp",
    sku: "SR-COM-002",
    brand: "EPMAN",
    category: "Combustible",
    price: 35000,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Soporte para montar 2 bombas de combustible externas.",
    description: "Soporte doble EPMAN para fijar dos bombas de combustible externas. Combínalo con el riel para 2 bombas.",
    specs: [{ label: "Bombas", value: "2 externas (no incluidas)" }],
  },
  {
    name: "Tanque de combustible 20 litros",
    image: "/catalogo/tanque-de-combustible-20-litros.webp",
    sku: "SR-COM-003",
    category: "Combustible",
    price: 130000,
    stock: PROVISIONAL_STOCK,
    featured: true,
    universal: true,
    shortDescription: "Tanque de combustible de 20 litros, color negro.",
    description: "Tanque de combustible de 20 litros, color negro.",
    specs: [
      { label: "Capacidad", value: "20 litros" },
      { label: "Color", value: "Negro" },
    ],
  },

  /* Fittings */
  {
    name: "Llaves ajustables para fitting",
    image: "/catalogo/llaves-ajustables-para-fitting.webp",
    sku: "SR-FIT-001",
    category: "Fittings",
    price: 40000,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Llaves ajustables para montar y apretar fittings.",
    description: "Llaves ajustables para montar y apretar fittings.",
    specs: [],
  },
  {
    name: "Fitting ORB",
    image: "/catalogo/fitting-orb.webp",
    sku: "SR-FIT-002",
    category: "Fittings",
    price: 0,
    stock: 0,
    status: "draft",
    universal: true,
    shortDescription: "Disponible en variedad de medidas.",
    description: "Fitting ORB disponible en variedad de medidas. Consúltanos por la medida que necesitas.",
    specs: [],
  },
  {
    name: "Abrazaderas dobles para fitting",
    image: "/catalogo/abrazaderas-dobles-para-fitting.webp",
    sku: "SR-FIT-003",
    category: "Fittings",
    price: 0,
    stock: 0,
    status: "draft",
    universal: true,
    shortDescription: "Disponible para AN10, AN8, AN6 y AN4.",
    description: "Abrazaderas dobles para ordenar y fijar tus líneas. Disponibles para AN10, AN8, AN6 y AN4.",
    specs: [{ label: "Medidas", value: "AN10, AN8, AN6 y AN4" }],
  },

  /* Relojería */
  {
    name: "Kit reloj de presión de aceite 52 mm con pod",
    image: "/catalogo/kit-reloj-de-presion-de-aceite-52-mm-con-pod.webp",
    sku: "SR-REL-001",
    category: "Relojería",
    price: 79000,
    stock: PROVISIONAL_STOCK,
    featured: true,
    universal: true,
    shortDescription: "Pod reloj 52 mm, reloj de presión de aceite, tecalan para conexión y niple adaptador. ¡Todo por $79.000!",
    description:
      "Kit completo para monitorear la presión de aceite de tu motor.\n\n- Pod para reloj de 52 mm\n- Reloj de presión de aceite\n- Tecalan para la conexión\n- Niple adaptador",
    specs: [
      { label: "Diámetro", value: "52 mm" },
      { label: "Incluye", value: "Pod, reloj, tecalan y niple" },
    ],
  },

  {
    name: "Cañería de nylon 2 metros",
    sku: "SR-REL-002",
    category: "Relojería",
    price: 15000,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Cañería de nylon de 2 metros para conectar relojes de presión.",
    description: "Cañería de nylon de 2 metros para conectar relojes mecánicos de presión.",
    specs: [{ label: "Largo", value: "2 metros" }],
  },
  {
    name: "Pod para reloj de 52 mm",
    sku: "SR-REL-003",
    category: "Relojería",
    price: 24000,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Pod para instalar un reloj de 52 mm.",
    description: "Pod para montar un reloj de 52 mm en el habitáculo.",
    specs: [{ label: "Diámetro", value: "52 mm" }],
  },
  {
    name: "Reloj de presión de combustible mecánico",
    sku: "SR-REL-004",
    category: "Relojería",
    price: 45000,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Reloj mecánico de presión de combustible.",
    description: "Reloj mecánico para controlar la presión de combustible.",
    specs: [{ label: "Tipo", value: "Mecánico" }],
  },

  /* Red Line */
  {
    name: "Líquido de frenos Race Red Line",
    sku: "SR-RL-001",
    brand: "Red Line",
    category: "Red Line",
    price: 23000,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Líquido de frenos de competición Red Line.",
    description: "Líquido de frenos Race de Red Line para uso exigente en calle y pista.",
    specs: [],
  },
  {
    name: "Aditivo refrigerante Red Line WaterWetter",
    sku: "SR-RL-002",
    brand: "Red Line",
    category: "Red Line",
    price: 17700,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Aditivo para el sistema de refrigeración.",
    description: "Aditivo WaterWetter de Red Line para el agua del radiador.",
    specs: [],
  },
  {
    name: "Aditivo para rodaje de motor Red Line",
    sku: "SR-RL-003",
    brand: "Red Line",
    category: "Red Line",
    price: 21500,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Aditivo para el rodaje de motores nuevos o recién armados.",
    description: "Aditivo de Red Line para el rodaje de motores nuevos o recién armados.",
    specs: [],
  },
  {
    name: "Aceite para rodaje de motor Red Line",
    sku: "SR-RL-004",
    brand: "Red Line",
    category: "Red Line",
    price: 16300,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Aceite para el rodaje de motores nuevos o recién armados.",
    description: "Aceite de Red Line para el rodaje de motores nuevos o recién armados.",
    specs: [],
  },
  {
    name: "Aceite Race 60WT Red Line",
    sku: "SR-RL-005",
    brand: "Red Line",
    category: "Red Line",
    price: 25200,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Aceite de competición Red Line 60WT.",
    description: "Aceite de competición Race 60WT de Red Line.",
    specs: [{ label: "Viscosidad", value: "60WT" }],
  },
  {
    name: "Aceite Race 50WT Red Line",
    sku: "SR-RL-006",
    brand: "Red Line",
    category: "Red Line",
    price: 25200,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Aceite de competición Red Line 50WT.",
    description: "Aceite de competición Race 50WT de Red Line.",
    specs: [{ label: "Viscosidad", value: "50WT" }],
  },
  {
    name: "Aceite Gear clanes Red Line",
    sku: "SR-RL-007",
    brand: "Red Line",
    category: "Red Line",
    price: 28100,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Aceite Red Line para caja de cambios.",
    description: "Aceite Red Line para caja de cambios.",
    specs: [],
  },
  {
    name: "Aceite de motor 5W-30 Red Line",
    sku: "SR-RL-008",
    brand: "Red Line",
    category: "Red Line",
    price: 23000,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Aceite sintético de motor Red Line 5W-30.",
    description: "Aceite sintético de motor 5W-30 de Red Line.",
    specs: [{ label: "Viscosidad", value: "5W-30" }],
  },
  {
    name: "Aceite de motor 10W-40 Red Line",
    sku: "SR-RL-009",
    brand: "Red Line",
    category: "Red Line",
    price: 23000,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Aceite sintético de motor Red Line 10W-40.",
    description: "Aceite sintético de motor 10W-40 de Red Line.",
    specs: [{ label: "Viscosidad", value: "10W-40" }],
  },
  {
    name: "Aceite de motor 10W-60 Red Line",
    sku: "SR-RL-010",
    brand: "Red Line",
    category: "Red Line",
    price: 23000,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Aceite sintético de motor Red Line 10W-60.",
    description: "Aceite sintético de motor 10W-60 de Red Line.",
    specs: [{ label: "Viscosidad", value: "10W-60" }],
  },

  /* VP Racing */
  {
    name: "Refrigerante VP Racing",
    sku: "SR-VP-001",
    brand: "VP Racing",
    category: "VP Racing",
    price: 23500,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Refrigerante para el sistema de enfriamiento.",
    description: "Refrigerante VP Racing para el radiador de tu auto.",
    specs: [],
  },
  {
    name: "Aditivo refrigerante VP Racing",
    sku: "SR-VP-002",
    brand: "VP Racing",
    category: "VP Racing",
    price: 13500,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Aditivo para el sistema de refrigeración.",
    description: "Aditivo refrigerante VP Racing para el agua del radiador.",
    specs: [],
  },
  {
    name: "Líquido de frenos Race VP Racing",
    sku: "SR-VP-003",
    brand: "VP Racing",
    category: "VP Racing",
    price: 23600,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Líquido de frenos de competición VP Racing.",
    description: "Líquido de frenos Race de VP Racing para uso exigente en calle y pista.",
    specs: [],
  },

  /* Varios */
  {
    name: "Wastegate 38 mm EPMAN",
    image: "/catalogo/wastegate-38-mm-epman.webp",
    sku: "SR-VAR-001",
    brand: "EPMAN",
    category: "Varios",
    price: 80000,
    stock: PROVISIONAL_STOCK,
    featured: true,
    universal: true,
    shortDescription: "Wastegate externa de 38 mm con abrazaderas.",
    description: "Wastegate externa EPMAN de 38 mm para controlar la presión de tu turbo.",
    specs: [{ label: "Diámetro", value: "38 mm" }],
  },
  {
    name: "Bujía NGK BKR7E",
    image: "/catalogo/bujia-ngk-bkr7e.webp",
    sku: "SR-VAR-002",
    brand: "NGK",
    category: "Varios",
    price: 5000,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Bujía NGK BKR7E. Precio por unidad.",
    description: "Bujía NGK BKR7E. Precio por unidad: agrega al carrito la cantidad que necesitas.",
    specs: [{ label: "Código", value: "BKR7E" }],
  },
  {
    name: "Copla recta 2\" a 2,5\"",
    image: "/catalogo/copla-recta.webp",
    sku: "SR-VAR-003",
    category: "Varios",
    price: 14000,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Copla recta reductora de 2\" a 2,5\".",
    description: "Copla recta reductora para unir tubos de 2\" y 2,5\". También la tenemos de 2,5\" a 3\".",
    specs: [{ label: "Medida", value: "2\" a 2,5\"" }],
  },
  {
    name: "Copla recta 2,5\" a 3\"",
    image: "/catalogo/copla-recta.webp",
    sku: "SR-VAR-004",
    category: "Varios",
    price: 14000,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Copla recta reductora de 2,5\" a 3\".",
    description: "Copla recta reductora para unir tubos de 2,5\" y 3\". También la tenemos de 2\" a 2,5\".",
    specs: [{ label: "Medida", value: "2,5\" a 3\"" }],
  },
  {
    name: "Botonera universal con botón start",
    sku: "SR-VAR-005",
    category: "Varios",
    price: 30000,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Botonera universal con botón de partida (start).",
    description: "Botonera universal con botón start para el habitáculo.",
    specs: [],
  },
  {
    name: "Empaque para turbo T3",
    sku: "SR-VAR-006",
    category: "Varios",
    price: 5000,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Empaque de brida para turbo T3.",
    description: "Empaque para turbo T3. También lo tenemos para T4 y T4 twin scroll.",
    specs: [{ label: "Brida", value: "T3" }],
  },
  {
    name: "Empaque para turbo T4",
    sku: "SR-VAR-007",
    category: "Varios",
    price: 5000,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Empaque de brida para turbo T4.",
    description: "Empaque para turbo T4. También lo tenemos para T3 y T4 twin scroll.",
    specs: [{ label: "Brida", value: "T4" }],
  },
  {
    name: "Empaque para turbo T4 twin scroll",
    sku: "SR-VAR-008",
    category: "Varios",
    price: 5000,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Empaque de brida para turbo T4 twin scroll.",
    description: "Empaque para turbo T4 twin scroll. También lo tenemos para T3 y T4.",
    specs: [{ label: "Brida", value: "T4 twin scroll" }],
  },
  {
    name: "Suples para capot",
    sku: "SR-VAR-009",
    category: "Varios",
    price: 13000,
    stock: PROVISIONAL_STOCK,
    universal: true,
    shortDescription: "Suples para levantar el capot y ventilar el vano motor.",
    description: "Suples para capot, con pernos de instalación.",
    specs: [],
  },
];

const INITIAL_SERVICES = [
  {
    name: "Instalación y programación FuelTech",
    icon: "cpu",
    priceFrom: null,
    duration: null,
    summary: "Instalamos tu ECU FuelTech con arnés y sensores, y la dejamos lista para el seteo.",
    description:
      "Te asesoramos para elegir el equipo correcto, instalamos la ECU con su arnés y sensores, y cargamos un mapa base seguro.",
  },
  {
    name: "Arneses eléctricos a medida",
    icon: "cable",
    priceFrom: null,
    duration: null,
    summary: "Fabricamos el arnés de tu motor según la ECU y los sensores de tu proyecto.",
    description:
      "Arneses de motor, swaps y adaptaciones para ECU programable, con cable de alta temperatura y conectores nuevos.",
  },
  {
    name: "Seteo de ECU programable",
    icon: "gauge",
    priceFrom: null,
    duration: null,
    summary: "Ajuste de mezcla y avance con registros de datos para que tu motor rinda de forma segura.",
    description: "Seteamos tu ECU programable según las piezas instaladas y el combustible que usas.",
  },
  {
    name: "Instalación de sistema de combustible",
    icon: "fuel",
    priceFrom: null,
    duration: null,
    summary: "Bombas, rieles, reguladores y líneas AN armadas a la medida.",
    description: "Diseñamos e instalamos la alimentación de combustible para la potencia que buscas.",
  },
  {
    name: "Instalación de relojes e instrumentos",
    icon: "thermometer",
    priceFrom: null,
    duration: null,
    summary: "Pods, relojes y sensores instalados y funcionando.",
    description: "Instalamos relojes mecánicos o eléctricos, sensores y pods para que controles tu motor.",
  },
  {
    name: "Asesoría para tu proyecto",
    icon: "activity",
    priceFrom: null,
    duration: null,
    summary: "Te ayudamos a elegir las piezas correctas antes de comprar.",
    description: "Cuéntanos tu auto, tu motor y lo que buscas, y te recomendamos las piezas y los pasos a seguir.",
  },
];

/* -------------------------------------------------------------------------- */

export async function countProducts(db: Database) {
  const [row] = await db.select({ value: count() }).from(products);
  return row?.value ?? 0;
}

export async function seedDemoData(db: Database) {
  await db.transaction(async (tx) => {
    // Se insertan sin pisar lo existente y luego se leen todos para armar los índices.
    await tx
      .insert(categories)
      .values(INITIAL_CATEGORIES.map((c, index) => ({ ...c, slug: slugify(c.name), sortOrder: index })))
      .onConflictDoNothing();
    const categoryRows = await tx.select({ id: categories.id, slug: categories.slug }).from(categories);
    const categoryIds = new Map(categoryRows.map((row) => [row.slug, row.id]));

    await tx
      .insert(brands)
      .values(INITIAL_BRANDS.map((name) => ({ name, slug: slugify(name) })))
      .onConflictDoNothing();
    const brandRows = await tx.select({ id: brands.id, slug: brands.slug }).from(brands);
    const brandIds = new Map(brandRows.map((row) => [row.slug, row.id]));

    await tx
      .insert(vehicleMakes)
      .values(Object.keys(INITIAL_VEHICLES).map((name) => ({ name, slug: slugify(name) })))
      .onConflictDoNothing();
    const makeRows = await tx.select({ id: vehicleMakes.id, slug: vehicleMakes.slug }).from(vehicleMakes);
    const makeIds = new Map(makeRows.map((row) => [row.slug, row.id]));
    const modelValues = Object.entries(INITIAL_VEHICLES).flatMap(([makeName, models]) => {
      const makeId = makeIds.get(slugify(makeName));
      return makeId ? models.map((name) => ({ makeId, name, slug: slugify(name) })) : [];
    });
    await tx.insert(vehicleModels).values(modelValues).onConflictDoNothing();
    const modelRows = await tx
      .select({ id: vehicleModels.id, makeId: vehicleModels.makeId, slug: vehicleModels.slug })
      .from(vehicleModels);
    const modelIds = new Map(modelRows.map((row) => [`${row.makeId}|${row.slug}`, row.id]));
    const findModelId = (make: string, model: string) =>
      modelIds.get(`${makeIds.get(slugify(make))}|${slugify(model)}`);

    for (const product of INITIAL_PRODUCTS) {
      const [row] = await tx
        .insert(products)
        .values({
          name: product.name,
          slug: slugify(product.name),
          sku: product.sku,
          brandId: product.brand ? (brandIds.get(slugify(product.brand)) ?? null) : null,
          categoryId: categoryIds.get(slugify(product.category)) ?? null,
          shortDescription: product.shortDescription,
          description: product.description,
          price: product.price,
          compareAtPrice: product.compareAtPrice ?? null,
          stock: product.stock,
          status: product.status ?? "active",
          featured: product.featured ?? false,
          universal: product.universal ?? false,
          specs: product.specs,
        })
        .onConflictDoNothing()
        .returning({ id: products.id });
      if (!row) continue;
      if (product.image) {
        await tx.insert(productImages).values({ productId: row.id, url: product.image, alt: product.name });
      }
      if (!product.fitments?.length) continue;
      const fitments = product.fitments
        .map((fitment) => ({
          productId: row.id,
          modelId: findModelId(fitment.make, fitment.model),
          yearFrom: fitment.from ?? null,
          yearTo: fitment.to ?? null,
          notes: fitment.notes ?? null,
        }))
        .filter((fitment): fitment is typeof fitment & { modelId: number } => fitment.modelId !== undefined);
      if (fitments.length) await tx.insert(productFitments).values(fitments);
    }

    await tx
      .insert(services)
      .values(INITIAL_SERVICES.map((s, index) => ({ ...s, slug: slugify(s.name), sortOrder: index })))
      .onConflictDoNothing();
  });

  await rebuildProductSearchText(db);
}

export async function ensureAdminUser(
  db: Database,
  { email, password, name }: { email: string; password: string; name?: string },
): Promise<"created" | "exists"> {
  const [existing] = await db.select({ value: count() }).from(adminUsers);
  if ((existing?.value ?? 0) > 0) return "exists";
  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(adminUsers).values({
    email: email.trim().toLowerCase(),
    name: name ?? "Administrador",
    passwordHash,
  });
  return "created";
}
