import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Pencil } from "lucide-react";
import { BotonEliminar } from "@/components/maestros/boton-eliminar";
import { FormularioMaestro } from "@/components/maestros/formulario-maestro";
import { SinPermiso, Vencimiento } from "@/components/maestros/utiles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPermisos, requireRol } from "@/lib/auth";
import { ESTADO_UNIDAD, TIPO_DOCUMENTO_UNIDAD } from "@/lib/catalogos";
import { cargarOpciones } from "@/lib/opciones";
import { createClient } from "@/lib/supabase/server";
import { formatFecha, formatKg } from "@/lib/utils";

export const metadata = { title: "Unidad" };

export default async function UnidadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { perfil } = await requireRol(["admin", "operaciones", "facturacion", "planta"]);
  const permisos = await getPermisos();
  const supabase = await createClient();

  const { data: unidad } = await supabase.from("unidades").select("*, tipos_unidad(nombre)").eq("id", id).maybeSingle();
  if (!unidad) notFound();
  const [{ data: docs }, opciones] = await Promise.all([
    supabase.from("documentos_unidad").select("*").eq("unidad_id", id).order("fecha_vencimiento"),
    cargarOpciones(["tiposUnidad"]),
  ]);

  // Enlaces temporales (10 min) para ver los archivos
  const conArchivo = (docs ?? []).filter((d) => d.archivo_path);
  const enlaces = new Map<string, string>();
  if (conArchivo.length) {
    const { data } = await supabase.storage.from("documentos").createSignedUrls(conArchivo.map((d) => d.archivo_path as string), 600);
    data?.forEach((d) => d.path && d.signedUrl && enlaces.set(d.path, d.signedUrl));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link href="/maestros/unidades"><ArrowLeft /> Unidades</Link>
          </Button>
          <h2 className="font-mono text-xl font-semibold">{unidad.placa}</h2>
          <p className="text-sm text-muted-foreground">
            {(unidad.tipos_unidad as { nombre: string } | null)?.nombre} · {formatKg(unidad.capacidad_kg)} ·{" "}
            <Badge variant={unidad.estado === "operativa" ? "default" : "secondary"}>{ESTADO_UNIDAD[unidad.estado]}</Badge>
          </p>
        </div>
        {permisos["maestros.eliminar"] && (
          <BotonEliminar tabla="unidades" id={unidad.id} descripcion={`la unidad ${unidad.placa}`} volverA="/maestros/unidades" />
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>Datos de la unidad</CardTitle></CardHeader>
        <CardContent>
          {permisos["unidades.editar"] ? (
            <FormularioMaestro tabla="unidades" id={unidad.id} valores={unidad} opciones={opciones} columnas={3} />
          ) : (
            <SinPermiso />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Documentos ({docs?.length ?? 0})</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Emisión</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Archivo</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs?.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{TIPO_DOCUMENTO_UNIDAD[d.tipo]}</TableCell>
                  <TableCell className="text-xs">{d.numero ?? "—"}</TableCell>
                  <TableCell>{formatFecha(d.fecha_emision)}</TableCell>
                  <TableCell><Vencimiento fecha={d.fecha_vencimiento} /></TableCell>
                  <TableCell>
                    {d.archivo_path && enlaces.get(d.archivo_path) ? (
                      <a href={enlaces.get(d.archivo_path)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">
                        <FileText className="size-4" /> Ver
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {permisos["unidades.editar"] && (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/maestros/editar/documentos_unidad/${d.id}`} title="Editar documento"><Pencil /></Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {docs?.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-6 text-center text-muted-foreground">Sin documentos registrados.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          {permisos["unidades.editar"] && (
            <details className="rounded-md border p-4">
              <summary className="cursor-pointer text-sm font-semibold">+ Agregar documento (SOAT, revisión técnica, habilitación, póliza)</summary>
              <div className="mt-4">
                <FormularioMaestro tabla="documentos_unidad" fijos={{ unidad_id: unidad.id }} columnas={2}
                  carpetaArchivo={`${perfil.organization_id}/unidades/${unidad.id}`} />
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
