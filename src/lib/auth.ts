import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Rol } from "@/lib/roles";

export type Perfil = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  organization_id: string | null;
  cliente_id: string | null;
};

export type Organizacion = {
  id: string;
  razon_social: string;
  nombre_comercial: string | null;
  ruc: string;
  registro_eors: string | null;
  logo_url: string | null;
  color_marca: string;
};

/** Usuario conectado + su perfil y organización (una sola consulta por visita). */
export const getSesion = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("id, nombre, email, rol, organization_id, cliente_id")
    .eq("id", user.id)
    .eq("activo", true)
    .maybeSingle<Perfil>();
  if (!perfil) return { sinPerfil: true as const };

  let organizacion: Organizacion | null = null;
  if (perfil.organization_id) {
    const { data } = await supabase
      .from("organizations")
      .select("id, razon_social, nombre_comercial, ruc, registro_eors, logo_url, color_marca")
      .eq("id", perfil.organization_id)
      .maybeSingle<Organizacion>();
    organizacion = data;
  }

  return { sinPerfil: false as const, perfil, organizacion };
});

/** Úsalo al inicio de cada página: exige sesión y, si se indica, uno de los roles. */
export async function requireRol(roles?: Rol[]) {
  const sesion = await getSesion();
  if (!sesion) redirect("/login");
  if (sesion.sinPerfil) redirect("/cuenta-inactiva");
  if (roles && !roles.includes(sesion.perfil.rol)) redirect("/sin-acceso");
  return sesion;
}
