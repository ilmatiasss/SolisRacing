-- Si una versión anterior de la migración 0011 llegó a ejecutarse con un nombre de archivo equivocado,
-- se corrige aquí. No hace nada si la URL ya es la correcta.
UPDATE "product_images"
SET "url" = '/catalogo/fitting-orb-detalle.webp'
WHERE "url" = '/catalogo/sensor-wideband-bosch-fitting-orb-detalle.webp';
