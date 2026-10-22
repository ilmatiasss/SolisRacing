/*
 * Ayuda del panel en palabras simples. Cada sección del menú tiene una guía corta que se muestra
 * plegada bajo el título («¿Cómo funciona esta sección?»); la página Ayuda reúne todo por tarea.
 */

export type SectionGuide = {
  /** Para qué sirve la sección, en una frase. */
  intro: string;
  /** Pasos o acciones típicas, en orden. */
  steps: string[];
  /** Consejo o advertencia importante. */
  tip?: string;
  /** Ancla de la página Ayuda con la guía completa. */
  more?: string;
};

export const SECTION_GUIDES: Record<string, SectionGuide> = {
  "/admin": {
    intro: "Es tu inicio: lo que pide atención hoy, cómo van las ventas y lo que falta para dejar la tienda lista.",
    steps: [
      "Revisa «Para hoy»: pedidos por despachar, transferencias por confirmar y mensajes nuevos.",
      "Haz clic en cualquier tarjeta para ir directo a resolverla.",
      "Mientras aparezca «Primeros pasos», completa lo que falta antes de abrir la tienda.",
    ],
  },
  "/admin/pedidos": {
    intro: "Aquí llegan todas las compras de la tienda. Cada pedido avanza por estados hasta que el cliente lo recibe.",
    steps: [
      "Pendiente de pago: si es transferencia, revisa tu banco y, cuando llegue el dinero, cámbialo a «Pagado».",
      "Pagado: prepara los productos (puedes marcarlo «En preparación»).",
      "Enviado: al despachar, elige el courier y escribe el n° de seguimiento. Con «Avisar al cliente por correo» marcado, le llega un correo.",
      "Entregado: cuando el cliente lo recibió o lo retiró en la tienda.",
    ],
    tip: "Al cancelar un pedido el stock vuelve solo. Los pedidos con la etiqueta PRUEBA son de pagos de prueba: no los despaches.",
    more: "pedidos",
  },
  "/admin/solicitudes": {
    intro: "Mensajes que dejan los clientes: contacto, horas para servicios, pedidos especiales de repuestos, cotizaciones de ramal y solicitudes sobre sus datos.",
    steps: [
      "Abre la solicitud y contacta al cliente (el botón de WhatsApp ya trae un saludo).",
      "Cambia el estado a «Contactado» o «Agendado» para saber en qué va.",
      "Ciérrala cuando esté resuelta. Si era una hora de la agenda, el horario vuelve a quedar libre.",
    ],
    tip: "Las solicitudes de datos personales tienen plazo legal de respuesta: aparece en cada una.",
    more: "solicitudes",
  },
  "/admin/agenda": {
    intro: "Las horas que piden tus clientes y los días y horarios en que atiendes en cada lugar.",
    steps: [
      "Arriba ves las próximas horas pedidas, ordenadas por día.",
      "Abajo defines cada lugar: si atiendes todas las semanas o solo en fechas de visita, los días y los horarios.",
      "Bloquea los días que no atenderás (feriados, viajes) para que no se puedan pedir.",
    ],
    tip: "Una hora pedida deja de ofrecerse a otros clientes hasta que cierres la solicitud.",
    more: "agenda",
  },
  "/admin/productos": {
    intro: "Tu catálogo: lo que se ve y se vende en la tienda.",
    steps: [
      "Usa «Nuevo producto» para agregar uno: nombre, precio, stock, categoría y fotos.",
      "Para cambiar precio o stock, abre el producto, edítalo y guarda.",
      "«Activo» lo muestra en la tienda; «Borrador» lo oculta. Sin precio no se puede activar.",
      "Marca «Destacado» para que aparezca en la portada.",
    ],
    tip: "La primera foto es la principal. Las fotos se achican solas al subirlas; idealmente cuadradas.",
    more: "productos",
  },
  "/admin/categorias": {
    intro: "Los grupos del catálogo (FuelTech, Sensores, Red Line…). Aparecen en el menú de la tienda.",
    steps: ["Crea, renombra u ordena categorías.", "Asigna la categoría a cada producto desde su ficha."],
    tip: "Una categoría sin productos activos no se muestra en la tienda.",
  },
  "/admin/marcas": {
    intro: "Las marcas de los productos. Aparecen en la franja de marcas y como filtro del catálogo.",
    steps: ["Agrega la marca una vez y luego elígela en cada producto."],
  },
  "/admin/vehiculos": {
    intro: "Marcas y modelos de autos, para indicar con qué autos es compatible cada producto.",
    steps: [
      "Agrega la marca y sus modelos.",
      "En la ficha de un producto, en «Compatibilidad», elige los autos y los años.",
    ],
    tip: "Si un producto sirve para cualquier auto, márcalo como «Universal» y no necesitas esto.",
  },
  "/admin/servicios": {
    intro: "Los servicios del taller (programación, instalación, arneses…) que se muestran y se agendan en la página de servicios.",
    steps: ["Edita nombre, descripción, precio «desde» y duración.", "Desactiva los que no ofrezcas por ahora."],
  },
  "/admin/ramales": {
    intro: "Los precios que usa el cotizador de ramales de la tienda para calcular un valor aproximado.",
    steps: [
      "Pon el precio de cada computadora, sensor y extra.",
      "Configura tu mano de obra base y por sensor.",
      "Revisa la vista previa: así verá el cliente el cálculo.",
    ],
    tip: "El margen define el rango «desde–hasta» que ve el cliente. El valor final lo confirmas tú.",
  },
  "/admin/configuracion": {
    intro: "Los datos de tu tienda: contacto, medios de pago, despachos y el aviso «Próximamente».",
    steps: [
      "Completa correo, teléfono, dirección y horario: se muestran en la tienda y en los correos.",
      "En «Medios de pago», ingresa los datos bancarios para transferencias.",
      "En «Entregas y despachos», ajusta las tarifas por región y el monto de despacho gratis.",
      "Cuando quieras abrir la tienda al público, desactiva el aviso «Próximamente».",
    ],
    tip: "Cada cambio se ve en la tienda apenas guardas.",
    more: "abrir",
  },
  "/admin/nosotros": {
    intro: "La página «Quiénes somos»: tu historia, foto, logros, proyectos y videos.",
    steps: [
      "Sube una foto tuya y escribe tu historia (separa párrafos con una línea en blanco).",
      "Agrega proyectos con foto, título y qué se hizo.",
      "Pega los links de tus reels de Instagram, uno por línea.",
    ],
    tip: "Usa solo datos reales en los logros: dan mucha confianza si son verdaderos.",
  },
  "/admin/usuarios": {
    intro: "Las personas que pueden entrar a este panel.",
    steps: ["Crea un usuario para cada persona que te ayude.", "Cambia tu contraseña cuando quieras."],
    tip: "Al cambiar tu contraseña se cierran las sesiones abiertas en otros equipos.",
  },
  "/admin/integraciones": {
    intro: "Pruebas de conexión con otros sistemas (por ejemplo, Fullpyme). No es necesario para vender.",
    steps: ["Solo úsala si estás probando una integración."],
  },
  "/admin/privacidad": {
    intro: "Lo que pide la ley de datos personales: registro de solicitudes y exportación de datos de un cliente.",
    steps: ["Busca a un cliente por correo para ver o exportar sus datos.", "Responde las solicitudes dentro del plazo."],
  },
};

export type HelpTopic = { id: string; title: string; steps: string[]; tip?: string };

/** Guías por tarea para la página Ayuda. */
export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "productos",
    title: "Agregar o editar un producto",
    steps: [
      "Ve a Productos → «Nuevo producto» (o abre uno existente).",
      "Escribe el nombre, una descripción corta y el precio con IVA incluido.",
      "Indica el stock (unidades disponibles). Con 0 se muestra «Agotado».",
      "Elige la categoría y la marca. Si sirve para cualquier auto, marca «Universal».",
      "Sube las fotos: la primera es la principal.",
      "En «Estado» elige «Activo (visible en la tienda)» y guarda. Ya aparece en la tienda.",
    ],
    tip: "Para cambiar solo el precio o el stock, abre el producto, cambia el número y guarda.",
  },
  {
    id: "pedidos",
    title: "Atender un pedido, de principio a fin",
    steps: [
      "Te llega un aviso por correo y el pedido aparece en Pedidos (con un número rojo en el menú).",
      "Si pagó con Webpay, ya aparece como «Pagado». Si eligió transferencia, aparece «Pendiente de pago».",
      "Transferencia: revisa tu banco. Cuando veas el depósito, abre el pedido y cambia el estado a «Pagado».",
      "Prepara los productos. Puedes marcarlo «En preparación» para que el cliente sepa que avanzas.",
      "Despacho: cambia a «Enviado», elige el courier y escribe el n° de seguimiento. Retiro en tienda: cambia a «Listo para retiro».",
      "Cuando el cliente lo recibe o lo retira, márcalo «Entregado».",
    ],
    tip: "Con «Avisar al cliente por correo» marcado, cada cambio le llega por correo. Si no llega una transferencia, puedes cancelar el pedido y el stock vuelve solo.",
  },
  {
    id: "cancelar",
    title: "Cancelar un pedido o registrar una devolución",
    steps: [
      "Abre el pedido y elige el estado «Cancelado».",
      "Escribe el motivo en «Mensaje para el historial» (opcional).",
      "El stock de los productos vuelve automáticamente.",
    ],
    tip: "Si el cliente pagó, la devolución del dinero la haces tú desde tu banco o desde Transbank.",
  },
  {
    id: "solicitudes",
    title: "Responder mensajes y solicitudes",
    steps: [
      "Ve a Solicitudes. Las nuevas aparecen arriba con la etiqueta «Nueva».",
      "Ábrela y usa el botón de WhatsApp o el correo para contactar al cliente.",
      "Cambia el estado a «Contactado» o «Agendado» para no perder el hilo.",
      "Ciérrala cuando esté resuelta.",
    ],
  },
  {
    id: "agenda",
    title: "Organizar la agenda del taller",
    steps: [
      "En Agenda, en cada lugar, elige si atiendes «todas las semanas» o «solo en fechas de visita».",
      "Marca los días y escribe los horarios disponibles.",
      "Para un viaje a la Quinta Región, agrega las fechas de visita de ese lugar.",
      "Bloquea los días en que no atenderás.",
    ],
    tip: "Los clientes eligen lugar, día y hora en la página de servicios; tú lo confirmas por WhatsApp.",
  },
  {
    id: "webpay",
    title: "Probar un pago con Webpay",
    steps: [
      "Inicia sesión en este panel y, en la misma ventana, abre la tienda.",
      "Agrega un producto al carrito y ve a pagar: verás Webpay con las tarjetas de prueba a la vista.",
      "Usa la tarjeta VISA 4051 8856 0044 6623, CVV 123, cualquier fecha futura.",
      "El pedido queda marcado como PRUEBA: cancélalo para devolver el stock.",
    ],
    tip: "Los clientes no ven Webpay hasta que Transbank entregue las claves de producción.",
  },
  {
    id: "abrir",
    title: "Abrir la tienda al público",
    steps: [
      "Revisa que «Primeros pasos» del Resumen esté completo.",
      "Ve a Configuración → «Aviso Próximamente» y desactívalo.",
      "Guarda. Desde ese momento cualquier persona puede ver y comprar en la tienda.",
    ],
  },
];
