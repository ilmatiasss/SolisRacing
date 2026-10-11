/*
 * Aviso «Próximamente»: se muestra sobre la tienda (desenfocada) a quien entra por el dominio
 * público. Los dominios de prueba (*.vercel.app, localhost) ven la tienda completa, para seguir
 * trabajando en paralelo. Con ?preview=1 cualquier navegador ve la tienda (queda guardado) y con
 * ?preview=0 ve el aviso como visitante.
 */

/** Dominios donde se ve la tienda directamente, sin el aviso. */
export const PREVIEW_HOSTS = String.raw`(^|\.)vercel\.app$|^localhost$|^127\.0\.0\.1$`;
export const PREVIEW_STORAGE_KEY = "solis-preview";
/** Segundos tras los cuales se congelan las animaciones de fondo (ahorra batería detrás del desenfoque). */
export const COMING_SOON_SETTLE_MS = 3500;

/** Corre antes de pintar: marca <html data-preview> cuando hay que ver la tienda sin el aviso. */
export const PREVIEW_SCRIPT = `(function(){var d=document.documentElement,f=null;try{var q=new URLSearchParams(location.search).get("preview");if(q==="1"||q==="0")localStorage.setItem("${PREVIEW_STORAGE_KEY}",q);f=localStorage.getItem("${PREVIEW_STORAGE_KEY}")}catch(e){}if(f==="1"||(f!=="0"&&new RegExp(${JSON.stringify(PREVIEW_HOSTS)}).test(location.hostname)))d.dataset.preview="1"})()`;

/** Corre tras la tienda: en vista previa la deja usable; para visitantes congela las animaciones de fondo. */
export const SETTLE_SCRIPT = `(function(){var d=document.documentElement;if(d.dataset.preview){var e=document.getElementById("tienda");if(e)e.inert=false}else setTimeout(function(){d.dataset.settled="1"},${COMING_SOON_SETTLE_MS})})()`;
