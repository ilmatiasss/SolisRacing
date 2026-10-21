import { cn } from "@/lib/cn";
import type { InstagramPostItem } from "@/lib/instagram";
import { InstagramConsentNote, InstagramPost } from "./instagram-post";

/**
 * Videos de Instagram en una fila que se desliza (como los reels): no deja huecos con cualquier
 * cantidad de videos y respeta el ancho mínimo del reproductor de Instagram (326 px).
 */
export function InstagramGallery({ posts }: { posts: InstagramPostItem[] }) {
  return (
    <div>
      <InstagramConsentNote />
      <ul
        className={cn(
          "-mx-4 flex snap-x snap-mandatory items-start gap-5 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0",
          // Borde que se desvanece cuando hay más videos hacia la derecha.
          posts.length > 1 && "max-lg:[mask-image:linear-gradient(to_right,black_85%,transparent)]",
          posts.length > 3 && "lg:[mask-image:linear-gradient(to_right,black_88%,transparent)]",
        )}
      >
        {posts.map((post) => {
          const label = post.title || post.tag || "Video en Instagram";
          return (
            <li key={post.url} className="w-[min(326px,82vw)] shrink-0 snap-start space-y-3">
              {(post.tag || post.title) && (
                <div>
                  {post.tag && <p className="text-xs font-bold tracking-[0.15em] text-brand-500 uppercase">{post.tag}</p>}
                  {post.title && <p className="font-display text-xl leading-tight font-bold uppercase">{post.title}</p>}
                </div>
              )}
              <InstagramPost url={post.url} label={label} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
