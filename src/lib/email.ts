import "server-only";
import { createTransport, type Transporter } from "nodemailer";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) {
    transporter = null;
    return transporter;
  }
  const port = Number(process.env.SMTP_PORT ?? 587);
  transporter = createTransport({
    host,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD ?? "" }
      : undefined,
  });
  return transporter;
}

/**
 * Envía un correo por SMTP. Si SMTP no está configurado, lo muestra en la consola
 * (útil en desarrollo). Nunca lanza errores: un correo fallido no debe romper una compra.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const smtp = getTransporter();
  if (!smtp) {
    console.info(`[correo no enviado: SMTP sin configurar] Para: ${message.to} · Asunto: ${message.subject}`);
    return false;
  }
  try {
    await smtp.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    return true;
  } catch (error) {
    console.error("Error enviando correo:", error);
    return false;
  }
}
