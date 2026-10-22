import { Check, CircleCheck, Clock, Hand, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import { orderNextStep, orderStages, type OrderGuideInput } from "@/lib/order-guide";

const TONES = {
  action: { box: "border-brand-600/40 bg-brand-600/10", icon: Hand, iconClass: "text-brand-400" },
  wait: { box: "border-sky-500/30 bg-sky-500/10", icon: Clock, iconClass: "text-sky-300" },
  done: { box: "border-line bg-surface", icon: CircleCheck, iconClass: "text-emerald-400" },
  warning: { box: "border-amber-500/40 bg-amber-500/10", icon: TriangleAlert, iconClass: "text-amber-300" },
};

/** «Qué hacer ahora»: barra de avance del pedido y el siguiente paso explicado. */
export function OrderNextStep(props: OrderGuideInput) {
  const step = orderNextStep(props);
  const stages = orderStages(props);
  const tone = TONES[step.tone];
  return (
    <section aria-label="Qué hacer ahora" className={cn("mb-6 rounded-xl border p-5", tone.box)}>
      {stages.length > 0 && (
        <ol className="mb-5 grid grid-cols-4 gap-2">
          {stages.map((stage, index) => (
            <li key={stage.label} className="min-w-0">
              <div
                className={cn(
                  "h-1.5 rounded-full",
                  stage.state === "done" ? "bg-emerald-500" : stage.state === "current" ? "bg-brand-600" : "bg-white/10",
                )}
              />
              <p
                className={cn(
                  "mt-2 flex items-center gap-1 truncate text-xs",
                  stage.state === "todo" ? "text-zinc-500" : "font-semibold text-zinc-200",
                )}
                aria-current={stage.state === "current" ? "step" : undefined}
              >
                {stage.state === "done" ? (
                  <Check className="size-3.5 shrink-0 text-emerald-400" strokeWidth={3} aria-label="Hecho:" />
                ) : (
                  <span className="tabular-nums">{index + 1}.</span>
                )}
                {stage.label}
              </p>
            </li>
          ))}
        </ol>
      )}
      <div className="flex gap-3">
        <tone.icon className={cn("mt-0.5 size-5 shrink-0", tone.iconClass)} aria-hidden="true" />
        <div>
          <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Qué hacer ahora</p>
          <p className="mt-0.5 font-semibold">{step.title}</p>
          <p className="mt-1 max-w-3xl text-sm text-zinc-300">{step.text}</p>
        </div>
      </div>
    </section>
  );
}
