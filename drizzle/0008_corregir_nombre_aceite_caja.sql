-- El catálogo inicial traía «Aceite Gear clanes Red Line» (error de transcripción). Solo se corrige si
-- el nombre sigue igual: si la tienda ya lo cambió en el panel, se respeta.
UPDATE "products"
SET "name" = 'Aceite de caja Lightweight ShockProof Red Line',
    "short_description" = 'Aceite Red Line Lightweight ShockProof para caja de cambios y diferencial.',
    "search_text" = replace("search_text", 'aceite gear clanes red line', 'aceite de caja lightweight shockproof red line'),
    "updated_at" = now()
WHERE "name" = 'Aceite Gear clanes Red Line';
