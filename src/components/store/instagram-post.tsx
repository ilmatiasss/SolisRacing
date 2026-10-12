"use client";

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
  const consent = useSyncExternalStore(subscribeConsent, readConsent, () => false);
  if (!consent) return <InstagramPlaceholder url={url} label={label} />;
  return <InstagramEmbed url={url} label={label} />;
}

function InstagramPlaceholder({ url, label }: { url: string; label: string }) {
  return (
    <div className="mx-auto flex aspect-[4/5] w-full max-w-[540px] flex-col items-center justify-center gap-4 rounded-2xl border border-line bg-[radial-gradient(circle_at_30%_20%,rgb(131_58_180/0.25),transparent_55%),radial-gradient(circle_at_80%_90%,rgb(252_176_69/0.18),transparent_50%)] bg-surface p-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-white/10">
        <InstagramIcon className="size-7" />
      </span>
      <p className="font-semibold">{label}</p>
      <button
        type="button"
        onClick={giveConsent}
        className="cursor-pointer rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-200"
      >
        Ver el video aquí
      </button>
      <p className="max-w-xs text-xs text-muted">
        Se cargará contenido de Instagram (Meta), que puede usar sus propias cookies.{" "}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir «${label}» en Instagram`}
          className="underline hover:text-fg"
        >
          O ábrelo en Instagram
        </a>
        .
      </p>
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
