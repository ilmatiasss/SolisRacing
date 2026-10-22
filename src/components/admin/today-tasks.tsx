import { ArrowRight, CalendarClock, CircleCheck, Inbox, PackageCheck, Truck, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Card } from "./ui";

export type TodayCounts = {
  toPrepare: number;
  preparing: number;
  newInquiries: number;
  bookingsToday: number;
};

type Task = { count: number; title: string; hint: string; href: string; icon: LucideIcon; urgent?: boolean };

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** «Para hoy»: lo que pide atención ahora, en el orden en que conviene hacerlo, con un enlace para resolverlo. */
export function TodayTasks({ counts }: { counts: TodayCounts }) {
  const tasks: Task[] = [
    {
      count: counts.toPrepare,
      title: plural(counts.toPrepare, "pedido pagado por preparar", "pedidos pagados por preparar"),
      hint: "Ya están pagados: prepáralos y despáchalos (o déjalos listos para retiro).",
      href: "/admin/pedidos?estado=paid",
      icon: PackageCheck,
      urgent: true,
    },
    {
      count: counts.preparing,
      title: plural(counts.preparing, "pedido en preparación", "pedidos en preparación"),
      hint: "Cuando lo despaches, márcalo «Enviado» con el courier y el n° de seguimiento.",
      href: "/admin/pedidos?estado=processing",
      icon: Truck,
    },
    {
      count: counts.newInquiries,
      title: plural(counts.newInquiries, "solicitud sin responder", "solicitudes sin responder"),
      hint: "Contacta al cliente por WhatsApp o correo y cambia el estado a «Contactado».",
      href: "/admin/solicitudes?estado=new",
      icon: Inbox,
      urgent: true,
    },
    {
      count: counts.bookingsToday,
      title: plural(counts.bookingsToday, "hora agendada para hoy", "horas agendadas para hoy"),
      hint: "Revisa a quién atiendes hoy, dónde y a qué hora.",
      href: "/admin/agenda",
      icon: CalendarClock,
    },
  ].filter((task) => task.count > 0);

  return (
    <Card title="Para hoy" description="Lo que pide tu atención, en el orden en que conviene hacerlo." className="mb-6" bodyClassName="p-0">
      {tasks.length === 0 ? (
        <p className="flex items-center gap-3 px-5 py-5 text-sm">
          <CircleCheck className="size-6 shrink-0 text-emerald-400" />
          <span>
            <span className="block font-semibold">Todo al día</span>
            <span className="block text-muted">No hay pedidos, pagos ni mensajes esperando. Cuando llegue algo, aparecerá aquí.</span>
          </span>
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {tasks.map((task) => (
            <li key={task.href + task.title}>
              <Link href={task.href} className="group flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-white/5">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl",
                    task.urgent ? "bg-brand-600/15 text-brand-500" : "bg-white/5 text-zinc-300",
                  )}
                >
                  <task.icon className="size-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{task.title}</span>
                  <span className="block text-muted">{task.hint}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
