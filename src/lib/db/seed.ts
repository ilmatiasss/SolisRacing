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
/*  Datos de ejemplo. Son referenciales: reemplázalos por tu catálogo real.   */
/* -------------------------------------------------------------------------- */

const DEMO_CATEGORIES = [
  { name: "Admisión", icon: "wind", description: "Filtros de alto flujo y kits de admisión de aire frío." },
  { name: "Escape", icon: "flame", description: "Downpipes, catback y silenciadores deportivos." },
  { name: "Turbo e intercooler", icon: "fan", description: "Turbos, intercoolers, válvulas blow-off y wastegates." },
  { name: "Suspensión", icon: "arrow-down-up", description: "Coilovers, resortes, barras estabilizadoras y bujes." },
  { name: "Frenos", icon: "disc", description: "Pastillas, discos, kits big brake y líquidos de alto punto de ebullición." },
  { name: "Electrónica y ECU", icon: "cpu", description: "Programadores, sensores de mezcla y manómetros." },
  { name: "Encendido", icon: "zap", description: "Bujías de iridio y bobinas reforzadas." },
  { name: "Embrague y transmisión", icon: "cog", description: "Embragues reforzados y volantes de motor livianos." },
  { name: "Lubricantes y fluidos", icon: "droplet", description: "Aceites sintéticos, refrigerantes y aditivos." },
  { name: "Accesorios", icon: "gauge", description: "Volantes, pomos, arneses y más para el interior." },
];

const DEMO_BRANDS = [
  "K&N",
  "Mishimoto",
  "Magnaflow",
  "Invidia",
  "Turbosmart",
  "Garrett",
  "BC Racing",
  "Eibach",
  "Whiteline",
  "EBC Brakes",
  "Brembo",
  "Cobb Tuning",
  "AEM",
  "NGK",
  "Bosch",
  "Exedy",
  "Motul",
  "Liqui Moly",
  "Sparco",
];

const DEMO_VEHICLES: Record<string, string[]> = {
  Subaru: ["Impreza WRX", "WRX", "WRX STI", "BRZ", "Forester XT"],
  Mitsubishi: ["Lancer Evolution", "Lancer"],
  Volkswagen: ["Golf GTI", "Golf R", "Polo GTI", "Jetta GLI"],
  Honda: ["Civic Si", "Civic Type R"],
  Toyota: ["GR86", "86", "GR Yaris", "Supra"],
  Mazda: ["MX-5", "Mazda 3"],
  Suzuki: ["Swift Sport", "Swift"],
  Ford: ["Mustang GT", "Mustang EcoBoost", "Ranger"],
  Hyundai: ["Veloster N", "i30 N"],
  Peugeot: ["208 GTi", "308 GTi"],
  Audi: ["S3", "A3"],
  Nissan: ["370Z", "Navara"],
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
  {
    name: "Filtro de aire de alto flujo K&N (reemplazo directo)",
    sku: "SR-ADM-001",
    brand: "K&N",
    category: "Admisión",
    price: 69990,
    compareAtPrice: 79990,
    stock: 12,
    featured: true,
    shortDescription: "Filtro lavable y reutilizable que mejora el flujo de aire sin modificar la caja original.",
    description:
      "Filtro de algodón aceitado de alto flujo que reemplaza directamente al filtro de papel original.\n\n- Lavable y reutilizable hasta 80.000 km entre limpiezas\n- Mejor respuesta del acelerador y sonido de admisión más deportivo\n- Instalación en minutos, sin herramientas especiales",
    specs: [
      { label: "Tipo", value: "Panel de reemplazo" },
      { label: "Material", value: "Algodón aceitado" },
      { label: "Mantención", value: "Lavable (kit de limpieza recomendado)" },
    ],
    fitments: [
      { make: "Subaru", model: "Impreza WRX", from: 2008, to: 2014 },
      { make: "Subaru", model: "Forester XT", from: 2009, to: 2013 },
      { make: "Subaru", model: "WRX", from: 2015, to: 2021 },
    ],
  },
  {
    name: "Kit de admisión de aire frío Mishimoto",
    sku: "SR-ADM-002",
    brand: "Mishimoto",
    category: "Admisión",
    price: 389990,
    stock: 3,
    shortDescription: "Admisión de aire frío con caja térmica cerrada y tubo de silicona reforzada.",
    description:
      "Kit completo de admisión que reemplaza la caja de aire original. Toma aire más frío desde el frontal y reduce las restricciones del sistema.\n\n- Caja térmica cerrada que aísla el calor del motor\n- Filtro lavable de alto flujo\n- Ganancia típica de 8 a 12 hp con reprogramación",
    specs: [
      { label: "Diámetro del tubo", value: "3,5 pulgadas" },
      { label: "Material", value: "Aluminio y silicona reforzada" },
      { label: "Requiere reprogramación", value: "Recomendada" },
    ],
    fitments: [
      { make: "Volkswagen", model: "Golf GTI", from: 2015, to: 2021, notes: "Motor 2.0 TSI (EA888 Gen 3)" },
      { make: "Volkswagen", model: "Golf R", from: 2015, to: 2021 },
      { make: "Audi", model: "S3", from: 2015, to: 2020 },
    ],
  },
  {
    name: "Filtro cónico universal K&N 76 mm",
    sku: "SR-ADM-003",
    brand: "K&N",
    category: "Admisión",
    price: 54990,
    stock: 20,
    universal: true,
    shortDescription: "Filtro cónico de alto flujo para proyectos de admisión a medida.",
    description:
      "Filtro cónico universal con base de goma y abrazadera incluida. Ideal para kits de admisión personalizados y proyectos turbo.",
    specs: [
      { label: "Diámetro de entrada", value: "76 mm (3 pulgadas)" },
      { label: "Largo", value: "152 mm" },
      { label: "Incluye", value: "Abrazadera de acero inoxidable" },
    ],
  },
  {
    name: "Downpipe 3\" con catalizador de alto flujo Invidia",
    sku: "SR-ESC-001",
    brand: "Invidia",
    category: "Escape",
    price: 449990,
    stock: 2,
    shortDescription: "Downpipe de acero inoxidable con catalizador de alto flujo para motores turbo.",
    description:
      "Reduce la contrapresión a la salida del turbo para acelerar el spool y bajar las temperaturas de escape. Mantiene catalizador para uso en calle.\n\n- Acero inoxidable T304 de 3 pulgadas\n- Catalizador metálico de alto flujo\n- Requiere reprogramación de ECU",
    specs: [
      { label: "Diámetro", value: "3 pulgadas" },
      { label: "Material", value: "Acero inoxidable T304" },
      { label: "Catalizador", value: "Metálico, 200 celdas" },
    ],
    fitments: [
      { make: "Subaru", model: "WRX", from: 2015, to: 2021 },
      { make: "Subaru", model: "Forester XT", from: 2014, to: 2018 },
    ],
  },
  {
    name: "Escape catback acero inoxidable Magnaflow",
    sku: "SR-ESC-002",
    brand: "Magnaflow",
    category: "Escape",
    price: 1290000,
    compareAtPrice: 1390000,
    stock: 1,
    featured: true,
    shortDescription: "Sistema catback completo con sonido profundo y sin resonancia en carretera.",
    description:
      "Sistema de escape catback de acero inoxidable con silenciadores de flujo directo. Sonido grave y agresivo al acelerar, sin zumbido en crucero.\n\n- Instalación con pernos, sin soldadura\n- Puntas pulidas de 4,5 pulgadas\n- Garantía de por vida del fabricante",
    specs: [
      { label: "Diámetro", value: "3 pulgadas" },
      { label: "Material", value: "Acero inoxidable 409" },
      { label: "Puntas", value: "4,5 pulgadas pulidas" },
    ],
    fitments: [{ make: "Ford", model: "Mustang GT", from: 2015, to: 2023, notes: "Motor 5.0 V8" }],
  },
  {
    name: "Silenciador deportivo universal 2,5\" Magnaflow",
    sku: "SR-ESC-003",
    brand: "Magnaflow",
    category: "Escape",
    price: 129990,
    stock: 8,
    universal: true,
    shortDescription: "Silenciador de flujo directo para escapes a medida.",
    description:
      "Silenciador de flujo directo de acero inoxidable con relleno de fibra de vidrio para un sonido deportivo controlado.",
    specs: [
      { label: "Entrada / salida", value: "2,5 pulgadas" },
      { label: "Largo del cuerpo", value: "14 pulgadas" },
      { label: "Material", value: "Acero inoxidable pulido" },
    ],
  },
  {
    name: "Válvula blow-off Turbosmart Kompact",
    sku: "SR-TUR-001",
    brand: "Turbosmart",
    category: "Turbo e intercooler",
    price: 249990,
    stock: 5,
    featured: true,
    shortDescription: "Válvula de alivio de presión de reemplazo directo con sonido característico.",
    description:
      "Reemplaza la válvula de recirculación original y libera la presión del turbo al soltar el acelerador. Construcción en aluminio anodizado, sin necesidad de modificar mangueras.",
    specs: [
      { label: "Tipo", value: "Blow-off atmosférica / recirculación" },
      { label: "Material", value: "Aluminio 6061 anodizado" },
      { label: "Presión máxima", value: "35 psi" },
    ],
    fitments: [
      { make: "Volkswagen", model: "Golf GTI", from: 2015, to: 2021 },
      { make: "Volkswagen", model: "Golf R", from: 2015, to: 2021 },
      { make: "Audi", model: "S3", from: 2015, to: 2020 },
    ],
  },
  {
    name: "Intercooler frontal de alto rendimiento Mishimoto",
    sku: "SR-TUR-002",
    brand: "Mishimoto",
    category: "Turbo e intercooler",
    price: 799990,
    stock: 2,
    shortDescription: "Intercooler frontal de barra y placa que reduce la temperatura del aire de admisión.",
    description:
      "Núcleo de barra y placa de mayor volumen que el original. Mantiene las temperaturas de admisión estables en uso exigente y track days.\n\n- Hasta 30 °C menos en el aire de admisión\n- Incluye cañerías de aluminio y acoples de silicona",
    specs: [
      { label: "Núcleo", value: "Barra y placa" },
      { label: "Espesor", value: "76 mm" },
      { label: "Incluye", value: "Cañerías y abrazaderas" },
    ],
    fitments: [{ make: "Subaru", model: "WRX", from: 2015, to: 2021 }],
  },
  {
    name: "Turbo Garrett G25-550",
    sku: "SR-TUR-003",
    brand: "Garrett",
    category: "Turbo e intercooler",
    price: 1890000,
    stock: 1,
    universal: true,
    shortDescription: "Turbo de rodamientos de bolas para proyectos de hasta 550 hp.",
    description:
      "Turbo de la serie G con rueda de compresor forjada y rodamientos de bolas. Respuesta rápida y amplio rango de potencia. Requiere instalación y seteo profesional (consúltanos por el servicio).",
    specs: [
      { label: "Potencia", value: "Hasta 550 hp" },
      { label: "Rodamientos", value: "Bolas dobles" },
      { label: "Rango de cilindrada", value: "1.4 a 3.0 litros" },
    ],
  },
  {
    name: "Coilovers BC Racing BR Series",
    sku: "SR-SUS-001",
    brand: "BC Racing",
    category: "Suspensión",
    price: 1190000,
    compareAtPrice: 1290000,
    stock: 3,
    featured: true,
    shortDescription: "Suspensión regulable en altura y dureza (30 posiciones) para calle y pista.",
    description:
      "Coilovers monotubo con regulación de altura independiente del recorrido y 30 niveles de dureza. Montajes superiores con camber regulable en el eje delantero.\n\n- Regulación de altura y precarga\n- 30 niveles de dureza\n- Ideal para uso diario y track day",
    specs: [
      { label: "Tipo", value: "Monotubo" },
      { label: "Ajuste de dureza", value: "30 posiciones" },
      { label: "Camber", value: "Regulable (delantero)" },
    ],
    fitments: [
      { make: "Subaru", model: "WRX", from: 2015, to: 2021 },
      { make: "Mitsubishi", model: "Lancer Evolution", from: 2008, to: 2016, notes: "Evolution X" },
      { make: "Honda", model: "Civic Type R", from: 2017, to: 2021 },
    ],
  },
  {
    name: "Resortes deportivos Eibach Pro-Kit (-30 mm)",
    sku: "SR-SUS-002",
    brand: "Eibach",
    category: "Suspensión",
    price: 329990,
    stock: 6,
    shortDescription: "Rebaja la altura unos 30 mm y mejora el comportamiento en curvas.",
    description:
      "Resortes progresivos que bajan el centro de gravedad manteniendo la comodidad en ciudad. Compatibles con los amortiguadores originales.",
    specs: [
      { label: "Rebaje delantero", value: "≈ 30 mm" },
      { label: "Rebaje trasero", value: "≈ 25 mm" },
      { label: "Tipo", value: "Progresivo" },
    ],
    fitments: [
      { make: "Volkswagen", model: "Golf GTI", from: 2015, to: 2021 },
      { make: "Toyota", model: "GR86", from: 2022, to: 2026 },
      { make: "Mazda", model: "MX-5", from: 2016, to: 2026, notes: "Generación ND" },
    ],
  },
  {
    name: "Barra estabilizadora trasera Whiteline 22 mm",
    sku: "SR-SUS-003",
    brand: "Whiteline",
    category: "Suspensión",
    price: 279990,
    stock: 4,
    shortDescription: "Reduce el balanceo de la carrocería y el subviraje. Regulable en 3 posiciones.",
    description:
      "Barra estabilizadora trasera de mayor diámetro con bujes de poliuretano. Ajustable en tres posiciones para afinar el balance del auto.",
    specs: [
      { label: "Diámetro", value: "22 mm" },
      { label: "Regulación", value: "3 posiciones" },
      { label: "Incluye", value: "Bujes de poliuretano" },
    ],
    fitments: [
      { make: "Subaru", model: "WRX", from: 2015, to: 2021 },
      { make: "Subaru", model: "BRZ", from: 2013, to: 2020 },
      { make: "Toyota", model: "86", from: 2013, to: 2020 },
    ],
  },
  {
    name: "Pastillas de freno EBC Yellowstuff (delanteras)",
    sku: "SR-FRE-001",
    brand: "EBC Brakes",
    category: "Frenos",
    price: 119990,
    stock: 10,
    featured: true,
    shortDescription: "Pastillas de alto rendimiento para calle y track day, sin necesidad de precalentar.",
    description:
      "Compuesto de alto coeficiente de fricción que funciona desde frío y soporta altas temperaturas en pista. Bajo desgaste de discos.",
    specs: [
      { label: "Eje", value: "Delantero" },
      { label: "Temperatura de trabajo", value: "Hasta 800 °C" },
      { label: "Uso", value: "Calle y track day" },
    ],
    fitments: [
      { make: "Subaru", model: "WRX", from: 2015, to: 2021 },
      { make: "Volkswagen", model: "Golf GTI", from: 2015, to: 2021 },
      { make: "Suzuki", model: "Swift Sport", from: 2018, to: 2026 },
    ],
  },
  {
    name: "Discos ranurados EBC USR (par delantero)",
    sku: "SR-FRE-002",
    brand: "EBC Brakes",
    category: "Frenos",
    price: 249990,
    stock: 4,
    shortDescription: "Discos con ranuras que evacúan gases y mantienen la mordida en frenadas fuertes.",
    description:
      "Discos ranurados con tratamiento anticorrosión. Mejoran la disipación de calor y la consistencia del pedal en uso exigente.",
    specs: [
      { label: "Eje", value: "Delantero (par)" },
      { label: "Diámetro", value: "340 mm" },
      { label: "Acabado", value: "Ranurado con tratamiento GEOMET" },
    ],
    fitments: [
      { make: "Volkswagen", model: "Golf GTI", from: 2015, to: 2021 },
      { make: "Audi", model: "S3", from: 2015, to: 2020 },
    ],
  },
  {
    name: "Kit big brake Brembo 4 pistones",
    sku: "SR-FRE-003",
    brand: "Brembo",
    category: "Frenos",
    price: 2490000,
    stock: 1,
    shortDescription: "Calipers monoblock de 4 pistones con discos flotantes de 355 mm.",
    description:
      "Kit de frenos delanteros completo: calipers de 4 pistones, discos flotantes de dos piezas, pastillas, flexibles de malla de acero y soportes. Instalación recomendada en taller.",
    specs: [
      { label: "Calipers", value: "4 pistones, aluminio forjado" },
      { label: "Discos", value: "355 × 32 mm flotantes" },
      { label: "Llanta mínima", value: "18 pulgadas" },
    ],
    fitments: [
      { make: "Toyota", model: "GR86", from: 2022, to: 2026 },
      { make: "Subaru", model: "BRZ", from: 2022, to: 2026 },
    ],
  },
  {
    name: "Líquido de frenos Motul RBF 600 (500 ml)",
    sku: "SR-FRE-004",
    brand: "Motul",
    category: "Frenos",
    price: 24990,
    stock: 30,
    universal: true,
    shortDescription: "Líquido DOT 4 de competición con punto de ebullición de 312 °C.",
    description:
      "Líquido de frenos 100 % sintético para uso en competencia. Evita el fading del pedal en sesiones de pista.",
    specs: [
      { label: "Norma", value: "DOT 4" },
      { label: "Punto de ebullición seco", value: "312 °C" },
      { label: "Contenido", value: "500 ml" },
    ],
  },
  {
    name: "Cobb Accessport V3",
    sku: "SR-ECU-001",
    brand: "Cobb Tuning",
    category: "Electrónica y ECU",
    price: 1149990,
    stock: 2,
    featured: true,
    shortDescription: "Programador de mano con mapas Stage 1 y Stage 2, monitoreo y lectura de fallas.",
    description:
      "Carga mapas de potencia, monitorea parámetros en tiempo real y lee/borra códigos de falla. Permite volver al mapa original en cualquier momento. Te ayudamos con un seteo a medida en dinamómetro.",
    specs: [
      { label: "Mapas incluidos", value: "Stage 1 y Stage 2" },
      { label: "Funciones", value: "Monitoreo, data logging, lector de fallas" },
      { label: "Pantalla", value: "Color con montaje incluido" },
    ],
    fitments: [
      { make: "Subaru", model: "WRX", from: 2015, to: 2021 },
      { make: "Subaru", model: "WRX STI", from: 2015, to: 2021 },
      { make: "Ford", model: "Mustang EcoBoost", from: 2015, to: 2023 },
    ],
  },
  {
    name: "Manómetro digital de presión de turbo AEM",
    sku: "SR-ECU-002",
    brand: "AEM",
    category: "Electrónica y ECU",
    price: 189990,
    stock: 6,
    universal: true,
    shortDescription: "Manómetro de 52 mm para presión de turbo y vacío, con sensor incluido.",
    description:
      "Manómetro digital de respuesta rápida con lectura de vacío y presión. Colores de iluminación configurables.",
    specs: [
      { label: "Diámetro", value: "52 mm" },
      { label: "Rango", value: "-30 inHg a 35 psi" },
      { label: "Incluye", value: "Sensor y arnés" },
    ],
  },
  {
    name: "Sensor de mezcla wideband AEM X-Series",
    sku: "SR-ECU-003",
    brand: "AEM",
    category: "Electrónica y ECU",
    price: 279990,
    stock: 4,
    universal: true,
    shortDescription: "Controlador wideband con sonda Bosch 4.9 para medir la relación aire/combustible.",
    description:
      "Lectura precisa de la relación aire/combustible (AFR/Lambda) con salida analógica para la ECU o data logger. Imprescindible para seteos seguros.",
    specs: [
      { label: "Sonda", value: "Bosch LSU 4.9" },
      { label: "Rango", value: "8,5 a 18 AFR" },
      { label: "Salida", value: "0-5 V analógica" },
    ],
  },
  {
    name: "Bujías NGK Iridium IX (juego de 4)",
    sku: "SR-ENC-001",
    brand: "NGK",
    category: "Encendido",
    price: 49990,
    stock: 25,
    shortDescription: "Electrodo de iridio para una chispa más estable y mayor duración.",
    description:
      "Bujías de iridio con electrodo central fino que mejoran la combustión y la respuesta del motor. Juego de 4 unidades.",
    specs: [
      { label: "Electrodo", value: "Iridio" },
      { label: "Contenido", value: "4 unidades" },
      { label: "Duración", value: "Hasta 40.000 km" },
    ],
    fitments: [
      { make: "Suzuki", model: "Swift Sport", from: 2012, to: 2026 },
      { make: "Honda", model: "Civic Si", from: 2012, to: 2021 },
      { make: "Mazda", model: "MX-5", from: 2016, to: 2026 },
      { make: "Mazda", model: "Mazda 3", from: 2014, to: 2024 },
    ],
  },
  {
    name: "Bujías NGK Laser Iridium un grado más frío (juego de 4)",
    sku: "SR-ENC-002",
    brand: "NGK",
    category: "Encendido",
    price: 69990,
    stock: 15,
    shortDescription: "Rango térmico más frío, recomendado para motores turbo con reprogramación.",
    description:
      "Bujías un grado más frío que las originales para evitar detonación en motores con más presión de turbo. Recomendadas desde Stage 2.",
    specs: [
      { label: "Rango térmico", value: "Un grado más frío que el original" },
      { label: "Electrodo", value: "Iridio / platino" },
      { label: "Contenido", value: "4 unidades" },
    ],
    fitments: [
      { make: "Volkswagen", model: "Golf GTI", from: 2015, to: 2021 },
      { make: "Subaru", model: "WRX", from: 2015, to: 2021 },
      { make: "Hyundai", model: "Veloster N", from: 2019, to: 2022 },
    ],
  },
  {
    name: "Bobinas de encendido reforzadas Bosch (juego de 4)",
    sku: "SR-ENC-003",
    brand: "Bosch",
    category: "Encendido",
    price: 229990,
    stock: 3,
    shortDescription: "Bobinas de mayor energía que evitan fallas de encendido con alta presión de turbo.",
    description:
      "Bobinas lápiz de última generación con mayor energía de chispa. Solucionan los típicos fallos de encendido en motores 2.0 TSI reprogramados.",
    specs: [
      { label: "Tipo", value: "Bobina lápiz" },
      { label: "Contenido", value: "4 unidades" },
    ],
    fitments: [
      { make: "Volkswagen", model: "Golf GTI", from: 2013, to: 2021 },
      { make: "Volkswagen", model: "Jetta GLI", from: 2013, to: 2021 },
      { make: "Audi", model: "A3", from: 2013, to: 2020 },
    ],
  },
  {
    name: "Kit de embrague reforzado Exedy Stage 1",
    sku: "SR-EMB-001",
    brand: "Exedy",
    category: "Embrague y transmisión",
    price: 549990,
    stock: 2,
    shortDescription: "Soporta hasta un 50 % más de torque que el original, con pedal liviano.",
    description:
      "Plato de presión reforzado y disco orgánico de alta resistencia. Mantiene el manejo suave en ciudad y soporta la potencia de un Stage 2.",
    specs: [
      { label: "Capacidad de torque", value: "+50 % sobre el original" },
      { label: "Disco", value: "Orgánico reforzado" },
      { label: "Incluye", value: "Disco, prensa y collarín" },
    ],
    fitments: [
      { make: "Subaru", model: "WRX", from: 2015, to: 2021 },
      { make: "Mitsubishi", model: "Lancer Evolution", from: 2008, to: 2016 },
    ],
  },
  {
    name: "Volante de motor liviano Exedy",
    sku: "SR-EMB-002",
    brand: "Exedy",
    category: "Embrague y transmisión",
    price: 389990,
    stock: 2,
    shortDescription: "Volante de acero cromoly más liviano para que el motor suba de vueltas más rápido.",
    description:
      "Volante de motor en acero cromoly balanceado. Reduce la inercia rotacional para una respuesta más rápida del motor.",
    specs: [
      { label: "Material", value: "Acero cromoly" },
      { label: "Peso", value: "≈ 5,4 kg" },
    ],
    fitments: [
      { make: "Toyota", model: "GR86", from: 2022, to: 2026 },
      { make: "Toyota", model: "86", from: 2013, to: 2020 },
      { make: "Honda", model: "Civic Si", from: 2017, to: 2021 },
    ],
  },
  {
    name: "Aceite Motul 300V 5W-40 (5 litros)",
    sku: "SR-LUB-001",
    brand: "Motul",
    category: "Lubricantes y fluidos",
    price: 89990,
    compareAtPrice: 99990,
    stock: 40,
    universal: true,
    featured: true,
    shortDescription: "Aceite 100 % sintético de competición con tecnología de ésteres.",
    description:
      "Aceite de motor para uso deportivo y competición. Protege en altas temperaturas y regímenes de giro elevados. Verifica la especificación recomendada por el fabricante de tu motor.",
    specs: [
      { label: "Viscosidad", value: "5W-40" },
      { label: "Base", value: "100 % sintético (ésteres)" },
      { label: "Contenido", value: "5 litros (2 × 2 L + 1 L)" },
    ],
  },
  {
    name: "Aceite Liqui Moly Synthoil High Tech 5W-30 (5 litros)",
    sku: "SR-LUB-002",
    brand: "Liqui Moly",
    category: "Lubricantes y fluidos",
    price: 64990,
    stock: 18,
    universal: true,
    shortDescription: "Aceite sintético para motores bencineros y diésel modernos.",
    description:
      "Aceite totalmente sintético que reduce el desgaste y mantiene el motor limpio. Apto para intervalos de cambio extendidos.",
    specs: [
      { label: "Viscosidad", value: "5W-30" },
      { label: "Base", value: "Sintético" },
      { label: "Contenido", value: "5 litros" },
    ],
  },
  {
    name: "Refrigerante Motul Inugel Optimal (1 litro)",
    sku: "SR-LUB-003",
    brand: "Motul",
    category: "Lubricantes y fluidos",
    price: 12990,
    stock: 35,
    universal: true,
    shortDescription: "Refrigerante orgánico listo para usar, protege hasta -37 °C.",
    description: "Refrigerante de larga duración con tecnología orgánica. Listo para usar, no requiere dilución.",
    specs: [
      { label: "Protección", value: "-37 °C a 135 °C" },
      { label: "Contenido", value: "1 litro" },
    ],
  },
  {
    name: "Volante deportivo Sparco 350 mm en gamuza",
    sku: "SR-ACC-001",
    brand: "Sparco",
    category: "Accesorios",
    price: 189990,
    stock: 5,
    universal: true,
    shortDescription: "Volante de competición de 350 mm con forro de gamuza y costuras rojas.",
    description:
      "Volante de aluminio con forro de gamuza antideslizante. Requiere maza (hub) específica para tu auto, consúltanos.",
    specs: [
      { label: "Diámetro", value: "350 mm" },
      { label: "Profundidad", value: "65 mm" },
      { label: "Forro", value: "Gamuza" },
    ],
  },
  {
    name: "Arnés de competición Sparco 4 puntas",
    sku: "SR-ACC-002",
    brand: "Sparco",
    category: "Accesorios",
    price: 199990,
    stock: 4,
    universal: true,
    shortDescription: "Arnés de 3 pulgadas con hebilla de liberación rápida.",
    description:
      "Arnés de 4 puntas para track days. Recomendado junto a asientos tipo butaca. Revisa el reglamento de tu competencia antes de comprar.",
    specs: [
      { label: "Ancho de cintas", value: "3 pulgadas" },
      { label: "Puntos de anclaje", value: "4" },
      { label: "Hebilla", value: "Liberación rápida" },
    ],
  },
  {
    name: "Pomo de cambios en aluminio con peso",
    sku: "SR-ACC-003",
    brand: "Sparco",
    category: "Accesorios",
    price: 34990,
    stock: 0,
    universal: true,
    shortDescription: "Pomo con peso adicional para cambios más precisos. Incluye adaptadores.",
    description: "Pomo de aluminio mecanizado con contrapeso que hace los cambios más firmes y precisos.",
    specs: [
      { label: "Material", value: "Aluminio anodizado" },
      { label: "Peso", value: "450 g" },
    ],
  },
];

const DEMO_SERVICES = [
  {
    name: "Reprogramación ECU Stage 1",
    icon: "cpu",
    priceFrom: 290000,
    duration: "3 a 4 horas",
    summary: "Más potencia y torque con el hardware original, cuidando la confiabilidad del motor.",
    description:
      "Optimizamos el mapa de inyección, encendido y presión de turbo de tu ECU. Incluye medición en dinamómetro antes y después, y respaldo del mapa original.",
  },
  {
    name: "Stage 2 y Stage 3 a medida",
    icon: "zap",
    priceFrom: 450000,
    duration: "1 día",
    summary: "Para autos con admisión, downpipe, intercooler o turbo mayor.",
    description:
      "Seteo a medida en dinamómetro según las piezas instaladas. Registramos data logs y ajustamos mezcla y avance para sacar el máximo de forma segura.",
  },
  {
    name: "Seteo en dinamómetro",
    icon: "gauge",
    priceFrom: 150000,
    duration: "2 a 3 horas",
    summary: "Medición de potencia y ajuste fino de mezcla y avance en banco de potencia.",
    description:
      "Ideal para verificar un mapa existente, diagnosticar pérdidas de potencia o afinar después de instalar nuevas piezas. Te entregamos el gráfico de potencia y torque.",
  },
  {
    name: "Seteo de suspensión y alineación",
    icon: "arrow-down-up",
    priceFrom: 60000,
    duration: "2 horas",
    summary: "Altura, camber, caster y convergencia según tu uso: calle, track day o drift.",
    description:
      "Ajustamos coilovers, altura por esquina y geometría completa. Te entregamos el reporte de alineación con los valores finales.",
  },
  {
    name: "Instalación de partes de performance",
    icon: "wrench",
    priceFrom: null,
    duration: "Según el trabajo",
    summary: "Instalamos escapes, coilovers, frenos, intercoolers y más.",
    description:
      "Si compraste tus piezas con nosotros, agenda la instalación en nuestro taller. Cotizamos según el auto y las piezas.",
  },
  {
    name: "Diagnóstico y escaneo computacional",
    icon: "activity",
    priceFrom: 35000,
    duration: "1 hora",
    summary: "Lectura de fallas, revisión de sensores y data log para encontrar el problema.",
    description:
      "Escaneo completo de la ECU, revisión de parámetros en vivo y prueba de ruta con registro de datos.",
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
