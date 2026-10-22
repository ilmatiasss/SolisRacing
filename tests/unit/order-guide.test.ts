import { describe, expect, it } from "vitest";
import { orderNextStep, orderStages } from "@/lib/order-guide";
import { SECTION_GUIDES, HELP_TOPICS } from "@/components/admin/guides";
import { ADMIN_NAV } from "@/components/admin/nav";

const base = { deliveryMethod: "shipping" } as const;

describe("Qué hacer ahora en un pedido", () => {
  it("un pago con Webpay pendiente no requiere acción", () => {
    expect(orderNextStep({ ...base, status: "pending" }).tone).toBe("wait");
  });

  it("un pedido pagado pide prepararlo", () => {
    expect(orderNextStep({ ...base, status: "paid" }).tone).toBe("action");
  });

  it("un pedido de prueba avisa que no se despache", () => {
    const step = orderNextStep({ ...base, status: "paid", testPayment: true });
    expect(step.tone).toBe("warning");
    expect(orderNextStep({ ...base, status: "cancelled", testPayment: true }).tone).toBe("done");
  });

  it("habla de retiro o de despacho según la entrega", () => {
    expect(orderNextStep({ ...base, status: "paid", deliveryMethod: "pickup" }).text).toContain("Listo para retiro");
    expect(orderNextStep({ ...base, status: "paid" }).text).toContain("n° de seguimiento");
    expect(orderNextStep({ ...base, status: "processing", deliveryMethod: "shipping_collect" }).text).toContain("por pagar");
  });

  it("marca las etapas hechas, la actual y las que faltan", () => {
    expect(orderStages({ status: "pending", deliveryMethod: "shipping" }).map((s) => s.state)).toEqual(["current", "todo", "todo", "todo"]);
    expect(orderStages({ status: "processing", deliveryMethod: "shipping" }).map((s) => s.state)).toEqual(["done", "current", "todo", "todo"]);
    expect(orderStages({ status: "shipped", deliveryMethod: "pickup" }).map((s) => s.label)).toContain("Listo para retiro");
    expect(orderStages({ status: "delivered", deliveryMethod: "shipping" }).every((s) => s.state === "done")).toBe(true);
    expect(orderStages({ status: "cancelled", deliveryMethod: "shipping" })).toEqual([]);
  });
});

describe("Guías del panel", () => {
  it("cada sección del menú tiene su guía y los enlaces a la ayuda existen", () => {
    const topics = new Set(HELP_TOPICS.map((topic) => topic.id));
    for (const item of ADMIN_NAV.flatMap((group) => group.items)) {
      if (item.href === "/admin/ayuda") continue;
      expect(SECTION_GUIDES[item.href], item.href).toBeDefined();
    }
    for (const guide of Object.values(SECTION_GUIDES)) {
      if (guide.more) expect(topics.has(guide.more), guide.more).toBe(true);
    }
  });
});
