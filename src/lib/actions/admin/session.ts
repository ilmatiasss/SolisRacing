"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, verifyCredentials } from "@/lib/auth";

export type LoginState = { error?: string };

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  // Solo rutas internas del panel (evita redirecciones abiertas).
  return next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Ingresa tu correo y contraseña." };
  const user = await verifyCredentials(email, password);
  if (!user) {
    // Pequeña pausa para frenar intentos automatizados.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { error: "Correo o contraseña incorrectos." };
  }
  await createSession(user);
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
