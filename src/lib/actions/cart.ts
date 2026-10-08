"use server";

import { z } from "zod";
import { loadCheckoutProducts } from "@/lib/orders";

export type CartUpdate = {
  productId: number;
  available: boolean;
  name?: string;
  slug?: string;
  price?: number;
  imageUrl?: string | null;
  maxQuantity?: number;
};

/** Devuelve precio, stock y datos vigentes de los productos del carrito. */
export async function refreshCart(productIds: number[]): Promise<CartUpdate[]> {
  const ids = z.array(z.number().int().positive()).max(100).catch([]).parse(productIds);
  const rows = await loadCheckoutProducts(ids);
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.map((productId) => {
    const product = byId.get(productId);
    if (!product || product.status !== "active" || product.stock <= 0) {
      return { productId, available: false };
    }
    return {
      productId,
      available: true,
      name: product.name,
      slug: product.slug,
      price: product.price,
      imageUrl: product.imageUrl,
      maxQuantity: product.stock,
    };
  });
}
