-- Segunda foto del Fitting ORB (vista lateral). Solo si el producto existe y aún no la tiene.
INSERT INTO "product_images" ("product_id", "url", "alt", "sort_order")
SELECT p."id", '/catalogo/sensor-wideband-bosch-fitting-orb-detalle.webp', p."name" || ' (detalle)', 1
FROM "products" p
WHERE p."sku" = 'SR-FIT-002'
  AND NOT EXISTS (
    SELECT 1 FROM "product_images" i
    WHERE i."product_id" = p."id" AND i."url" = '/catalogo/sensor-wideband-bosch-fitting-orb-detalle.webp'
  );
