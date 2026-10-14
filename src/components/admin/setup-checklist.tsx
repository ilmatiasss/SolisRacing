import { ArrowRight, Check, Circle } from "lucide-react";
import Link from "next/link";
import { Card } from "./ui";

export type SetupStep = { label: string; hint: string; href: string; done: boolean };

/** «Primeros pasos»: lo que falta para dejar la tienda lista, con avance. Desaparece al completarlo. */
export function SetupChecklist({ steps }: { steps: SetupStep[] }) {
  const done = steps.filter((step) => step.done).length;
  if (done === steps.length) return null;
  return (
    <Card
      title="Primeros pasos"
      description="Lo que falta para dejar la tienda lista para abrir."
      className="mb-6"
      bodyClassName="p-0"
      actions={
        <span className="shrink-0 rounded-md bg-brand-600/15 px-2 py-1 text-xs font-bold whitespace-nowrap text-brand-500 tabular-nums">
          {done} de {steps.length}
        </span>
      }
    >
      <div className="h-1.5 bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done} aria-label="Avance de los primeros pasos">
        <div className="h-full bg-brand-600 transition-[width]" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ul className="divide-y divide-line">
        {steps.map((step) => (
          <li key={step.label}>
            <Link href={step.href} className="group flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-white/5">
              {step.done ? (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              ) : (
                <Circle className="size-6 shrink-0 text-zinc-600" strokeWidth={1.5} />
              )}
              <span className="min-w-0 flex-1">
                <span className={step.done ? "block text-zinc-500 line-through" : "block font-semibold"}>{step.label}</span>
                {!step.done && <span className="block text-muted">{step.hint}</span>}
              </span>
              {!step.done && <ArrowRight className="size-4 shrink-0 text-brand-500 transition-transform group-hover:translate-x-0.5" />}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
