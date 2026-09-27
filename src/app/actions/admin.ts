"use server";

import { revalidatePath } from "next/cache";
import { requireRol } from "@/lib/auth";
import { ROLES, type Rol } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { rucValido } from "@/lib/utils";

export type EstadoForm = { error?: string; ok?: string };

const texto = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function crearOrganizacion(_prev: EstadoForm, f: FormData): Promise<EstadoForm> {
  await requireRol(["super_admin"]);
  const razon_social = texto(f, "razon_social");
  const ruc = texto(f, "ruc");
  const color_marca = texto(f, "color_marca") || "#0f766e";
  if (!razon_social) return { error: "Ingresa la razón social." };
  if (!rucValido(ruc)) return { error: "El RUC no es válido (11 dígitos con dígito verificador correcto)." };

  const supabase = await createClient();
  const { error } = await supabase.from("organizations").insert({
    razon_social,
    ruc,
    color_marca,
    nombre_comercial: texto(f, "nombre_comercial") || null,
    registro_eors: texto(f, "registro_eors") || null,
  });
  if (error) {
    return { error: error.code === "23505" ? "Ya existe una organización con ese RUC." : error.message };
  }
  revalidatePath("/organizaciones");
  return { ok: `Organización "${razon_social}" creada.` };
}

export async function crearUsuario(_prev: EstadoForm, f: FormData): Promise<EstadoForm> {
  const { perfil } = await requireRol(["super_admin", "admin"]);
  const rol = texto(f, "rol") as Rol;
  if (!ROLES.includes(rol)) return { error: "Elige un rol." };
  if (perfil.rol === "admin" && rol === "super_admin") return { error: "Rol no permitido." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_crear_usuario", {
    p_email: texto(f, "email"),
    p_password: String(f.get("password") ?? ""),
    p_nombre: texto(f, "nombre"),
    p_rol: rol,
    p_org: perfil.rol === "super_admin" ? texto(f, "organization_id") || null : perfil.organization_id,
    p_cliente: rol === "cliente" ? texto(f, "cliente_id") || null : null,
  });
  if (error) return { error: error.message };
  revalidatePath("/usuarios");
  return { ok: "Usuario creado. Ya puede ingresar con su correo y contraseña." };
}

export async function actualizarMarca(_prev: EstadoForm, f: FormData): Promise<EstadoForm> {
  const { perfil } = await requireRol(["admin"]);
  const color_marca = texto(f, "color_marca");
  if (!/^#[0-9a-fA-F]{6}$/.test(color_marca)) return { error: "Color no válido." };
  const logo_url = texto(f, "logo_url");
  if (logo_url && !/^https:\/\//.test(logo_url)) return { error: "El logo debe ser un enlace https://" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      nombre_comercial: texto(f, "nombre_comercial") || null,
      registro_eors: texto(f, "registro_eors") || null,
      color_marca,
      logo_url: logo_url || null,
    })
    .eq("id", perfil.organization_id!);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: "Cambios guardados." };
}
