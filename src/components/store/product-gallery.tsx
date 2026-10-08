"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { ProductImage } from "./product-image";

type GalleryImage = { id: number; url: string; alt: string | null };

export function ProductGallery({
  images,
  name,
  icon,
}: {
  images: GalleryImage[];
  name: string;
  icon: string | null;
}) {
  const [index, setIndex] = useState(0);
  const current = images[index];

  return (
    <div className="space-y-3">
      <ProductImage
        src={current?.url ?? null}
        alt={current?.alt || name}
        icon={icon}
        sizes="(min-width: 1024px) 50vw, 100vw"
        eager
        className="aspect-square rounded-3xl border border-line"
      />
      {images.length > 1 && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver imagen ${i + 1} de ${images.length}`}
              aria-current={i === index}
              className={cn(
                "shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-colors",
                i === index ? "border-brand-600" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <ProductImage src={image.url} alt={image.alt || name} sizes="80px" className="size-20" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
