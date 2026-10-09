/** Publicación o reel de Instagram que se muestra en «Quiénes somos» y en la portada. */
export type InstagramPostItem = {
  /** Link canónico de la publicación (https://www.instagram.com/p/…/ o /reel/…/). */
  url: string;
  title: string;
  /** Etiqueta corta sobre el título: un auto, una marca o el tipo de trabajo. */
  tag: string;
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
 * Lee la lista de videos del panel: una publicación por línea, con el formato
 * `link | título | etiqueta` (título y etiqueta son opcionales). Las líneas que no son un link válido se ignoran.
 */
export function parseInstagramPosts(text: string): InstagramPostItem[] {
  const posts: InstagramPostItem[] = [];
  for (const line of text.split("\n")) {
    const [link = "", title = "", tag = ""] = line.split("|").map((part) => part.trim());
    const url = instagramPostUrl(link);
    if (url && !posts.some((post) => post.url === url)) posts.push({ url, title, tag });
  }
  return posts;
}

/** Líneas con contenido que no son un link de publicación de Instagram (para avisar en el panel). */
export function invalidInstagramLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !instagramPostUrl(line.split("|")[0] ?? ""));
}
