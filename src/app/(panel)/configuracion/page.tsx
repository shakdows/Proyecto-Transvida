import { Encabezado } from "@/components/encabezado";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ClaveForm } from "./clave-form";
import { MarcaForm } from "./marca-form";
import { PermisosForm } from "./permisos-form";

export const metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
  const { organizacion } = await requireRol(["admin"]);
  if (!organizacion) return null;
  const supabase = await createClient();
  const { data: permisos } = await supabase
    .from("permisos_rol")
    .select("rol, permiso, permitido")
    .eq("organization_id", organizacion.id);
  const actuales = Object.fromEntries((permisos ?? []).map((p) => [`${p.rol}:${p.permiso}`, p.permitido]));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Encabezado titulo="Configuración" descripcion="Datos, marca, permisos por rol y seguridad de tu organización." />
      <Card>
        <CardHeader>
          <CardTitle>{organizacion.razon_social}</CardTitle>
          <CardDescription>RUC {organizacion.ruc}</CardDescription>
        </CardHeader>
        <CardContent>
          <MarcaForm organizacion={organizacion} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Permisos por rol</CardTitle>
          <CardDescription>Marca qué puede hacer cada rol de tu organización.</CardDescription>
        </CardHeader>
        <CardContent>
          <PermisosForm actuales={actuales} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Clave de eliminación</CardTitle>
          <CardDescription>Se pide al eliminar cualquier registro de Maestros. La clave inicial es 1234.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClaveForm />
        </CardContent>
      </Card>
    </div>
  );
}
