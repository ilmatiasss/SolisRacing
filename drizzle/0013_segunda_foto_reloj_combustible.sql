-- Segunda foto del reloj de presión de combustible (detalle). Solo si el producto existe y aún no la tiene.
INSERT INTO "product_images" ("product_id", "url", "alt", "sort_order")
SELECT p."id", '/catalogo/reloj-de-presion-de-combustible-mecanico-detalle.webp', p."name" || ' (detalle)', 1
FROM "products" p
WHERE p."sku" = 'SR-REL-004'
  AND NOT EXISTS (
    SELECT 1 FROM "product_images" i
    WHERE i."product_id" = p."id" AND i."url" = '/catalogo/reloj-de-presion-de-combustible-mecanico-detalle.webp'
  );
