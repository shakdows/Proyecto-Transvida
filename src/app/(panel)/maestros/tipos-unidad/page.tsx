import Link from "next/link";
import { Pencil } from "lucide-react";
import { FormularioMaestro } from "@/components/maestros/formulario-maestro";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPermisos } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Tipos de unidad" };

export default async function TiposUnidadPage() {
  const permisos = await getPermisos();
  const supabase = await createClient();
  const { data: tipos } = await supabase.from("tipos_unidad").select("id, nombre, unidades(count)").order("nombre");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de unidad</TableHead>
                <TableHead className="text-center">Unidades</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tipos?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.nombre}</TableCell>
                  <TableCell className="text-center">{(t.unidades as unknown as { count: number }[])[0]?.count ?? 0}</TableCell>
                  <TableCell className="text-right">
                    {permisos["unidades.editar"] && (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/maestros/editar/tipos_unidad/${t.id}`} title="Editar o eliminar"><Pencil /></Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {permisos["unidades.editar"] && (
        <Card className="h-fit">
          <CardHeader><CardTitle>Agregar tipo de unidad</CardTitle></CardHeader>
          <CardContent>
            <FormularioMaestro tabla="tipos_unidad" columnas={1} textoBoton="Agregar" />
            <p className="mt-3 text-xs text-muted-foreground">Para eliminar un tipo, ábrelo con el lápiz. Se pide la clave de eliminación.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
