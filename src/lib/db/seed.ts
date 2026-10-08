import bcrypt from "bcryptjs";
import { count } from "drizzle-orm";
import { slugify } from "../text";
import type { Database } from "./index";
import {
  adminUsers,
  brands,
  categories,
  productFitments,
  products,
  services,
  vehicleMakes,
  vehicleModels,
  type ProductSpec,
} from "./schema";
import { rebuildProductSearchText } from "./search-text";

/* -------------------------------------------------------------------------- */
/*  Datos de ejemplo armados a partir de las líneas que Solis Racing Parts    */
/*  muestra en Instagram (FuelTech, sensores, combustible, fittings,          */
/*  relojería, arneses, VP Racing, ARP). Los precios son referenciales salvo  */
/*  el kit de presión de aceite: reemplázalos por el catálogo real.           */
/* -------------------------------------------------------------------------- */

const DEMO_CATEGORIES = [
  { name: "ECU y electrónica", icon: "cpu", description: "ECU programables FuelTech, módulos de encendido y accesorios." },
  { name: "Sensores", icon: "thermometer", description: "Sensores de presión y temperatura, MAP y sondas lambda wideband." },
  { name: "Sistema de combustible", icon: "fuel", description: "Bombas, rieles, reguladores, inyectores y filtros de combustible." },
  { name: "Fittings y mangueras", icon: "plug", description: "Fittings AN, mangueras trenzadas, tecalan, niples y adaptadores." },
  { name: "Relojería", icon: "gauge", description: "Relojes de 52 mm, pods y kits completos de instrumentos." },
  { name: "Arneses eléctricos", icon: "cable", description: "Arneses de motor y para ECU programable, hechos en nuestro taller." },
  { name: "Combustibles y lubricantes", icon: "flask-conical", description: "Combustible de competición VP Racing, aceites y aditivos." },
  { name: "Pernos y fijaciones", icon: "nut", description: "Espárragos y pernos ARP de alta resistencia para culata y bielas." },
  { name: "Encendido", icon: "zap", description: "Bujías de iridio, bobinas y cables de encendido." },
  { name: "Varios", icon: "package", description: "Herramientas, accesorios y repuestos para tu proyecto." },
];

const DEMO_BRANDS = [
  "FuelTech",
  "EPMAN",
  "Bosch",
  "Walbro",
  "Orlan Rober",
  "VP Racing",
  "ARP",
  "Motul",
  "NGK",
  "Solis Racing Parts",
];

const DEMO_VEHICLES: Record<string, string[]> = {
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

type DemoFitment = { make: string; model: string; from?: number; to?: number; notes?: string };

type DemoProduct = {
  name: string;
  sku: string;
  brand: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  featured?: boolean;
  universal?: boolean;
  shortDescription: string;
  description: string;
  specs: ProductSpec[];
  fitments?: DemoFitment[];
};

const DEMO_PRODUCTS: DemoProduct[] = [
  /* ECU y electrónica */
  {
    name: "FuelTech FT450 con arnés",
    sku: "SR-ECU-001",
    brand: "FuelTech",
    category: "ECU y electrónica",
    price: 1590000,
    stock: 1,
    featured: true,
    universal: true,
    shortDescription: "ECU programable con pantalla táctil a color, ideal para proyectos turbo y aspirados de hasta 8 cilindros.",
    description:
      "La FT450 controla inyección y encendido con mapas por RPM y MAP, y se programa directo desde su pantalla, sin computador.\n\n- Pantalla táctil a color de 4,3 pulgadas\n- Control de turbo, launch y corte de cambios\n- Incluye arnés principal\n\nTe asesoramos con la instalación y el seteo.",
    specs: [
      { label: "Cilindros", value: "Hasta 8" },
      { label: "Pantalla", value: "Táctil a color de 4,3\"" },
      { label: "Incluye", value: "Arnés principal" },
    ],
  },
  {
    name: "FuelTech FT550 con arnés",
    sku: "SR-ECU-002",
    brand: "FuelTech",
    category: "ECU y electrónica",
    price: 2390000,
    stock: 2,
    featured: true,
    universal: true,
    shortDescription: "ECU programable con data logger interno y más salidas para proyectos de competencia.",
    description:
      "La FT550 suma más entradas y salidas, data logger interno de alta resolución y control avanzado de turbo y tracción.\n\n- Inyección secuencial y encendido individual\n- Data logger interno\n- Compatible con sensores y módulos FuelTech",
    specs: [
      { label: "Cilindros", value: "Hasta 8 (secuencial)" },
      { label: "Data logger", value: "Interno" },
      { label: "Incluye", value: "Arnés principal" },
    ],
  },
  {
    name: "Módulo de encendido FuelTech SparkPRO-1",
    sku: "SR-ECU-003",
    brand: "FuelTech",
    category: "ECU y electrónica",
    price: 219990,
    stock: 4,
    universal: true,
    shortDescription: "Módulo de encendido inductivo de alta energía para bobinas sin módulo interno.",
    description: "Entrega una chispa más fuerte y estable a altas RPM. Se usa junto a ECU programables y bobinas sin driver interno.",
    specs: [
      { label: "Canales", value: "1" },
      { label: "Tipo", value: "Inductivo de alta energía" },
    ],
  },

  /* Sensores */
  {
    name: "Sensor de presión FuelTech PS-10B",
    sku: "SR-SEN-001",
    brand: "FuelTech",
    category: "Sensores",
    price: 119990,
    stock: 10,
    featured: true,
    universal: true,
    shortDescription: "Sensor de 0 a 10 bar para presión de aceite o combustible, compatible con ECU y relojes.",
    description:
      "Sensor de presión de acero inoxidable con salida lineal de 0,5 a 4,5 V.\n\n- Rango de 0 a 10 bar (145 psi)\n- Rosca 1/8\" NPT\n- Ideal para monitorear aceite y combustible en tu ECU",
    specs: [
      { label: "Rango", value: "0 a 10 bar" },
      { label: "Rosca", value: "1/8\" NPT" },
      { label: "Salida", value: "0,5 a 4,5 V" },
    ],
  },
  {
    name: "Sensor de temperatura de agua y aceite FuelTech",
    sku: "SR-SEN-002",
    brand: "FuelTech",
    category: "Sensores",
    price: 49990,
    stock: 12,
    universal: true,
    shortDescription: "Sensor de temperatura con rosca 1/8\" NPT para agua, aceite o aire de admisión.",
    description: "Sensor de respuesta rápida para leer temperaturas de motor en tu ECU programable o en relojes compatibles.",
    specs: [
      { label: "Rosca", value: "1/8\" NPT" },
      { label: "Rango", value: "-40 a 150 °C" },
    ],
  },
  {
    name: "Sonda lambda wideband Bosch LSU 4.9",
    sku: "SR-SEN-003",
    brand: "Bosch",
    category: "Sensores",
    price: 129990,
    stock: 6,
    universal: true,
    shortDescription: "Sonda de banda ancha para medir la mezcla aire/combustible con precisión.",
    description:
      "Sonda wideband original Bosch, compatible con controladores FuelTech WB-O2 y la mayoría de los medidores de mezcla.\n\n- Lectura de lambda de 0,65 a libre\n- Conector de 6 pines",
    specs: [
      { label: "Tipo", value: "Banda ancha (wideband)" },
      { label: "Conector", value: "6 pines" },
    ],
  },
  {
    name: "Sensor MAP Bosch 3 bar",
    sku: "SR-SEN-004",
    brand: "Bosch",
    category: "Sensores",
    price: 89990,
    stock: 8,
    universal: true,
    shortDescription: "Sensor de presión absoluta de 3 bar con temperatura de aire integrada, para motores turbo.",
    description: "Sensor TMAP para leer presión de turbo hasta 2 bar positivos y temperatura del aire de admisión.",
    specs: [
      { label: "Rango", value: "Hasta 3 bar absolutos" },
      { label: "Incluye", value: "Sensor de temperatura de aire" },
    ],
  },

  /* Sistema de combustible */
  {
    name: "Soporte doble bomba EPMAN con riel",
    sku: "SR-COM-001",
    brand: "EPMAN",
    category: "Sistema de combustible",
    price: 149990,
    stock: 3,
    featured: true,
    universal: true,
    shortDescription: "Riel para 2 bombas externas: flujo constante, mayor presión y alimentación estable.",
    description:
      "Soporte y riel de aluminio para montar dos bombas de combustible en paralelo.\n\n- Flujo constante y mayor presión\n- Máxima confiabilidad, ideal para competencia\n- Entradas y salidas AN",
    specs: [
      { label: "Bombas", value: "2 (no incluidas)" },
      { label: "Material", value: "Aluminio anodizado" },
      { label: "Conexiones", value: "AN" },
    ],
  },
  {
    name: "Bomba de combustible Walbro 255 l/h",
    sku: "SR-COM-002",
    brand: "Walbro",
    category: "Sistema de combustible",
    price: 79990,
    compareAtPrice: 94990,
    stock: 7,
    universal: true,
    shortDescription: "Bomba sumergida de alto flujo para proyectos de hasta 500 hp aprox.",
    description: "Bomba de combustible de alto flujo para instalar dentro del estanque. Incluye kit de instalación universal.",
    specs: [
      { label: "Caudal", value: "255 l/h" },
      { label: "Tipo", value: "Sumergida (in-tank)" },
    ],
  },
  {
    name: "Regulador de presión de combustible ajustable EPMAN",
    sku: "SR-COM-003",
    brand: "EPMAN",
    category: "Sistema de combustible",
    price: 69990,
    stock: 5,
    universal: true,
    shortDescription: "Regulador ajustable con conexiones AN6 y toma para manómetro o sensor.",
    description: "Regula la presión de combustible según tu proyecto. Toma de 1/8\" NPT para manómetro o sensor de presión.",
    specs: [
      { label: "Conexiones", value: "AN6" },
      { label: "Rango", value: "30 a 70 psi" },
    ],
  },
  {
    name: "Inyectores Bosch 550 cc (juego de 4)",
    sku: "SR-COM-004",
    brand: "Bosch",
    category: "Sistema de combustible",
    price: 249990,
    stock: 3,
    universal: true,
    shortDescription: "Inyectores de alta impedancia para motores turbo o con más potencia.",
    description: "Juego de 4 inyectores de 550 cc/min, conector EV1 o EV6 con adaptador. Requieren seteo de la ECU.",
    specs: [
      { label: "Caudal", value: "550 cc/min" },
      { label: "Impedancia", value: "Alta" },
    ],
  },

  /* Fittings y mangueras */
  {
    name: "Fitting recto AN6 aluminio anodizado",
    sku: "SR-FIT-001",
    brand: "EPMAN",
    category: "Fittings y mangueras",
    price: 7990,
    stock: 40,
    universal: true,
    shortDescription: "Fitting reutilizable para manguera trenzada AN6.",
    description: "Fitting de aluminio anodizado para armar líneas de combustible o aceite a medida.",
    specs: [
      { label: "Medida", value: "AN6" },
      { label: "Ángulo", value: "Recto" },
    ],
  },
  {
    name: "Manguera trenzada AN6 (por metro)",
    sku: "SR-FIT-002",
    brand: "EPMAN",
    category: "Fittings y mangueras",
    price: 14990,
    stock: 30,
    universal: true,
    shortDescription: "Manguera con malla de acero inoxidable apta para combustible y aceite.",
    description: "Manguera trenzada de alta presión. Se vende por metro; indica en el carrito la cantidad de metros que necesitas.",
    specs: [
      { label: "Medida", value: "AN6" },
      { label: "Malla", value: "Acero inoxidable" },
    ],
  },
  {
    name: "Tecalan 1/8\" para relojes (por metro)",
    sku: "SR-FIT-003",
    brand: "EPMAN",
    category: "Fittings y mangueras",
    price: 2990,
    stock: 50,
    universal: true,
    shortDescription: "Línea de tecalan para conectar relojes y sensores de presión.",
    description: "Tubo de nylon de alta resistencia para relojes mecánicos de presión de aceite o turbo.",
    specs: [{ label: "Diámetro", value: "1/8\"" }],
  },

  /* Relojería */
  {
    name: "Kit reloj de presión de aceite 52 mm con pod",
    sku: "SR-REL-001",
    brand: "Orlan Rober",
    category: "Relojería",
    price: 79000,
    stock: 6,
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
    name: "Reloj de presión de turbo 52 mm Orlan Rober",
    sku: "SR-REL-002",
    brand: "Orlan Rober",
    category: "Relojería",
    price: 44990,
    stock: 8,
    universal: true,
    shortDescription: "Manómetro de vacío y presión de turbo con iluminación.",
    description: "Reloj mecánico de 52 mm para leer vacío y presión de turbo. Incluye tecalan y accesorios de conexión.",
    specs: [
      { label: "Diámetro", value: "52 mm" },
      { label: "Rango", value: "-1 a 2 bar" },
    ],
  },
  {
    name: "Reloj de temperatura de agua 52 mm Orlan Rober",
    sku: "SR-REL-003",
    brand: "Orlan Rober",
    category: "Relojería",
    price: 44990,
    stock: 2,
    universal: true,
    shortDescription: "Reloj eléctrico de temperatura con sensor incluido.",
    description: "Reloj de 52 mm para controlar la temperatura del refrigerante. Incluye sensor y cables.",
    specs: [
      { label: "Diámetro", value: "52 mm" },
      { label: "Incluye", value: "Sensor de temperatura" },
    ],
  },

  /* Arneses eléctricos (fabricación propia) */
  {
    name: "Arnés de motor Honda serie B/D con VTEC (OBD1)",
    sku: "SR-ARN-001",
    brand: "Solis Racing Parts",
    category: "Arneses eléctricos",
    price: 189990,
    stock: 3,
    featured: true,
    shortDescription: "Arnés de motor hecho en nuestro taller, con conectores nuevos y terminaciones profesionales.",
    description:
      "Arnés de motor completo para swaps y restauraciones Honda con VTEC.\n\n- Cable automotriz de alta temperatura\n- Conectores y terminales nuevos\n- Probado antes de la entrega",
    specs: [
      { label: "Motores", value: "Honda B16, B18, D16 con VTEC" },
      { label: "Protocolo", value: "OBD1" },
    ],
    fitments: [
      { make: "Honda", model: "Civic", from: 1992, to: 2000 },
      { make: "Honda", model: "Integra", from: 1994, to: 2001 },
    ],
  },
  {
    name: "Arnés FuelTech plug & play para Honda K20/K24",
    sku: "SR-ARN-002",
    brand: "Solis Racing Parts",
    category: "Arneses eléctricos",
    price: 289990,
    stock: 2,
    shortDescription: "Conecta tu FuelTech al motor K-series sin cortar el arnés original.",
    description: "Arnés adaptador hecho a medida para instalar ECU FuelTech en motores Honda K20 y K24 con VTEC y VTC.",
    specs: [
      { label: "Motores", value: "Honda K20, K24 (VTEC y VTC)" },
      { label: "ECU", value: "FuelTech FT450 / FT550" },
    ],
    fitments: [
      { make: "Honda", model: "Civic Si", from: 2006, to: 2015 },
      { make: "Honda", model: "Accord", from: 2003, to: 2012, notes: "Motor K24" },
    ],
  },
  {
    name: "Arnés FuelTech para Mitsubishi 4G63",
    sku: "SR-ARN-003",
    brand: "Solis Racing Parts",
    category: "Arneses eléctricos",
    price: 289990,
    stock: 1,
    shortDescription: "Arnés de motor a medida para FuelTech en Lancer Evolution con 4G63.",
    description: "Arnés completo para instalar FuelTech en motores 4G63 turbo, con salidas para sensores adicionales.",
    specs: [
      { label: "Motor", value: "Mitsubishi 4G63 turbo" },
      { label: "ECU", value: "FuelTech FT450 / FT550" },
    ],
    fitments: [{ make: "Mitsubishi", model: "Lancer Evolution", from: 1996, to: 2007 }],
  },

  /* Combustibles y lubricantes */
  {
    name: "Combustible de competición VP Racing MS109 (20 litros)",
    sku: "SR-VP-001",
    brand: "VP Racing",
    category: "Combustibles y lubricantes",
    price: 279990,
    stock: 4,
    universal: true,
    shortDescription: "Combustible oxigenado de 109 octanos para motores turbo de alta potencia.",
    description:
      "Combustible de competición para motores sobrealimentados. Requiere seteo de la ECU para aprovecharlo.\n\nPor su peso, te recomendamos retiro en tienda o envío por pagar.",
    specs: [
      { label: "Octanaje", value: "109" },
      { label: "Formato", value: "Bidón de 20 litros" },
    ],
  },
  {
    name: "Aceite Motul 300V 5W-40 (5 litros)",
    sku: "SR-LUB-001",
    brand: "Motul",
    category: "Combustibles y lubricantes",
    price: 94990,
    stock: 9,
    universal: true,
    shortDescription: "Aceite 100 % sintético de competición para motores de alto rendimiento.",
    description: "Aceite de base éster para uso en calle y pista. Mantiene la presión de aceite estable a altas temperaturas.",
    specs: [
      { label: "Viscosidad", value: "5W-40" },
      { label: "Formato", value: "5 litros" },
    ],
  },

  /* Pernos y fijaciones */
  {
    name: "Espárragos de culata ARP para Honda B16/B18",
    sku: "SR-ARP-001",
    brand: "ARP",
    category: "Pernos y fijaciones",
    price: 249990,
    stock: 2,
    shortDescription: "Kit de espárragos de alta resistencia para motores con más presión de turbo.",
    description: "Espárragos de acero cromo-molibdeno que mantienen la culata firme con más compresión o turbo.",
    specs: [
      { label: "Material", value: "Acero ARP2000" },
      { label: "Incluye", value: "Tuercas y golillas" },
    ],
    fitments: [
      { make: "Honda", model: "Civic", from: 1992, to: 2000, notes: "Motores B16 y B18" },
      { make: "Honda", model: "Integra", from: 1994, to: 2001 },
    ],
  },
  {
    name: "Pernos de biela ARP para Mitsubishi 4G63",
    sku: "SR-ARP-002",
    brand: "ARP",
    category: "Pernos y fijaciones",
    price: 119990,
    stock: 0,
    shortDescription: "Pernos de biela reforzados para armar motores 4G63 de alta potencia.",
    description: "Juego de 8 pernos de biela ARP 2000 para motores 4G63.",
    specs: [
      { label: "Cantidad", value: "8 pernos" },
      { label: "Material", value: "Acero ARP2000" },
    ],
    fitments: [{ make: "Mitsubishi", model: "Lancer Evolution", from: 1996, to: 2007 }],
  },

  /* Encendido */
  {
    name: "Bujías NGK Iridium IX (juego de 4)",
    sku: "SR-ENC-001",
    brand: "NGK",
    category: "Encendido",
    price: 47990,
    stock: 15,
    universal: true,
    shortDescription: "Bujías de iridio con mejor chispa y mayor duración.",
    description: "Bujías de punta fina de iridio para un encendido más estable. Consúltanos el código correcto para tu motor.",
    specs: [
      { label: "Electrodo", value: "Iridio" },
      { label: "Cantidad", value: "4 unidades" },
    ],
  },

  /* Varios */
  {
    name: "Kit de terminales y conectores para arneses",
    sku: "SR-VAR-001",
    brand: "Solis Racing Parts",
    category: "Varios",
    price: 39990,
    stock: 10,
    universal: true,
    shortDescription: "Terminales, sellos y carcasas para reparar o armar arneses.",
    description: "Surtido de terminales y conectores automotrices sellados para tus proyectos eléctricos.",
    specs: [{ label: "Incluye", value: "Terminales, sellos y carcasas" }],
  },
];

const DEMO_SERVICES = [
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
      .values(DEMO_CATEGORIES.map((c, index) => ({ ...c, slug: slugify(c.name), sortOrder: index })))
      .onConflictDoNothing();
    const categoryRows = await tx.select({ id: categories.id, slug: categories.slug }).from(categories);
    const categoryIds = new Map(categoryRows.map((row) => [row.slug, row.id]));

    await tx
      .insert(brands)
      .values(DEMO_BRANDS.map((name) => ({ name, slug: slugify(name) })))
      .onConflictDoNothing();
    const brandRows = await tx.select({ id: brands.id, slug: brands.slug }).from(brands);
    const brandIds = new Map(brandRows.map((row) => [row.slug, row.id]));

    await tx
      .insert(vehicleMakes)
      .values(Object.keys(DEMO_VEHICLES).map((name) => ({ name, slug: slugify(name) })))
      .onConflictDoNothing();
    const makeRows = await tx.select({ id: vehicleMakes.id, slug: vehicleMakes.slug }).from(vehicleMakes);
    const makeIds = new Map(makeRows.map((row) => [row.slug, row.id]));
    const modelValues = Object.entries(DEMO_VEHICLES).flatMap(([makeName, models]) => {
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

    for (const product of DEMO_PRODUCTS) {
      const [row] = await tx
        .insert(products)
        .values({
          name: product.name,
          slug: slugify(product.name),
          sku: product.sku,
          brandId: brandIds.get(slugify(product.brand)) ?? null,
          categoryId: categoryIds.get(slugify(product.category)) ?? null,
          shortDescription: product.shortDescription,
          description: product.description,
          price: product.price,
          compareAtPrice: product.compareAtPrice ?? null,
          stock: product.stock,
          status: "active",
          featured: product.featured ?? false,
          universal: product.universal ?? false,
          specs: product.specs,
        })
        .onConflictDoNothing()
        .returning({ id: products.id });
      if (!row || !product.fitments?.length) continue;
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
      .values(DEMO_SERVICES.map((s, index) => ({ ...s, slug: slugify(s.name), sortOrder: index })))
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
