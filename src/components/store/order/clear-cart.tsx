"use client";

import { Printer } from "lucide-react";
import { useEffect } from "react";
import { cartStore } from "../cart/cart-store";
import { buttonClasses } from "@/components/ui/button";

/** Vacía el carrito cuando el pedido quedó confirmado. */
export function ClearCartOnMount() {
  useEffect(() => {
    cartStore.clear();
  }, []);
  return null;
}

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClasses({ variant: "outline", size: "sm" })}>
      <Printer className="size-4" />
      Imprimir comprobante
    </button>
  );
}
