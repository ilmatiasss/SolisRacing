import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** Carpeta local de subidas (solo desarrollo o servidores propios con disco persistente). */
export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "uploads");

function blobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Guarda una imagen y devuelve su URL pública. En Vercel usa Vercel Blob; en local,
 * la carpeta ./uploads (servida por la ruta /uploads/...).
 */
export async function storeImage(file: File, folder = "productos"): Promise<string> {
  const extension = EXTENSIONS[file.type];
  if (!extension) throw new Error("Formato no soportado. Usa JPG, PNG, WebP o AVIF.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("La imagen supera los 4 MB.");

  const name = `${folder}/${new Date().getFullYear()}/${randomUUID()}.${extension}`;
  if (blobConfigured()) {
    const blob = await put(name, file, { access: "public", contentType: file.type });
    return blob.url;
  }
  if (process.env.VERCEL) {
    throw new Error(
      "Para subir imágenes en Vercel conecta un almacenamiento Blob (Storage → Blob) y vuelve a desplegar.",
    );
  }
  const target = path.join(LOCAL_UPLOAD_DIR, name);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

/** Elimina una imagen subida (no falla si ya no existe). */
export async function deleteStoredImage(url: string) {
  try {
    if (url.startsWith("/uploads/")) {
      const relative = url.slice("/uploads/".length);
      const target = path.resolve(LOCAL_UPLOAD_DIR, relative);
      if (target.startsWith(LOCAL_UPLOAD_DIR + path.sep)) await unlink(target);
    } else if (url.includes(".blob.vercel-storage.com") && blobConfigured()) {
      await del(url);
    }
  } catch (error) {
    console.warn("No se pudo eliminar la imagen", url, error);
  }
}
