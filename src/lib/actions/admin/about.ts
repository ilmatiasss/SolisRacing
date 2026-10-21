"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { invalidHighlightLines, isImageUrl, MAX_PROJECTS, normalizeProjects } from "@/lib/about";
import { readStoreSettings, saveStoreSettings, SETTINGS_TAG } from "@/lib/data/settings";
import { invalidInstagramLines } from "@/lib/instagram";

export type AboutState = { ok?: boolean; error?: string; message?: string };

const field = (formData: FormData, name: string, max: number) => String(formData.get(name) ?? "").trim().slice(0, max);

/** Guarda «Quiénes somos» (Panel → Quiénes somos): la persona, su historia, logros, proyectos y videos. */
export async function saveAbout(_prev: AboutState, formData: FormData): Promise<AboutState> {
  await requireAdmin();
  const name = field(formData, "name", 80);
  const role = field(formData, "role", 120);
  const photo = field(formData, "photo", 500);
  const story = field(formData, "story", 4000);
  const highlights = field(formData, "highlights", 1000);
  const instagramPosts = field(formData, "instagramPosts", 4000);

  let rawProjects: unknown;
  try {
    rawProjects = JSON.parse(String(formData.get("projects") ?? "[]"));
  } catch {
    return { error: "No se pudieron leer los proyectos. Recarga la página e intenta de nuevo." };
  }
  if (!Array.isArray(rawProjects)) return { error: "No se pudieron leer los proyectos." };
  if (rawProjects.length > MAX_PROJECTS) return { error: `Puedes mostrar hasta ${MAX_PROJECTS} proyectos.` };
  const incomplete = rawProjects.findIndex(
    (project) => !String(project?.title ?? "").trim() || !isImageUrl(String(project?.image ?? "")),
  );
  if (incomplete !== -1) return { error: `Proyecto ${incomplete + 1}: necesita una foto y un título.` };

  if (photo && !isImageUrl(photo)) return { error: "La foto no es válida. Súbela de nuevo." };
  const badHighlight = invalidHighlightLines(highlights)[0];
  if (badHighlight) return { error: `Logros: «${badHighlight.slice(0, 60)}» debe ser «valor | texto».` };
  const badPost = invalidInstagramLines(instagramPosts)[0];
  if (badPost) return { error: `Videos de Instagram: «${badPost.slice(0, 60)}» no es un link de publicación de Instagram.` };

  const settings = await readStoreSettings();
  await saveStoreSettings({
    ...settings,
    instagramPosts,
    about: { name, role, photo, story, highlights, projects: normalizeProjects(rawProjects) },
  });
  updateTag(SETTINGS_TAG);
  return { ok: true, message: "Guardado. «Quiénes somos» ya muestra los cambios." };
}
