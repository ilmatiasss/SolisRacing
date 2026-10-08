import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-950 bg-speedlines p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl bg-surface p-6 shadow-2xl sm:p-8">
          <h1 className="text-xl font-bold">Panel de administración</h1>
          <p className="mt-1 mb-6 text-sm text-muted">Ingresa con tu cuenta de la tienda.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
