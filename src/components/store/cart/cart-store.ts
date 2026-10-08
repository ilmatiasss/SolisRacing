"use client";

import { useSyncExternalStore } from "react";

export type CartItem = {
  productId: number;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  /** Stock conocido al agregar: limita la cantidad en el carrito. */
  maxQuantity: number;
};

const STORAGE_KEY = "solis-racing-cart-v1";
const MAX_LINE_QUANTITY = 99;
const EMPTY: CartItem[] = [];

let items: CartItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    Number.isInteger(item.productId) &&
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    Number.isFinite(item.price) &&
    Number.isInteger(item.quantity) &&
    (item.quantity as number) > 0
  );
}

function readStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(isCartItem).map((item) => ({
      ...item,
      imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : null,
      maxQuantity: Number.isInteger(item.maxQuantity) ? item.maxQuantity : MAX_LINE_QUANTITY,
    }));
  } catch {
    return EMPTY;
  }
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  items = readStorage();
}

function commit(next: CartItem[]) {
  items = next.length ? next : EMPTY;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Modo privado o almacenamiento lleno: el carrito sigue funcionando en memoria.
  }
  for (const listener of listeners) listener();
}

function clampQuantity(quantity: number, max: number) {
  const limit = Math.max(0, Math.min(max, MAX_LINE_QUANTITY));
  return Math.max(0, Math.min(Math.floor(quantity), limit));
}

export const cartStore = {
  subscribe(listener: () => void) {
    ensureLoaded();
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      items = readStorage();
      for (const l of listeners) l();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
  getSnapshot(): CartItem[] {
    ensureLoaded();
    return items;
  },
  getServerSnapshot(): CartItem[] {
    return EMPTY;
  },
  add(item: Omit<CartItem, "quantity">, quantity = 1) {
    ensureLoaded();
    const existing = items.find((line) => line.productId === item.productId);
    if (existing) {
      const nextQuantity = clampQuantity(existing.quantity + quantity, item.maxQuantity);
      commit(
        items.map((line) =>
          line.productId === item.productId ? { ...line, ...item, quantity: Math.max(1, nextQuantity) } : line,
        ),
      );
    } else {
      const nextQuantity = clampQuantity(quantity, item.maxQuantity);
      if (nextQuantity > 0) commit([...items, { ...item, quantity: nextQuantity }]);
    }
  },
  setQuantity(productId: number, quantity: number) {
    ensureLoaded();
    commit(
      items.flatMap((line) => {
        if (line.productId !== productId) return [line];
        const next = clampQuantity(quantity, line.maxQuantity);
        return next > 0 ? [{ ...line, quantity: next }] : [];
      }),
    );
  },
  remove(productId: number) {
    ensureLoaded();
    commit(items.filter((line) => line.productId !== productId));
  },
  /**
   * Actualiza precio/stock/nombre con datos frescos del servidor. Los productos no
   * disponibles se quitan; los que no vienen en `updates` quedan igual.
   */
  sync(updates: Array<Pick<CartItem, "productId"> & Partial<CartItem> & { available: boolean }>) {
    ensureLoaded();
    const byId = new Map(updates.map((u) => [u.productId, u]));
    commit(
      items.flatMap((line) => {
        const update = byId.get(line.productId);
        if (!update) return [line];
        if (!update.available) return [];
        const maxQuantity = update.maxQuantity ?? line.maxQuantity;
        const quantity = clampQuantity(line.quantity, maxQuantity);
        if (quantity === 0) return [];
        return [
          {
            ...line,
            name: update.name ?? line.name,
            slug: update.slug ?? line.slug,
            price: update.price ?? line.price,
            imageUrl: update.imageUrl !== undefined ? update.imageUrl : line.imageUrl,
            maxQuantity,
            quantity,
          },
        ];
      }),
    );
  },
  clear() {
    ensureLoaded();
    commit(EMPTY);
  },
};

export function useCartItems(): CartItem[] {
  return useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
}

export function cartTotals(lines: CartItem[]) {
  let count = 0;
  let subtotal = 0;
  for (const line of lines) {
    count += line.quantity;
    subtotal += line.price * line.quantity;
  }
  return { count, subtotal };
}

/* ------------------------- Estado del panel lateral ------------------------- */

let drawerOpen = false;
const drawerListeners = new Set<() => void>();

export const cartDrawer = {
  subscribe(listener: () => void) {
    drawerListeners.add(listener);
    return () => drawerListeners.delete(listener);
  },
  get: () => drawerOpen,
  set(open: boolean) {
    drawerOpen = open;
    for (const listener of drawerListeners) listener();
  },
};

export function useCartDrawer() {
  const open = useSyncExternalStore(cartDrawer.subscribe, cartDrawer.get, () => false);
  return { open, setOpen: cartDrawer.set };
}
