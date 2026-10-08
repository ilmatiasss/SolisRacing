"use client";

import { LogIn } from "lucide-react";
import { startTransition, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { login, type LoginState } from "@/lib/actions/admin/session";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        // A dónde volver después de ingresar (lo agrega el proxy al redirigir al login).
        formData.set("next", new URLSearchParams(window.location.search).get("next") ?? "");
        startTransition(() => action(formData));
      }}
    >
      <Field label="Correo" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </Field>
      <Field label="Contraseña" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        <LogIn className="size-4.5" />
        {pending ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}
