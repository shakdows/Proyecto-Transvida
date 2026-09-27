import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { BotonEliminar } from "@/components/maestros/boton-eliminar";
import { FormularioMaestro } from "@/components/maestros/formulario-maestro";
import { EstadoActivo, SinPermiso, Vencimiento } from "@/components/maestros/utiles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPermisos, requireRol } from "@/lib/auth";
import { cargarOpciones } from "@/lib/opciones";
import { createClient } from "@/lib/supabase/server";
import { formatFecha } from "@/lib/utils";

export const metadata = { title: "Chofer" };

export default async function ChoferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRol(["admin", "operaciones", "facturacion", "planta"]);
  const permisos = await getPermisos();
  const supabase = await createClient();

  const { data: chofer } = await supabase.from("choferes").select("*").eq("id", id).maybeSingle();
  if (!chofer) notFound();
  const [{ data: caps }, opciones] = await Promise.all([
    supabase.from("capacitaciones").select("*").eq("chofer_id", id).order("fecha", { ascending: false }),
    cargarOpciones(["usuariosChofer"]),
  ]);
  const nombre = `${chofer.nombres} ${chofer.apellidos}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link href="/maestros/choferes"><ArrowLeft /> Choferes</Link>
          </Button>
          <h2 className="text-xl font-semibold">{nombre}</h2>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            DNI {chofer.dni} · Licencia {chofer.licencia_categoria} · <Vencimiento fecha={chofer.licencia_vencimiento} /> <EstadoActivo activo={chofer.activo} />
          </p>
        </div>
        {permisos["maestros.eliminar"] && (
          <BotonEliminar tabla="choferes" id={chofer.id} descripcion={`al chofer ${nombre}`} volverA="/maestros/choferes" />
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>Datos del chofer</CardTitle></CardHeader>
        <CardContent>
          {permisos["choferes.editar"] ? (
            <FormularioMaestro tabla="choferes" id={chofer.id} valores={chofer} opciones={opciones} columnas={3} />
          ) : (
            <SinPermiso />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Capacitaciones ({caps?.length ?? 0})</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capacitación</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {caps?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell>{formatFecha(c.fecha)}</TableCell>
                  <TableCell className="text-xs">{c.vencimiento ? <Vencimiento fecha={c.vencimiento} /> : "No vence"}</TableCell>
                  <TableCell className="text-right">
                    {permisos["choferes.editar"] && (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/maestros/editar/capacitaciones/${c.id}`} title="Editar"><Pencil /></Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {caps?.length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">Sin capacitaciones.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          {permisos["choferes.editar"] && (
            <details className="rounded-md border p-4">
              <summary className="cursor-pointer text-sm font-semibold">+ Agregar capacitación</summary>
              <div className="mt-4">
                <FormularioMaestro tabla="capacitaciones" fijos={{ chofer_id: chofer.id }} columnas={3} />
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
