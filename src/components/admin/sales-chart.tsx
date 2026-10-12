import { addDays, todayInChile } from "@/lib/booking";
import { cn } from "@/lib/cn";
import { formatCLP } from "@/lib/format";

type DailySales = { day: string; total: number; orders: number };

const DAYS = 30;
const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("es-CL", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${iso}T12:00:00Z`),
  );

/** "$1,2 M", "$350 mil": para el eje, sin decimales de más. */
function compactCLP(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toLocaleString("es-CL", { maximumFractionDigits: 1 })} M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)} mil`;
  return formatCLP(value);
}

/**
 * Ventas pagadas por día de los últimos 30 días: barras de un solo color (una serie), con el
 * detalle de cada día al pasar el mouse o enfocarla, y una tabla para lectores de pantalla.
 */
export function SalesChart({ daily }: { daily: DailySales[] }) {
  const today = todayInChile();
  const byDay = new Map(daily.map((row) => [row.day, row]));
  const days = Array.from({ length: DAYS }, (_, index) => {
    const day = addDays(today, index - DAYS + 1);
    return { day, total: byDay.get(day)?.total ?? 0, orders: byDay.get(day)?.orders ?? 0 };
  });
  const max = Math.max(...days.map((row) => row.total));
  const total = days.reduce((sum, row) => sum + row.total, 0);
  const best = days.reduce((top, row) => (row.total > top.total ? row : top), days[0]);

  return (
    <figure>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <span className="font-semibold">Ventas de los últimos 30 días</span>
        <span className="text-sm text-muted">
          {max > 0 ? (
            <>
              Total <span className="font-semibold text-fg tabular-nums">{formatCLP(total)}</span> · mejor día{" "}
              <span className="font-semibold text-fg">{shortDate(best.day)}</span>
            </>
          ) : (
            "Aún no hay ventas pagadas en este período."
          )}
        </span>
      </figcaption>

      <div className="mt-5 flex gap-3" aria-hidden="true">
        {/* Eje: solo el máximo y el cero, en tinta tenue. */}
        <div className="flex h-44 w-14 shrink-0 flex-col justify-between text-right text-[11px] text-muted tabular-nums">
          <span>{max > 0 ? compactCLP(max) : ""}</span>
          <span>$0</span>
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-line" />
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-line/60" />
          <ol className="relative flex h-44 items-end gap-0.5 border-b border-line-strong">
            {days.map((row, index) => {
              const height = max > 0 ? Math.max((row.total / max) * 100, row.total > 0 ? 3 : 0) : 0;
              return (
                <li key={row.day} className="group relative flex h-full flex-1 items-end justify-center">
                  {/* Zona de hover más grande que la barra. */}
                  <span
                    className="block w-full max-w-5 rounded-t bg-brand-600 transition-colors group-hover:bg-brand-500"
                    style={{ height: `${height}%` }}
                  />
                  <span
                    className={cn(
                      "pointer-events-none absolute bottom-full z-10 mb-2 hidden rounded-lg border border-line-strong bg-zinc-950 px-2.5 py-1.5 text-xs whitespace-nowrap shadow-xl group-hover:block",
                      // En los bordes, el globo se abre hacia adentro para no salirse.
                      index < 4 ? "left-0" : index > DAYS - 5 ? "right-0" : "left-1/2 -translate-x-1/2",
                    )}
                  >
                    <span className="block font-semibold capitalize">{shortDate(row.day)}</span>
                    <span className="block tabular-nums">{formatCLP(row.total)}</span>
                    <span className="block text-muted">
                      {row.orders} {row.orders === 1 ? "pedido" : "pedidos"}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
          <div className="mt-1.5 flex justify-between text-[11px] text-muted">
            <span>{shortDate(days[0].day)}</span>
            <span>{shortDate(days[15].day)}</span>
            <span>Hoy</span>
          </div>
        </div>
      </div>

      {/* Los mismos datos en tabla, para lectores de pantalla. */}
      <table className="sr-only">
        <caption>Ventas pagadas por día</caption>
        <thead>
          <tr>
            <th>Día</th>
            <th>Ventas</th>
            <th>Pedidos</th>
          </tr>
        </thead>
        <tbody>
          {days.map((row) => (
            <tr key={row.day}>
              <td>{shortDate(row.day)}</td>
              <td>{formatCLP(row.total)}</td>
              <td>{row.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
