-- Textos del catálogo inicial: «seteo» pasa a «programación». Solo toca los textos originales
-- (si se editaron en el panel, no se tocan). Los slugs de los servicios no cambian.
UPDATE "services" SET "name" = 'Programación de ECU' WHERE "name" = 'Seteo de ECU programable';--> statement-breakpoint
UPDATE "services" SET "summary" = replace("summary", 'la dejamos lista para el seteo.', 'la dejamos lista para programar.') WHERE "summary" LIKE '%la dejamos lista para el seteo.%';--> statement-breakpoint
UPDATE "services" SET "description" = 'Programamos tu ECU según las piezas instaladas y el combustible que usas.' WHERE "description" = 'Seteamos tu ECU programable según las piezas instaladas y el combustible que usas.';--> statement-breakpoint
UPDATE "products" SET "description" = replace("description", 'coordinamos la instalación y el seteo.', 'coordinamos la instalación y la programación.') WHERE "description" LIKE '%coordinamos la instalación y el seteo.%';
