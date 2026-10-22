-- Segunda foto del sensor Bosch LSU 4.9 (detalle del conector). Solo si el producto existe y aún no la tiene.
INSERT INTO "product_images" ("product_id", "url", "alt", "sort_order")
SELECT p."id", '/catalogo/sensor-wideband-bosch-lsu-4-9-detalle.webp', p."name" || ' (detalle)', 1
FROM "products" p
WHERE p."sku" = 'SR-SEN-002'
  AND NOT EXISTS (
    SELECT 1 FROM "product_images" i
    WHERE i."product_id" = p."id" AND i."url" = '/catalogo/sensor-wideband-bosch-lsu-4-9-detalle.webp'
  );
