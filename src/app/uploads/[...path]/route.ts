import { readFile } from "node:fs/promises";
import path from "node:path";
import { LOCAL_UPLOAD_DIR } from "@/lib/storage";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

/** Sirve las imágenes subidas en local (en Vercel se usan URLs de Vercel Blob). */
export async function GET(_request: Request, { params }: RouteContext<"/uploads/[...path]">) {
  const segments = (await params).path;
  const target = path.resolve(LOCAL_UPLOAD_DIR, ...segments);
  const type = TYPES[path.extname(target).toLowerCase()];
  if (!type || !target.startsWith(LOCAL_UPLOAD_DIR + path.sep)) {
    return new Response("No encontrado", { status: 404 });
  }
  try {
    const file = await readFile(target);
    return new Response(file, {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}
