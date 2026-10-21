"use client";

import { ArrowDown, ArrowUp, ImagePlus, LoaderCircle, Plus, Save, Trash2, UserRound } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { ActionForm, ActionSubmit } from "@/components/admin/action-form";
import { compressImage } from "@/components/admin/image-manager";
import { Card } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { MAX_PROJECTS, type AboutProject, type AboutSettings } from "@/lib/about";
import { saveAbout } from "@/lib/actions/admin/about";
import { uploadProductImage } from "@/lib/actions/admin/products";
import { cn } from "@/lib/cn";

/**
 * Panel → Quiénes somos: la persona (foto, nombre, rol, historia y logros), los proyectos con
 * foto y los videos de Instagram. Los proyectos viajan como JSON a `saveAbout`.
 */
export function AboutForm({ initial, instagramPosts }: { initial: AboutSettings; instagramPosts: string }) {
  const [photo, setPhoto] = useState(initial.photo);
  const [projects, setProjects] = useState<AboutProject[]>(initial.projects);
  const [uploads, setUploads] = useState(0);
  const busy = uploads > 0;
  const track = (delta: number) => setUploads((n) => n + delta);

  const updateProject = (index: number, patch: Partial<AboutProject>) =>
    setProjects((current) => current.map((project, i) => (i === index ? { ...project, ...patch } : project)));
  const moveProject = (index: number, delta: number) =>
    setProjects((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });

  return (
    <ActionForm action={saveAbout} className="space-y-6">
      <input type="hidden" name="photo" value={photo} />
      <input type="hidden" name="projects" value={JSON.stringify(projects)} />

      <Card
        title="La persona detrás de la tienda"
        description="Se muestra en «Quiénes somos» cuando hay historia o foto. Una foto real, de frente o trabajando en un auto, da mucha confianza."
      >
        <div className="grid gap-6 md:grid-cols-[13rem_1fr]">
          <div>
            <p className="mb-1.5 text-sm font-medium">Foto</p>
            <ImageUpload value={photo} onChange={setPhoto} onBusy={track} aspect="aspect-[4/5]" label="foto" person />
          </div>
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="about-name">
              <Input id="about-name" name="name" defaultValue={initial.name} maxLength={80} />
            </Field>
            <Field label="Rol o especialidad" htmlFor="about-role" optional hint="Ej: Fundador · Preparación y programación FuelTech.">
              <Input id="about-role" name="role" defaultValue={initial.role} maxLength={120} />
            </Field>
            <Field
              label="Historia"
              htmlFor="about-story"
              optional
              className="sm:col-span-2"
              hint="Cómo empezó, en qué se especializa, con qué autos o campeonatos ha trabajado. Separa los párrafos con una línea en blanco."
            >
              <Textarea id="about-story" name="story" rows={7} defaultValue={initial.story} maxLength={4000} />
            </Field>
            <Field
              label="Logros destacados"
              htmlFor="about-highlights"
              optional
              className="sm:col-span-2"
              hint="Hasta 4, uno por línea: valor | texto. Ej: +10 | años preparando autos. Usa solo datos reales."
            >
              <Textarea
                id="about-highlights"
                name="highlights"
                rows={4}
                defaultValue={initial.highlights}
                placeholder={"+10 | años preparando autos\n+300 | autos programados"}
                className="font-mono text-xs"
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card
        title="Proyectos"
        description="Autos en los que has trabajado: una foto, un título y qué se hizo. Se muestran como galería en «Quiénes somos»."
      >
        {projects.length === 0 && (
          <p className="mb-4 text-sm text-muted">Aún no hay proyectos. Agrega el primero con una buena foto del auto.</p>
        )}
        <ol className="space-y-4">
          {projects.map((project, index) => (
            <li key={index} className="grid gap-4 rounded-lg border border-line bg-surface-2 p-4 sm:grid-cols-[11rem_1fr]">
              <ImageUpload
                value={project.image}
                onChange={(image) => updateProject(index, { image })}
                onBusy={track}
                aspect="aspect-[4/3]"
                label="foto del proyecto"
              />
              <div className="grid content-start gap-3">
                <Field label="Título" htmlFor={`project-title-${index}`}>
                  <Input
                    id={`project-title-${index}`}
                    value={project.title}
                    onChange={(event) => updateProject(index, { title: event.target.value })}
                    placeholder="Ej: Nissan Skyline R34 · FuelTech FT600"
                    maxLength={80}
                  />
                </Field>
                <Field label="Qué se hizo" htmlFor={`project-detail-${index}`} optional>
                  <Textarea
                    id={`project-detail-${index}`}
                    value={project.detail}
                    onChange={(event) => updateProject(index, { detail: event.target.value })}
                    rows={2}
                    maxLength={300}
                    placeholder="Ramal a medida, sistema de combustible E85 y programación en dinamómetro."
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="ghost" disabled={index === 0} onClick={() => moveProject(index, -1)}>
                    <ArrowUp className="size-4" /> Mover arriba
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={index === projects.length - 1}
                    onClick={() => moveProject(index, 1)}
                  >
                    <ArrowDown className="size-4" /> Mover abajo
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-400"
                    onClick={() => setProjects((current) => current.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="size-4" /> Quitar
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ol>
        {projects.length < MAX_PROJECTS && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setProjects((current) => [...current, { title: "", detail: "", image: "" }])}
          >
            <Plus className="size-4" /> Agregar proyecto
          </Button>
        )}
      </Card>

      <Card title="Videos de Instagram" description="Se muestran en «Quiénes somos», en una fila que se desliza.">
        <Field
          label="Publicaciones"
          htmlFor="instagramPosts"
          optional
          hint="Uno por línea: link de la publicación o reel | título | etiqueta. Ej: https://www.instagram.com/reel/ABC123/ | Programación FuelTech FT550 | Honda Civic 1998."
        >
          <Textarea
            id="instagramPosts"
            name="instagramPosts"
            rows={6}
            defaultValue={instagramPosts}
            placeholder="https://www.instagram.com/reel/… | Título | Etiqueta"
            className="font-mono text-xs"
          />
        </Field>
      </Card>

      <div className="flex items-center gap-3">
        <ActionSubmit size="md" disabled={busy}>
          <Save className="size-4" />
          Guardar «Quiénes somos»
        </ActionSubmit>
        {busy && <span className="text-sm text-muted">Esperando que terminen de subir las fotos…</span>}
      </div>
    </ActionForm>
  );
}

/** Una sola foto: se comprime en el navegador y se sube con la misma acción que las fotos de productos. */
function ImageUpload({
  value,
  onChange,
  onBusy,
  aspect,
  label,
  person = false,
}: {
  value: string;
  onChange: (url: string) => void;
  onBusy: (delta: number) => void;
  aspect: string;
  /** Qué foto es, en minúsculas (ej: «foto del proyecto»). */
  label: string;
  person?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File | undefined) {
    if (!file?.type.startsWith("image/")) return;
    setError("");
    setUploading(true);
    onBusy(1);
    try {
      const formData = new FormData();
      formData.set("file", await compressImage(file));
      const result = await uploadProductImage(formData);
      if (result.url) onChange(result.url);
      else setError(result.error ?? "No se pudo subir la foto.");
    } catch {
      setError("No se pudo subir la foto.");
    } finally {
      setUploading(false);
      onBusy(-1);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label={value ? `Cambiar ${label}` : `Subir ${label}`}
        className={cn(
          "group relative flex w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 text-sm text-muted transition-colors",
          aspect,
          value ? "border-line" : "border-dashed border-line-strong hover:border-zinc-400 hover:text-fg",
        )}
      >
        {value ? (
          <>
            <Image src={value} alt="" fill sizes="220px" className="object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1.5 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
              Cambiar foto
            </span>
          </>
        ) : person ? (
          <UserRound className="size-7" />
        ) : (
          <ImagePlus className="size-6" />
        )}
        {!value && <span className="px-2 text-center first-letter:uppercase">Subir {label}</span>}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
            <LoaderCircle className="size-6 animate-spin" />
          </span>
        )}
      </button>
      {value && (
        <button type="button" onClick={() => onChange("")} className="mt-1.5 text-xs text-muted hover:text-red-400">
          Quitar foto
        </button>
      )}
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(event) => {
          void upload(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
