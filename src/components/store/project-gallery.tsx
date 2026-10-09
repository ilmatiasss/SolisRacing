import type { ProjectPost } from "@/lib/instagram";
import { InstagramPost } from "./instagram-post";

/** Grilla de proyectos: cada uno es una publicación de Instagram con su auto y título encima. */
export function ProjectGallery({ posts }: { posts: ProjectPost[] }) {
  return (
    <ul className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => {
        const label = [post.vehicle, post.title].filter(Boolean).join(" · ") || "Proyecto Solis Racing Parts";
        return (
          <li key={post.url} className="space-y-3">
            {(post.vehicle || post.title) && (
              <div>
                {post.vehicle && (
                  <p className="text-xs font-bold tracking-[0.15em] text-brand-500 uppercase">{post.vehicle}</p>
                )}
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
