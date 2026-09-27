"use server";

import { redirect } from "next/navigation";
import { USUARIOS_DEMO } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";

export type EstadoLogin = { error?: string };

export async function iniciarSesion(_prev: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Ingresa tu correo y contraseña." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Correo o contraseña incorrectos." };

  redirect("/inicio");
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function entrarComoDemo(email: string): Promise<EstadoLogin> {
  if (process.env.MODO_DEMO === "false") return { error: "El acceso de prueba está desactivado." };
  if (!USUARIOS_DEMO.some((u) => u.email === email)) return { error: "Usuario de prueba no válido." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: "Demo2026!" });
  if (error) return { error: "No se pudo entrar con el usuario de prueba." };
  redirect("/inicio");
}
