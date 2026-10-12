import { CalendarClock, Car, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BookingForm } from "@/components/admin/booking-form";
import { AdminPageHeader, Card, EmptyState } from "@/components/admin/ui";
import { WhatsAppIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth";
import { formatBookingDate, todayInChile } from "@/lib/booking";
import { listUpcomingBookings } from "@/lib/data/booking";
import { readStoreSettings } from "@/lib/data/settings";
import { whatsappLink } from "@/lib/format";
import { INQUIRY_STATUS_LABELS, INQUIRY_STATUS_TONES } from "@/lib/order-status";

export const metadata: Metadata = { title: "Agenda" };

// Página del panel: siempre se consulta la base de datos al momento (no se prerenderiza).
export const instant = false;

export default async function AgendaPage() {
  await requireAdmin();
  const [settings, bookings] = await Promise.all([readStoreSettings(), listUpcomingBookings()]);
  const today = todayInChile();
  const days = Map.groupBy(bookings, (booking) => booking.date ?? "");

  return (
    <>
      <AdminPageHeader
        title="Agenda"
        description="Las horas que piden tus clientes y los días y horarios que ofreces en cada lugar."
      />

      <Card
        title="Próximas horas"
        description="Pedidas desde la página de servicios. Una hora pedida deja de ofrecerse; si la cierras en Solicitudes, vuelve a quedar libre."
        className="mb-8"
        bodyClassName={bookings.length > 0 ? "p-0" : undefined}
      >
        {bookings.length === 0 ? (
          <EmptyState title="No hay horas pedidas" description="Cuando un cliente pida hora, aparecerá aquí." />
        ) : (
          <ol className="divide-y divide-line">
            {[...days].map(([date, items]) => (
              <li key={date} className="px-5 py-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <CalendarClock className="size-4 text-brand-600" />
                  <span className="first-letter:uppercase">{formatBookingDate(date)}</span>
                  {date === today && <Badge tone="brand">Hoy</Badge>}
                </p>
                <ul className="space-y-2">
                  {items.map((booking) => (
                    <li key={booking.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-surface-2 px-3 py-2 text-sm">
                      <span className="w-12 font-semibold tabular-nums">{booking.time}</span>
                      <span className="min-w-40 font-medium">{booking.name}</span>
                      <span className="text-muted">{booking.serviceName ?? "Servicio"}</span>
                      {booking.location && (
                        <span className="flex items-center gap-1 text-muted">
                          <MapPin className="size-3.5" /> {booking.location}
                        </span>
                      )}
                      {booking.vehicle && (
                        <span className="flex items-center gap-1 text-muted">
                          <Car className="size-3.5" /> {booking.vehicle}
                        </span>
                      )}
                      <span className="ml-auto flex items-center gap-3">
                        {booking.phone && (
                          <>
                            <a href={`tel:${booking.phone.replace(/\s/g, "")}`} className="flex items-center gap-1 text-muted hover:text-fg">
                              <Phone className="size-3.5" /> {booking.phone}
                            </a>
                            <a
                              href={whatsappLink(
                                booking.phone,
                                `Hola ${booking.name.split(" ")[0]}, te escribimos de ${settings.storeName} por tu hora del ${formatBookingDate(date)} a las ${booking.time}.`,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`WhatsApp a ${booking.name}`}
                              className="text-emerald-700 hover:text-emerald-800"
                            >
                              <WhatsAppIcon className="size-4" />
                            </a>
                          </>
                        )}
                        <Badge tone={INQUIRY_STATUS_TONES[booking.status]}>{INQUIRY_STATUS_LABELS[booking.status]}</Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
        {bookings.length > 0 && (
          <p className="border-t border-line px-5 py-3 text-sm">
            <Link href="/admin/solicitudes" className="font-semibold text-brand-700 hover:underline">
              Confirmar o cerrar horas en Solicitudes →
            </Link>
          </p>
        )}
      </Card>

      <h2 className="mb-1 text-lg font-bold">Disponibilidad</h2>
      <p className="mb-4 text-sm text-muted">
        Define dónde atiendes, qué días y a qué horas. Para la Quinta Región usa «Solo en fechas de visita» y agrega los días de cada
        viaje.
      </p>
      <BookingForm initial={settings.booking} today={today} />
    </>
  );
}
