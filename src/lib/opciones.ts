import type { Opcion } from "@/lib/catalogos";
import { createClient } from "@/lib/supabase/server";

type Clave = "clientes" | "tiposUnidad" | "tiposResiduo" | "usuariosChofer";

/** Carga las listas desplegables que vienen de la base de datos */
export async function cargarOpciones(claves: Clave[]): Promise<Partial<Record<Clave, Opcion[]>>> {
  const supabase = await createClient();
  const salida: Partial<Record<Clave, Opcion[]>> = {};
  await Promise.all(
    claves.map(async (clave) => {
      if (clave === "clientes") {
        const { data } = await supabase.from("clientes").select("id, razon_social").eq("activo", true).order("razon_social");
        salida.clientes = (data ?? []).map((d) => ({ value: d.id, label: d.razon_social }));
      } else if (clave === "tiposUnidad") {
        const { data } = await supabase.from("tipos_unidad").select("id, nombre").order("nombre");
        salida.tiposUnidad = (data ?? []).map((d) => ({ value: d.id, label: d.nombre }));
      } else if (clave === "tiposResiduo") {
        const { data } = await supabase.from("tipos_residuo").select("id, codigo, nombre").eq("activo", true).order("nombre");
        salida.tiposResiduo = (data ?? []).map((d) => ({ value: d.id, label: `${d.nombre} (${d.codigo})` }));
      } else {
        // Solo ADMIN ve la lista de usuarios; para otros roles queda vacía
        const { data } = await supabase.from("profiles").select("id, nombre, email").eq("rol", "chofer").order("nombre");
        salida.usuariosChofer = (data ?? []).map((d) => ({ value: d.id, label: `${d.nombre} (${d.email})` }));
      }
    }),
  );
  return salida;
}
