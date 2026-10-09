import type { InstagramPostItem } from "@/lib/instagram";
import { InstagramPost } from "./instagram-post";

/** Grilla de publicaciones de Instagram, cada una con su etiqueta y título opcionales encima. */
export function InstagramGallery({ posts }: { posts: InstagramPostItem[] }) {
  return (
    <ul className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => {
        const label = [post.tag, post.title].filter(Boolean).join(" · ") || "Solis Racing Parts";
        return (
          <li key={post.url} className="space-y-3">
            {(post.tag || post.title) && (
              <div>
                {post.tag && <p className="text-xs font-bold tracking-[0.15em] text-brand-500 uppercase">{post.tag}</p>}
                {post.title && <p className="font-display text-xl font-bold uppercase italic">{post.title}</p>}
              </div>
            )}
            <InstagramPost url={post.url} label={label} />
          </li>
        );
      })}
    </ul>
  );
}
