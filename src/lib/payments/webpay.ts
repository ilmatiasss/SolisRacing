import "server-only";
import { randomBytes } from "node:crypto";
import { Environment, IntegrationApiKeys, IntegrationCommerceCodes, Options, WebpayPlus } from "transbank-sdk";
import type { WebpayCommitData } from "../db/schema";

/**
 * Webpay Plus (Transbank).
 *
 * WEBPAY_ENVIRONMENT:
 *  - "integration" (por defecto): ambiente de pruebas de Transbank, solo tarjetas de prueba.
 *  - "production": cobros reales. Requiere WEBPAY_COMMERCE_CODE y WEBPAY_API_KEY.
 *  - "mock": simulador local que no se conecta a Transbank (solo para desarrollo y tests).
 */
export type WebpayEnvironment = "integration" | "production" | "mock";

export function webpayEnvironment(): WebpayEnvironment {
  const value = process.env.WEBPAY_ENVIRONMENT;
  if (value === "production" || value === "mock") return value;
  return "integration";
}

export function isMockAllowed() {
  // Nunca se permite el simulador en el sitio publicado en Vercel (producción).
  return process.env.VERCEL_ENV !== "production";
}

function transaction() {
  const env = webpayEnvironment();
  if (env === "production") {
    const commerceCode = process.env.WEBPAY_COMMERCE_CODE;
    const apiKey = process.env.WEBPAY_API_KEY;
    if (!commerceCode || !apiKey) {
      throw new Error("Faltan WEBPAY_COMMERCE_CODE y/o WEBPAY_API_KEY para operar Webpay en producción.");
    }
    return new WebpayPlus.Transaction(new Options(commerceCode, apiKey, Environment.Production, 30_000));
  }
  return new WebpayPlus.Transaction(
    new Options(
      process.env.WEBPAY_COMMERCE_CODE || IntegrationCommerceCodes.WEBPAY_PLUS,
      process.env.WEBPAY_API_KEY || IntegrationApiKeys.WEBPAY,
      Environment.Integration,
      30_000,
    ),
  );
}

/* --------------------------- Simulador (modo mock) -------------------------- */

type MockTransaction = {
  buyOrder: string;
  sessionId: string;
  amount: number;
  returnUrl: string;
  result?: "approved" | "rejected";
  committed?: boolean;
};

const mockStore = ((globalThis as unknown as { __webpayMock?: Map<string, MockTransaction> }).__webpayMock ??=
  new Map());

export function getMockTransaction(token: string) {
  return mockStore.get(token);
}

export function setMockResult(token: string, result: "approved" | "rejected") {
  const tx = mockStore.get(token);
  if (tx) tx.result = result;
  return tx;
}

function mockCommitData(token: string, tx: MockTransaction): WebpayCommitData {
  const approved = tx.result === "approved";
  return {
    vci: approved ? "TSY" : "TSN",
    amount: tx.amount,
    status: approved ? "AUTHORIZED" : "FAILED",
    buy_order: tx.buyOrder,
    session_id: tx.sessionId,
    card_detail: { card_number: "6623" },
    accounting_date: new Date().toISOString().slice(5, 10).replace("-", ""),
    transaction_date: new Date().toISOString(),
    authorization_code: approved ? token.slice(-6).toUpperCase() : "000000",
    payment_type_code: "VD",
    response_code: approved ? 0 : -1,
    installments_number: 0,
    environment: "mock",
  };
}

/* --------------------------------- API ---------------------------------- */

export async function createWebpayTransaction(params: {
  buyOrder: string;
  sessionId: string;
  amount: number;
  returnUrl: string;
  origin: string;
}): Promise<{ token: string; url: string }> {
  if (webpayEnvironment() === "mock") {
    if (!isMockAllowed()) throw new Error("El simulador de Webpay no está permitido en producción.");
    const token = `mock${randomBytes(24).toString("hex")}`;
    mockStore.set(token, { ...params });
    return { token, url: `${params.origin}/pago/simulado` };
  }
  const response = (await transaction().create(
    params.buyOrder,
    params.sessionId,
    params.amount,
    params.returnUrl,
  )) as { token: string; url: string };
  return { token: response.token, url: response.url };
}

/** Confirma la transacción. Debe llamarse una sola vez, cuando Transbank devuelve al cliente. */
export async function commitWebpayTransaction(token: string): Promise<WebpayCommitData> {
  const env = webpayEnvironment();
  if (env === "mock") {
    const tx = mockStore.get(token);
    if (!tx || tx.committed) throw new Error("Transacción simulada inexistente o ya confirmada.");
    tx.committed = true;
    return mockCommitData(token, tx);
  }
  const response = (await transaction().commit(token)) as WebpayCommitData;
  return { ...response, environment: env };
}

/** Consulta el estado de una transacción (útil si el commit ya se había hecho). */
export async function getWebpayTransactionStatus(token: string): Promise<WebpayCommitData> {
  const env = webpayEnvironment();
  if (env === "mock") {
    const tx = mockStore.get(token);
    if (!tx) throw new Error("Transacción simulada inexistente.");
    return mockCommitData(token, tx);
  }
  const response = (await transaction().status(token)) as WebpayCommitData;
  return { ...response, environment: env };
}

export function isApproved(result: WebpayCommitData) {
  return result.response_code === 0 && result.status === "AUTHORIZED";
}
