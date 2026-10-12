import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/store/legal-page";
import { getStoreSettings } from "@/lib/data/settings";
import { INQUIRY_RETENTION_MONTHS, ORDER_RETENTION_YEARS, PRIVACY_RESPONSE_DAYS, PRIVACY_RIGHTS } from "@/lib/privacy";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Cómo tratamos tus datos personales y cómo ejercer tus derechos (Ley 19.628 y Ley 21.719).",
  alternates: { canonical: "/privacidad" },
};

const UPDATED_AT = "12 de octubre de 2026";

/*
 * Política de tratamiento de datos personales (Ley 19.628, modificada por la Ley 21.719).
 * Los datos de la empresa salen de Panel → Configuración; los plazos, de lib/privacy.
 * Conviene que un abogado la revise antes de publicarla como definitiva.
 */
export default async function PrivacyPage() {
  const s = await getStoreSettings();
  const contact = s.email || (s.whatsapp ? `WhatsApp ${s.whatsapp}` : "");
  const address = [s.address, s.city].filter(Boolean).join(", ");

  return (
    <LegalPage
      title="Política de privacidad"
      intro={`Cómo tratamos tus datos personales y cómo ejercer tus derechos. Última actualización: ${UPDATED_AT}.`}
    >
      <section>
        <h2>1. Quién es responsable de tus datos</h2>
        <p>
          El responsable del tratamiento es <strong>{s.legalName || s.storeName}</strong>
          {s.legalRut && <>, RUT {s.legalRut}</>}
          {address && <>, con domicilio en {address}</>}. Para cualquier consulta sobre tus datos puedes escribirnos
          {contact ? ` a ${contact}` : ""} o usar el{" "}
          <Link href="/privacidad/derechos" className="text-brand-400 hover:underline">
            formulario de derechos
          </Link>
          .
        </p>
        <p>
          Esta política se rige por la Ley N° 19.628 sobre protección de la vida privada, modificada por la Ley N° 21.719, y
          por las demás normas chilenas aplicables.
        </p>
      </section>

      <section>
        <h2>2. Qué datos tratamos</h2>
        <p>Solo pedimos los datos necesarios para cada cosa que haces en el sitio:</p>
        <ul>
          <li>
            <strong>Compras:</strong> nombre, correo, teléfono, RUT (para la boleta o factura), dirección de despacho y, si
            pides factura, razón social, giro y dirección de la empresa. También los productos, montos y el estado del pago.{" "}
            <strong>No recibimos ni guardamos los datos de tu tarjeta</strong>: el pago con tarjeta se hace directamente en
            Webpay (Transbank).
          </li>
          <li>
            <strong>Agenda de servicios:</strong> nombre, correo, teléfono, tu auto, el lugar, la fecha y la hora que pides, y
            lo que nos cuentes en el mensaje.
          </li>
          <li>
            <strong>Cotizador de ramales y pedido especial de repuestos:</strong> datos de tu motor o auto (marca, modelo,
            computadora, sensores) y tus datos de contacto.
          </li>
          <li>
            <strong>Contacto y solicitudes de derechos:</strong> nombre, correo, teléfono, RUT si lo indicas, y tu mensaje.
          </li>
          <li>
            <strong>Datos técnicos:</strong> nuestro proveedor de alojamiento registra datos como la dirección IP y el
            navegador para la seguridad y el funcionamiento del sitio.
          </li>
        </ul>
        <p>No pedimos datos sensibles (salud, origen racial, ideología, datos biométricos ni similares).</p>
      </section>

      <section>
        <h2>3. Para qué los usamos y con qué base legal</h2>
        <ul>
          <li>
            <strong>Procesar, cobrar y despachar tu pedido</strong>, y avisarte de su estado: es necesario para cumplir el
            contrato de compra.
          </li>
          <li>
            <strong>Emitir la boleta o factura y llevar la contabilidad</strong>: lo exige la ley tributaria.
          </li>
          <li>
            <strong>Responder tus solicitudes, cotizaciones y pedidos de hora</strong>, y coordinarlos contigo por correo,
            teléfono o WhatsApp: son medidas que pides tú antes de contratar un servicio o comprar.
          </li>
          <li>
            <strong>Atender tus derechos sobre tus datos</strong> y dejar registro de cómo lo hicimos: lo exige la ley.
          </li>
          <li>
            <strong>Mantener el sitio seguro y prevenir fraudes</strong>: es nuestro interés legítimo, sin afectar tus
            derechos.
          </li>
        </ul>
        <p>
          <strong>No te enviamos publicidad</strong> sin tu consentimiento previo, no vendemos tus datos y no los usamos para
          fines distintos de los indicados aquí.
        </p>
      </section>

      <section>
        <h2>4. Con quién los compartimos</h2>
        <p>Solo con quienes nos ayudan a prestarte el servicio, que tratan tus datos por encargo nuestro y con este fin:</p>
        <ul>
          <li>
            <strong>Transbank (Webpay)</strong>, para procesar los pagos con tarjeta.
          </li>
          <li>
            <strong>Empresas de courier</strong>, para despachar tu pedido (nombre, teléfono y dirección).
          </li>
          <li>
            <strong>Proveedores tecnológicos</strong>: alojamiento del sitio (Vercel), base de datos en la nube y envío de
            correos.
          </li>
          <li>
            <strong>Nuestro sistema de gestión y facturación</strong>, donde registramos las ventas y emitimos los documentos
            tributarios.
          </li>
          <li>
            <strong>Autoridades</strong>, cuando la ley nos obligue (por ejemplo, el Servicio de Impuestos Internos).
          </li>
        </ul>
        <p>
          Algunos de estos proveedores guardan los datos en servidores fuera de Chile (por ejemplo, en Estados Unidos). En esos
          casos trabajamos con empresas que ofrecen garantías adecuadas de protección y seguridad.
        </p>
      </section>

      <section>
        <h2>5. Cuánto tiempo los guardamos</h2>
        <ul>
          <li>
            <strong>Pedidos y documentos tributarios:</strong> {ORDER_RETENTION_YEARS} años, por las obligaciones del Código
            Tributario.
          </li>
          <li>
            <strong>Mensajes, cotizaciones, pedidos de hora y solicitudes de derechos:</strong> hasta{" "}
            {INQUIRY_RETENTION_MONTHS} meses desde que se cierran; después se eliminan automáticamente.
          </li>
          <li>
            <strong>Carrito y borrador del checkout:</strong> quedan solo en tu navegador hasta que compres o los borres.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Tus derechos</h2>
        <p>Puedes ejercer en cualquier momento, sin costo, estos derechos sobre tus datos:</p>
        <ul>
          {PRIVACY_RIGHTS.map((right) => (
            <li key={right.value}>
              <strong>{right.label}:</strong> {right.description.charAt(0).toLowerCase() + right.description.slice(1)}
            </li>
          ))}
        </ul>
        <p>
          Para ejercerlos, completa el{" "}
          <Link href="/privacidad/derechos" className="text-brand-400 hover:underline">
            formulario de derechos
          </Link>
          {s.email && <> o escríbenos a {s.email}</>}. Responderemos dentro de {PRIVACY_RESPONSE_DAYS} días corridos (plazo
          que podemos extender una vez por igual período, avisándote antes). Podemos pedirte que acredites tu identidad para
          proteger tus datos. Si pides la supresión, conservaremos solo lo que la ley nos obligue a guardar y te diremos qué y
          por cuánto tiempo.
        </p>
        <p>
          Si no quedas conforme con nuestra respuesta o no respondemos a tiempo, puedes reclamar ante la Agencia de Protección
          de Datos Personales.
        </p>
      </section>

      <section>
        <h2>7. Cómo protegemos tus datos</h2>
        <p>
          El sitio funciona con conexión cifrada (HTTPS), las contraseñas del panel se guardan cifradas y solo el personal
          autorizado de la tienda accede a tus datos. Los pagos con tarjeta se procesan en el ambiente seguro de Transbank. Si
          ocurriera una vulneración de seguridad que afecte tus datos, la informaremos a la autoridad y a ti cuando la ley lo
          exija.
        </p>
      </section>

      <section>
        <h2>8. Cookies y almacenamiento en tu navegador</h2>
        <ul>
          <li>
            <strong>No usamos cookies de publicidad ni de seguimiento.</strong>
          </li>
          <li>
            Guardamos en tu navegador (almacenamiento local) tu carrito, el borrador del checkout para que no pierdas lo
            escrito, y si aceptaste ver videos de Instagram. Puedes borrarlos desde la configuración de tu navegador.
          </li>
          <li>
            Los videos de Instagram solo se cargan si tú lo aceptas. Al hacerlo, Instagram (Meta) puede usar cookies propias
            según su política de privacidad.
          </li>
          <li>El panel de administración usa una cookie de sesión, solo para el personal de la tienda.</li>
        </ul>
      </section>

      <section>
        <h2>9. Menores de edad</h2>
        <p>
          Nuestros productos y servicios están dirigidos a personas mayores de 18 años. Si eres menor de edad, pide a tu padre,
          madre o tutor que haga la compra o la solicitud.
        </p>
      </section>

      <section>
        <h2>10. Cambios a esta política</h2>
        <p>
          Si cambiamos esta política, publicaremos la nueva versión en esta página con su fecha de actualización. Si el cambio
          es importante, te lo avisaremos.
        </p>
      </section>
    </LegalPage>
  );
}
