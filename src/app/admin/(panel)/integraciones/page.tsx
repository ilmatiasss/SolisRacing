import { RefreshCw, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SubmitButton } from "@/components/admin/form-buttons";
import { AdminPageHeader, Card, EmptyState, Notice } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { clearIntegrationLog } from "@/lib/actions/admin/integration";
import { requireAdmin } from "@/lib/auth";
import { listIntegrationRequests } from "@/lib/data/integration";
import { formatDateTime } from "@/lib/format";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Integraciones" };

// Página del panel: siempre se consulta la base de datos al momento (no se prerenderiza).
export const instant = false;

export default async function IntegrationsPage() {
  await requireAdmin();
  const requests = await listIntegrationRequests();
  const endpoint = `${siteUrl()}/api/jumpseller`;

  return (
    <>
      <AdminPageHeader
        title="Integración con Fullpyme"
        description="Prueba para conectar Fullpyme con la tienda usando su conector de Jumpseller."
        actions={
          <Link href="/admin/integraciones" className={buttonClasses({ variant: "outline", size: "sm" })}>
            <RefreshCw className="size-4" />
            Actualizar
          </Link>
        }
      />

      <Card title="Cómo hacer la prueba en Fullpyme" className="mb-6">
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          <li>
            En Fullpyme, entra a <strong>Ecommerce → Conexiones</strong> y crea una conexión nueva con <strong>JumpSeller</strong>.
          </li>
          <li>
            Completa: <strong>Nombre de conexión</strong> «Prueba tienda web», <strong>Usuario</strong> «solis-prueba»,{" "}
            <strong>Token</strong> «prueba-1234» y en <strong>URL</strong>:
            <code className="ml-1 rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs break-all">{endpoint}</code>
          </li>
          <li>
            Deja <strong>Sincronización automática</strong> desmarcada, marca <strong>Activo</strong> y aprieta <strong>Guardar</strong>.
          </li>
          <li>
            Ve a la pestaña <strong>Proceso manual</strong> y ejecuta la sincronización (productos y pedidos). Luego revisa
            también la pestaña <strong>Productos</strong>.
          </li>
          <li>
            Vuelve aquí y aprieta <strong>Actualizar</strong>. Si aparecen consultas, Fullpyme sí usa la URL y la integración
            directa es posible.
          </li>
        </ol>
        <Notice tone="warning" className="mt-4">
          Es solo una prueba: la tienda registra lo que llega y responde vacío, sin leer ni cambiar productos, stock ni pedidos.
          Después de probar, desactiva o borra esa conexión en Fullpyme.
        </Notice>
      </Card>

      <Card
        title={`Consultas recibidas (${requests.length})`}
        description="Las credenciales se guardan enmascaradas. Se conservan las últimas 200."
        bodyClassName={requests.length > 0 ? "p-0" : undefined}
        actions={
          requests.length > 0 && (
            <form action={clearIntegrationLog}>
              <SubmitButton variant="ghost" size="sm" pendingText="…" confirm="¿Borrar el registro de consultas?">
                <Trash2 className="size-4" /> Borrar registro
              </SubmitButton>
            </form>
          )
        }
      >
        {requests.length === 0 ? (
          <EmptyState title="Aún no llega nada" description="Cuando Fullpyme envíe consultas a la URL de prueba, aparecerán aquí." />
        ) : (
          <ul className="divide-y divide-line">
            {requests.map((entry) => (
              <li key={entry.id} className="space-y-1.5 px-5 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={entry.method === "GET" ? "info" : "warning"}>{entry.method}</Badge>
                  <code className="font-mono text-xs break-all">
                    {entry.path}
                    {entry.query ? `?${entry.query}` : ""}
                  </code>
                  <span className="ml-auto text-xs text-muted">{formatDateTime(entry.createdAt)}</span>
                </div>
                {entry.headers && Object.keys(entry.headers).length > 0 && (
                  <p className="font-mono text-[11px] break-all text-muted">
                    {Object.entries(entry.headers)
                      .map(([name, value]) => `${name}: ${value}`)
                      .join(" · ")}
                  </p>
                )}
                {entry.body && (
                  <pre className="max-h-48 overflow-auto rounded-lg bg-surface-2 p-3 font-mono text-[11px] whitespace-pre-wrap">{entry.body}</pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
