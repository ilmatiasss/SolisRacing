"use client";

import { ArrowLeft, ArrowRight, ImagePlus, LoaderCircle, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { uploadProductImage } from "@/lib/actions/admin/products";
import { cn } from "@/lib/cn";

export type ManagedImage = { url: string; alt: string | null };

const MAX_SIDE = 1600;

/** Reduce y convierte a WebP en el navegador para subir fotos livianas (máx. 1600 px). */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.type === "image/webp" && file.size < 1_000_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
    if (!blob) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp" });
  } catch {
    return file;
  }
}

export function ImageManager({
  images,
  onChange,
  productName,
  onBusyChange,
}: {
  images: ManagedImage[];
  /** Recibe una función de actualización (compatible con el setState de React). */
  onChange: (update: (current: ManagedImage[]) => ManagedImage[]) => void;
  productName: string;
  /** Avisa cuando hay fotos subiéndose (para no guardar el producto a medias). */
  onBusyChange?: (busy: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingUploads = useRef(0);
  const [uploading, setUploading] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!list.length) return;
    setErrors([]);
    setUploading((n) => n + list.length);
    pendingUploads.current += list.length;
    onBusyChange?.(true);
    await Promise.all(
      list.map(async (original) => {
        try {
          const file = await compressImage(original);
          const formData = new FormData();
          formData.set("file", file);
          const result = await uploadProductImage(formData);
          if (result.url) {
            const url = result.url;
            onChange((current) => [...current, { url, alt: null }]);
          } else {
            setErrors((current) => [...current, `${original.name}: ${result.error}`]);
          }
        } catch {
          setErrors((current) => [...current, `${original.name}: no se pudo subir.`]);
        } finally {
          setUploading((n) => n - 1);
          pendingUploads.current -= 1;
          if (pendingUploads.current === 0) onBusyChange?.(false);
        }
      }),
    );
  }

  function move(index: number, delta: number) {
    onChange((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(Math.max(0, Math.min(next.length, index + delta)), 0, item);
      return next;
    });
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <figure key={image.url} className="group relative overflow-hidden rounded-xl border border-line bg-white">
            <div className="relative aspect-square">
              <Image src={image.url} alt={image.alt || productName} fill sizes="200px" className="object-contain p-2" />
            </div>
            {index === 0 && (
              <span className="absolute top-2 left-2 rounded-md bg-zinc-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                Principal
              </span>
            )}
            <figcaption className="flex items-center justify-between gap-1 border-t border-line bg-surface-2 p-1.5">
              <div className="flex gap-1">
                <IconButton label="Mover a la izquierda" disabled={index === 0} onClick={() => move(index, -1)}>
                  <ArrowLeft className="size-3.5" />
                </IconButton>
                <IconButton label="Mover a la derecha" disabled={index === images.length - 1} onClick={() => move(index, 1)}>
                  <ArrowRight className="size-3.5" />
                </IconButton>
                {index > 0 && (
                  <IconButton label="Usar como principal" onClick={() => move(index, -index)}>
                    <Star className="size-3.5" />
                  </IconButton>
                )}
              </div>
              <IconButton label="Quitar imagen" danger onClick={() => onChange((current) => current.filter((_, i) => i !== index))}>
                <Trash2 className="size-3.5" />
              </IconButton>
            </figcaption>
          </figure>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void upload(event.dataTransfer.files);
          }}
          className={cn(
            "flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm text-muted transition-colors",
            dragging ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line-strong hover:border-zinc-400 hover:text-fg",
          )}
        >
          {uploading > 0 ? <LoaderCircle className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
          <span className="px-2 text-center">
            {uploading > 0 ? `Subiendo ${uploading}…` : "Agregar fotos (o arrástralas aquí)"}
          </span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files) void upload(event.target.files);
          event.target.value = "";
        }}
      />
      <p className="mt-2 text-xs text-muted">
        JPG, PNG o WebP. Las fotos se optimizan automáticamente. La primera es la imagen principal; idealmente con fondo blanco.
      </p>
      {errors.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-red-600">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex size-7 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-white hover:text-fg disabled:cursor-not-allowed disabled:opacity-30",
        danger && "hover:text-red-600",
      )}
    >
      {children}
    </button>
  );
}
