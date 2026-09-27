import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BotonEliminar } from "@/components/maestros/boton-eliminar";
import { FormularioMaestro } from "@/components/maestros/formulario-maestro";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPermisos, requireRol } from "@/lib/auth";
import { MAESTROS, TABLAS_MAESTRO, type TablaMaestro } from "@/lib/maestros";
import { cargarOpciones } from "@/lib/opciones";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Editar" };

const EDITABLES: TablaMaestro[] = ["sedes", "tipos_residuo", "tipos_unidad", "destinos", "tarifas", "documentos_unidad", "capacitaciones"];

export default async function EditarPage({ params }: { params: Promise<{ tabla: string; id: string }> }) {
  const { tabla: t, id } = await params;
  if (!TABLAS_MAESTRO.includes(t as TablaMaestro)) notFound();
  const tabla = t as TablaMaestro;
  if (!EDITABLES.includes(tabla)) redirect(`/maestros/${tabla}/${id}`);

  const { perfil } = await requireRol(["admin", "operaciones", "facturacion", "planta"]);
  const permisos = await getPermisos();
  const maestro = MAESTROS[tabla];
  if (!permisos[maestro.permiso]) redirect("/sin-acceso");

  const supabase = await createClient();
  const { data: fila } = await supabase.from(tabla).select("*").eq("id", id).maybeSingle();
  if (!fila) notFound();

  const dinamicas = [...new Set(maestro.campos.map((c) => c.opcionesDinamicas).filter((x) => x !== undefined))];
  const opciones = await cargarOpciones(dinamicas);
  const volver = maestro.ruta(fila);
  const nombre = (fila.nombre ?? fila.codigo ?? maestro.singular) as string;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href={volver}>
            <ArrowLeft /> Volver
          </Link>
        </Button>
        {permisos["maestros.eliminar"] && (
          <BotonEliminar tabla={tabla} id={id} descripcion={`${maestro.singular} "${nombre}"`} volverA={volver} />
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            Editar {maestro.singular}: {nombre}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormularioMaestro
            tabla={tabla}
            id={id}
            valores={fila}
            opciones={opciones}
            carpetaArchivo={tabla === "documentos_unidad" ? `${perfil.organization_id}/unidades/${fila.unidad_id}` : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
