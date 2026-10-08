import { KeyRound, Trash2, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import { ActionForm, ActionSubmit } from "@/components/admin/action-form";
import { SubmitButton } from "@/components/admin/form-buttons";
import { AdminPageHeader, Card, Table, Td, Th } from "@/components/admin/ui";
import { Field, Input } from "@/components/ui/field";
import { changeOwnPassword, createAdminUser, deleteAdminUser } from "@/lib/actions/admin/users";
import { requireAdmin } from "@/lib/auth";
import { listAdminUsers } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Usuarios" };

// Página del panel: siempre se consulta la base de datos al momento (no se prerenderiza).
export const instant = false;

export default async function UsersPage() {
  const me = await requireAdmin();
  const users = await listAdminUsers();
  return (
    <>
      <AdminPageHeader title="Usuarios" description="Personas con acceso a este panel." />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card title="Equipo" bodyClassName="p-0">
          <Table>
            <thead>
              <tr>
                <Th>Nombre</Th>
                <Th>Correo</Th>
                <Th>Último ingreso</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <Td className="font-medium">
                    {user.name} {user.id === me.id && <span className="text-xs text-muted">(tú)</span>}
                  </Td>
                  <Td>{user.email}</Td>
                  <Td className="text-muted">{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Nunca"}</Td>
                  <Td className="text-right">
                    {user.id !== me.id && users.length > 1 && (
                      <form action={deleteAdminUser}>
                        <input type="hidden" name="id" value={user.id} />
                        <SubmitButton
                          variant="ghost"
                          size="sm"
                          pendingText="…"
                          className="text-muted hover:text-red-600"
                          confirm={`¿Quitar el acceso de ${user.name}?`}
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Eliminar</span>
                        </SubmitButton>
                      </form>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <div className="space-y-6">
          <Card title="Agregar usuario">
            <ActionForm action={createAdminUser} resetOnSuccess className="space-y-3">
              <Field label="Nombre" htmlFor="new-name">
                <Input id="new-name" name="name" required />
              </Field>
              <Field label="Correo" htmlFor="new-email">
                <Input id="new-email" name="email" type="email" autoComplete="off" required />
              </Field>
              <Field label="Contraseña inicial" htmlFor="new-password" hint="Mínimo 8 caracteres. Compártela por un canal seguro.">
                <Input id="new-password" name="password" type="password" autoComplete="new-password" required />
              </Field>
              <ActionSubmit className="w-full">
                <UserPlus className="size-4" /> Crear usuario
              </ActionSubmit>
            </ActionForm>
          </Card>
          <Card title="Cambiar mi contraseña">
            <ActionForm action={changeOwnPassword} resetOnSuccess className="space-y-3">
              <Field label="Contraseña actual" htmlFor="current">
                <Input id="current" name="current" type="password" autoComplete="current-password" required />
              </Field>
              <Field label="Nueva contraseña" htmlFor="password">
                <Input id="password" name="password" type="password" autoComplete="new-password" required />
              </Field>
              <Field label="Repite la nueva contraseña" htmlFor="confirm">
                <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
              </Field>
              <ActionSubmit variant="outline" className="w-full">
                <KeyRound className="size-4" /> Actualizar contraseña
              </ActionSubmit>
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}
