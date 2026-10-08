"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { refreshCart } from "@/lib/actions/cart";
import { formatCLP } from "@/lib/format";
import { cartStore } from "./cart-store";

const subscribeNoop = () => () => {};

/** true solo en el navegador, después de hidratar (evita parpadeos con localStorage). */
export function useHydrated() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

/**
 * Sincroniza el carrito con precios y stock actuales del servidor al montar la página.
 * Devuelve los avisos de cambios para mostrarlos al cliente.
 */
export function useCartRefresh() {
  const [notices, setNotices] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const started = useRef(false);

  const refresh = useCallback(async () => {
    const before = cartStore.getSnapshot();
    if (before.length === 0) return;
    setRefreshing(true);
    try {
      const updates = await refreshCart(before.map((line) => line.productId));
      cartStore.sync(updates);
      const after = new Map(cartStore.getSnapshot().map((line) => [line.productId, line]));
      const messages: string[] = [];
      for (const line of before) {
        const current = after.get(line.productId);
        if (!current) messages.push(`“${line.name}” ya no está disponible y se quitó de tu carrito.`);
        else {
          if (current.price !== line.price) {
            messages.push(`El precio de “${current.name}” cambió a ${formatCLP(current.price)}.`);
          }
          if (current.quantity < line.quantity) {
            messages.push(`Solo quedan ${current.maxQuantity} unidades de “${current.name}”: ajustamos la cantidad.`);
          }
        }
      }
      setNotices(messages);
    } catch {
      // Sin conexión: se mantiene el carrito local, el servidor valida igual al pagar.
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void refresh();
  }, [refresh]);

  return { notices, refreshing, refresh };
}
