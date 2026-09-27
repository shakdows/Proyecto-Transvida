"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPermisos, requireRol } from "@/lib/auth";
import { MAESTROS, TABLAS_MAESTRO, type Campo, type TablaMaestro } from "@/lib/maestros";
import { PERMISOS, ROLES_CONFIGURABLES } from "@/lib/permisos";
import { createClient } from "@/lib/supabase/server";
import { rucValido } from "@/lib/utils";

export type EstadoForm = { error?: string; ok?: string };

const STAFF = ["admin", "operaciones", "chofer", "planta", "facturacion"] as const;

/** Convierte y valida el valor de un campo del formulario */
function leerCampo(campo: Campo, f: FormData): { valor?: unknown; error?: string } {
  const bruto = f.get(campo.name);
  if (campo.tipo === "checkbox") return { valor: bruto === "on" };

  let texto = typeof bruto === "string" ? bruto.trim() : "";
  if (campo.mayusculas) texto = texto.toUpperCase();
  if (!texto) {
    return campo.requerido ? { error: `Completa el campo "${campo.label}".` } : { valor: null };
  }

  switch (campo.tipo) {
    case "numero": {
      const n = Number(texto.replace(",", "."));
      if (!Number.isFinite(n)) return { error: `"${campo.label}" debe ser un número.` };
      if (campo.min !== undefined && n < campo.min) return { error: `"${campo.label}" debe ser mayor o igual a ${campo.min}.` };
      return { valor: n };
    }
    case "fecha":
      if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return { error: `"${campo.label}" no es una fecha válida.` };
      return { valor: texto };
    case "email":
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(texto)) return { error: `"${campo.label}" no es un correo válido.` };
      return { valor: texto.toLowerCase() };
    case "select":
      if (campo.opciones && !campo.opciones.some((o) => o.value === texto)) {
        return { error: `Elige una opción válida en "${campo.label}".` };
      }
      return { valor: texto };
  }

  if (campo.validar === "ruc" && !rucValido(texto)) return { error: "El RUC no es válido (11 dígitos y dígito verificador)." };
  if (campo.validar === "dni" && !/^\d{8}$/.test(texto)) return { error: "El DNI debe tener 8 dígitos." };
  if (campo.validar === "placa" && !/^[A-Z0-9]{2,4}-?[A-Z0-9]{2,4}$/.test(texto)) {
    return { error: "La placa no es válida. Ejemplo: ABC-123." };
  }
  return { valor: texto };
}

/** Traduce errores de la base de datos a mensajes simples */
function mensajeError(error: { code?: string; message: string }) {
  if (error.code === "23505") return "Ya existe un registro con ese mismo dato (código, placa, RUC, DNI o nombre).";
  if (error.code === "23514") return "Algún dato no es válido. Revisa el formulario.";
  if (error.code === "23503") return "El registro relacionado no existe o pertenece a otra organización.";
  if (error.code === "42501") return "No tienes permiso para esta acción.";
  return error.message;
}

export async function guardarMaestro(
  tabla: TablaMaestro,
  id: string | null,
  _prev: EstadoForm,
  f: FormData,
): Promise<EstadoForm> {
  if (!TABLAS_MAESTRO.includes(tabla)) return { error: "Maestro no válido." };
  const { perfil } = await requireRol([...STAFF]);
  const maestro = MAESTROS[tabla];
  const permisos = await getPermisos();
  if (!permisos[maestro.permiso]) return { error: "No tienes permiso para editar este maestro." };

  const datos: Record<string, unknown> = {};
  for (const campo of maestro.campos) {
    if (campo.soloEdicion && !id) continue;
    const { valor, error } = leerCampo(campo, f);
    if (error) return { error };
    datos[campo.name] = valor;
  }

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase.from(tabla).update(datos).eq("id", id);
    if (error) return { error: mensajeError(error) };
    revalidatePath("/maestros", "layout");
    return { ok: "Cambios guardados." };
  }

  const { data, error } = await supabase
    .from(tabla)
    .insert({ ...datos, organization_id: perfil.organization_id })
    .select("*")
    .single();
  if (error) return { error: mensajeError(error) };
  revalidatePath("/maestros", "layout");

  // Clientes, unidades y choferes: al crear se abre su ficha para completar sedes/documentos
  if (tabla === "clientes" || tabla === "unidades" || tabla === "choferes") redirect(maestro.ruta(data));
  return { ok: `Listo: se registró ${maestro.articulo} ${maestro.singular}.` };
}

export async function eliminarMaestro(
  tabla: TablaMaestro,
  id: string,
  volverA: string,
  _prev: EstadoForm,
  f: FormData,
): Promise<EstadoForm> {
  if (!TABLAS_MAESTRO.includes(tabla)) return { error: "Maestro no válido." };
  await requireRol([...STAFF]);
  const supabase = await createClient();
  const { data: archivo, error } = await supabase.rpc("eliminar_maestro", {
    p_tabla: tabla,
    p_id: id,
    p_clave: String(f.get("clave") ?? ""),
  });
  if (error) return { error: error.message };
  if (archivo) await supabase.storage.from("documentos").remove([archivo as string]);
  revalidatePath("/maestros", "layout");
  redirect(volverA);
}

export async function guardarPermisos(_prev: EstadoForm, f: FormData): Promise<EstadoForm> {
  const { perfil } = await requireRol(["admin"]);
  const supabase = await createClient();
  const resultados = await Promise.all(
    ROLES_CONFIGURABLES.flatMap((rol) =>
      PERMISOS.map((p) =>
        supabase
          .from("permisos_rol")
          .update({ permitido: f.get(`${rol}:${p.clave}`) === "on" })
          .eq("organization_id", perfil.organization_id!)
          .eq("rol", rol)
          .eq("permiso", p.clave),
      ),
    ),
  );
  const fallo = resultados.find((r) => r.error);
  if (fallo?.error) return { error: mensajeError(fallo.error) };
  revalidatePath("/", "layout");
  return { ok: "Permisos guardados." };
}

export async function cambiarClaveEliminacion(_prev: EstadoForm, f: FormData): Promise<EstadoForm> {
  await requireRol(["admin"]);
  const nueva = String(f.get("nueva") ?? "");
  if (nueva !== String(f.get("confirmar") ?? "")) return { error: "La nueva clave y su confirmación no coinciden." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("cambiar_clave_eliminacion", {
    p_actual: String(f.get("actual") ?? ""),
    p_nueva: nueva,
  });
  if (error) return { error: error.message };
  return { ok: "Clave de eliminación actualizada." };
}
