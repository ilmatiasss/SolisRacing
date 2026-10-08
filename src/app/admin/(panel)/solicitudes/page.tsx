import { CalendarClock, Car, Mail, Phone, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, ActionSubmit } from "@/components/admin/action-form";
import { SubmitButton } from "@/components/admin/form-buttons";
import { AdminPagination, pageParam, stringParam } from "@/components/admin/pagination";
import { AdminPageHeader, Card, EmptyState } from "@/components/admin/ui";
import { WhatsAppIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Select, Textarea } from "@/components/ui/field";
import { deleteInquiry, updateInquiry } from "@/lib/actions/admin/services";
import { requireAdmin } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { listInquiriesAdmin } from "@/lib/data/admin";
import type { InquiryStatus } from "@/lib/db/schema";
import { formatDate, formatDateTime, whatsappLink } from "@/lib/format";
import { INQUIRY_STATUS_LABELS, INQUIRY_STATUS_TONES } from "@/lib/order-status";

export const metadata: Metadata = { title: "Solicitudes" };

// Página del panel: siempre se consulta la base de datos al momento (no se prerenderiza).
export const instant = false;

export default async function InquiriesPage({ searchParams }: PageProps<"/admin/solicitudes">) {
  await requireAdmin();
  const sp = await searchParams;
  const statusParam = stringParam(sp.estado);
  const status = statusParam && statusParam in INQUIRY_STATUS_LABELS ? (statusParam as InquiryStatus) : undefined;
  const page = pageParam(sp.pagina);
  const { rows, total, pageCount } = await listInquiriesAdmin({ status, page });

  return (
    <>
      <AdminPageHeader
        title="Solicitudes"
        description="Pedidos de hora para servicios y mensajes del formulario de contacto."
      />
      <div className="mb-4 flex gap-1 overflow-x-auto">
        {[undefined, ...(Object.keys(INQUIRY_STATUS_LABELS) as InquiryStatus[])].map((value) => (
          <Link
            key={value ?? "todas"}
            href={value ? `/admin/solicitudes?estado=${value}` : "/admin/solicitudes"}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium",
              status === value ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-200/60",
            )}
          >
            {value ? INQUIRY_STATUS_LABELS[value] : "Todas"}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <Card>
          <EmptyState title="No hay solicitudes" description={`Total: ${total}`} />
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((inquiry) => (
            <Card key={inquiry.id} bodyClassName="grid gap-5 lg:grid-cols-[1fr_20rem]">
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={INQUIRY_STATUS_TONES[inquiry.status]}>{INQUIRY_STATUS_LABELS[inquiry.status]}</Badge>
                  <span className="font-semibold">
                    {inquiry.kind === "service" ? inquiry.serviceName ?? "Servicio" : "Mensaje de contacto"}
                  </span>
                  <span className="text-xs text-muted">· {formatDateTime(inquiry.createdAt)}</span>
                </div>
                <p className="text-base font-semibold">{inquiry.name}</p>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-muted">
                  <a href={`mailto:${inquiry.email}`} className="flex items-center gap-1.5 hover:text-fg">
                    <Mail className="size-4" /> {inquiry.email}
                  </a>
                  {inquiry.phone && (
                    <>
                      <a href={`tel:${inquiry.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:text-fg">
                        <Phone className="size-4" /> {inquiry.phone}
                      </a>
                      <a
                        href={whatsappLink(inquiry.phone, `Hola ${inquiry.name.split(" ")[0]}, te escribimos de Solis Racing por tu solicitud.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-emerald-700 hover:underline"
                      >
                        <WhatsAppIcon className="size-4" /> WhatsApp
                      </a>
                    </>
                  )}
                  {inquiry.vehicle && (
                    <span className="flex items-center gap-1.5">
                      <Car className="size-4" /> {inquiry.vehicle}
                    </span>
                  )}
                  {inquiry.preferredDate && (
                    <span className="flex items-center gap-1.5">
                      <CalendarClock className="size-4" /> Prefiere: {formatDate(`${inquiry.preferredDate}T12:00:00`)}
                    </span>
                  )}
                </div>
                {inquiry.message && <p className="rounded-lg bg-surface-2 p-3 whitespace-pre-line">{inquiry.message}</p>}
              </div>
              <div className="space-y-3">
                <ActionForm action={updateInquiry} className="space-y-3">
                  <input type="hidden" name="id" value={inquiry.id} />
                  <Select name="status" defaultValue={inquiry.status} aria-label="Estado de la solicitud" className="h-10">
                    {Object.entries(INQUIRY_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                  <Textarea name="adminNotes" rows={2} defaultValue={inquiry.adminNotes ?? ""} placeholder="Notas internas" aria-label="Notas internas" />
                  <ActionSubmit variant="outline" className="w-full">
                    Guardar
                  </ActionSubmit>
                </ActionForm>
                <form action={deleteInquiry}>
                  <input type="hidden" name="id" value={inquiry.id} />
                  <SubmitButton
                    variant="ghost"
                    size="sm"
                    pendingText="…"
                    className="w-full text-muted hover:text-red-600"
                    confirm="¿Eliminar esta solicitud?"
                  >
                    <Trash2 className="size-4" /> Eliminar
                  </SubmitButton>
                </form>
              </div>
            </Card>
          ))}
          {pageCount > 1 && (
            <Card bodyClassName="p-0">
              <AdminPagination basePath="/admin/solicitudes" params={{ estado: status }} page={page} pageCount={pageCount} />
            </Card>
          )}
        </div>
      )}
    </>
  );
}
