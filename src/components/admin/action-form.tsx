"use client";

import { LoaderCircle } from "lucide-react";
import { createContext, startTransition, use, useActionState, useRef, type ReactNode } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const PendingContext = createContext(false);

export type ActionState = { ok?: boolean; error?: string; message?: string };

/**
 * Formulario conectado a una acción de servidor que devuelve { ok, error, message }.
 * No borra lo escrito si hay errores; con `resetOnSuccess` se limpia al guardar.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  showSuccess = true,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  showSuccess?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await action(prev, formData);
    if (result.ok && resetOnSuccess) formRef.current?.reset();
    return result;
  }, {});

  return (
    <form
      ref={formRef}
      aria-busy={pending}
      className={cn(pending && "opacity-70", className)}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
      <PendingContext value={pending}>{children}</PendingContext>
      {state.error && (
        <p className="mt-2 basis-full text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {showSuccess && state.ok && state.message && (
        <p className="mt-2 basis-full text-sm text-emerald-700" role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}

/** Botón de envío para ActionForm (muestra el estado "guardando"). */
export function ActionSubmit({
  children,
  pendingText = "Guardando…",
  variant,
  size = "sm",
  className,
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  const pending = use(PendingContext);
  return (
    <Button type="submit" variant={variant} size={size} className={className} disabled={pending}>
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
