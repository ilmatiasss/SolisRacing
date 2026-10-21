"use client";

import { ExternalLink, Play } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { InstagramIcon } from "@/components/icons";

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

/*
 * Consentimiento para contenido de Instagram: el script de Meta puede usar cookies propias, así que
 * solo se carga si la persona lo acepta (queda recordado en este navegador; ver /privacidad).
 */
const CONSENT_KEY = "solis-instagram-ok";
const CONSENT_EVENT = "solis-instagram-consent";

function readConsent() {
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeConsent(callback: () => void) {
  window.addEventListener(CONSENT_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CONSENT_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function giveConsent() {
  try {
    window.localStorage.setItem(CONSENT_KEY, "1");
  } catch {
    // Sin almacenamiento (modo privado): se carga igual, solo por esta visita.
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

/**
 * Publicación pública de Instagram. Hasta que la persona acepta cargar contenido de Instagram se
 * muestra una tarjeta con el título y un enlace; después se incrusta con el método oficial y el
 * script solo se descarga cuando la publicación está por aparecer en pantalla.
 */
export function InstagramPost({ url, label }: { url: string; label: string }) {
  const consent = useInstagramConsent();
  if (!consent) return <InstagramPlaceholder url={url} label={label} />;
  return <InstagramEmbed url={url} label={label} />;
}

function useInstagramConsent() {
  return useSyncExternalStore(subscribeConsent, readConsent, () => false);
}

/** Aviso único sobre la galería (en vez de repetirlo en cada video) hasta que se acepta. */
export function InstagramConsentNote() {
  const consent = useInstagramConsent();
  if (consent) return null;
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted">
        Los videos se cargan desde Instagram (Meta), que puede usar sus propias cookies.
      </p>
      <button
        type="button"
        onClick={giveConsent}
        className="shrink-0 cursor-pointer rounded-lg bg-white px-4 py-2 font-semibold text-zinc-900 transition-colors hover:bg-zinc-200"
      >
        Mostrar los videos
      </button>
    </div>
  );
}

function InstagramPlaceholder({ url, label }: { url: string; label: string }) {
  return (
    <div className="relative flex aspect-[4/5] w-full flex-col overflow-hidden rounded-lg border border-line-strong bg-[radial-gradient(circle_at_50%_40%,rgba(220,38,38,0.22),transparent_65%)] bg-surface">
      <button
        type="button"
        onClick={giveConsent}
        aria-label={`Ver «${label}» aquí (carga contenido de Instagram)`}
        className="group flex flex-1 cursor-pointer flex-col items-center justify-center gap-3"
      >
        <span className="flex size-16 items-center justify-center rounded-full bg-white text-zinc-900 shadow-[0_0_40px_rgba(255,255,255,0.15)] transition-transform group-hover:scale-105">
          <Play className="ml-1 size-7 fill-current" />
        </span>
        <span className="text-sm font-semibold">Ver el video</span>
      </button>
      <div className="flex items-center justify-between gap-3 border-t border-line bg-black/30 px-4 py-3 text-xs">
        <span className="flex min-w-0 items-center gap-2 text-zinc-300">
          <InstagramIcon className="size-4 shrink-0" />
          <span className="truncate">{label}</span>
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir «${label}» en Instagram`}
          className="flex shrink-0 items-center gap-1 font-semibold text-zinc-300 hover:text-white"
        >
          Instagram <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  );
}

function InstagramEmbed({ url, label }: { url: string; label: string }) {
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
