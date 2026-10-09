"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    instgrm?: { Embeds: { process(): void } };
  }
}

let embedScript: Promise<void> | null = null;

/** Carga una sola vez el script oficial de Instagram para incrustar publicaciones. */
function loadEmbedScript() {
  if (window.instgrm) return Promise.resolve();
  embedScript ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      embedScript = null;
      reject(new Error("No se pudo cargar Instagram"));
    };
    document.body.append(script);
  });
  return embedScript;
}

/**
 * Publicación pública de Instagram incrustada con el método oficial. El script de Instagram solo se
 * descarga cuando la publicación está por aparecer en pantalla (así no pesa en celulares). Mientras
 * tanto, o si Instagram no responde, queda un enlace a la publicación.
 */
export function InstagramPost({ url, label }: { url: string; label: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        loadEmbedScript()
          .then(() => window.instgrm?.Embeds.process())
          .catch(() => {});
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Instagram reemplaza este marcado por su propio iframe: React no maneja los hijos (innerHTML).
  // `url` viene normalizada por lib/instagram (solo letras, números, guiones), así que es segura.
  const markup = `<blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14" style="margin:0;width:100%;min-width:0;max-width:540px;border:0;border-radius:16px;background:#18181b;"><a href="${url}" target="_blank" rel="noopener noreferrer" style="display:block;padding:48px 16px;text-align:center;color:#d4d4d8;font-size:14px;">${escapeHtml(label)} · Ver en Instagram</a></blockquote>`;

  return <div ref={container} className="mx-auto w-full max-w-[540px]" dangerouslySetInnerHTML={{ __html: markup }} />;
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
