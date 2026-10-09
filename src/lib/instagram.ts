/** Publicación de Instagram que se muestra en la galería de proyectos. */
export type ProjectPost = {
  /** Link canónico de la publicación (https://www.instagram.com/p/…/ o /reel/…/). */
  url: string;
  title: string;
  vehicle: string;
};

const POST_URL = /^https?:\/\/(?:www\.)?instagram\.com\/(?:[\w.]+\/)?(p|reel|tv)\/([\w-]+)/i;

/** Normaliza un link de publicación o reel; devuelve null si no es uno. */
export function instagramPostUrl(raw: string): string | null {
  const match = POST_URL.exec(raw.trim());
  if (!match) return null;
  const kind = match[1].toLowerCase() === "tv" ? "p" : match[1].toLowerCase();
  return `https://www.instagram.com/${kind}/${match[2]}/`;
}

/**
 * Lee la lista de proyectos del panel: una publicación por línea, con el formato
 * `link | título | auto` (título y auto son opcionales). Las líneas que no son un link válido se ignoran.
 */
export function parseProjectPosts(text: string): ProjectPost[] {
  const posts: ProjectPost[] = [];
  for (const line of text.split("\n")) {
    const [link = "", title = "", vehicle = ""] = line.split("|").map((part) => part.trim());
    const url = instagramPostUrl(link);
    if (url && !posts.some((post) => post.url === url)) posts.push({ url, title, vehicle });
  }
  return posts;
}

/** Líneas con contenido que no son un link de publicación de Instagram (para avisar en el panel). */
export function invalidProjectLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !instagramPostUrl(line.split("|")[0] ?? ""));
}
