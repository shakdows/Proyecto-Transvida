import Link from "next/link";
import { Pencil } from "lucide-react";
import { FormularioMaestro } from "@/components/maestros/formulario-maestro";
import { EstadoActivo, Filtros, patronBusqueda } from "@/components/maestros/utiles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPermisos } from "@/lib/auth";
import { OPCIONES, TIPO_DESTINO } from "@/lib/catalogos";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Destinos" };

export default async function DestinosPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { q, tipo } = await searchParams;
  const permisos = await getPermisos();
  const supabase = await createClient();
  let consulta = supabase.from("destinos").select("*").order("nombre");
  const patron = patronBusqueda(q);
  if (patron) consulta = consulta.or(`nombre.ilike.${patron},autorizacion.ilike.${patron}`);
  if (tipo) consulta = consulta.eq("tipo", tipo);
  const { data: destinos } = await consulta;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div>
        <Filtros q={q} placeholder="Buscar por nombre o autorización" limpiarHref="/maestros/destinos"
          filtros={[{ name: "tipo", label: "Tipo", valor: tipo, opciones: OPCIONES.tipoDestino }]} />
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destino</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Autorización</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {destinos?.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <p className="font-medium">{d.nombre}</p>
                      {d.direccion && <p className="text-xs text-muted-foreground">{d.direccion}</p>}
                    </TableCell>
                    <TableCell>{TIPO_DESTINO[d.tipo]}</TableCell>
                    <TableCell className="text-xs">{d.autorizacion ?? "—"}</TableCell>
                    <TableCell><EstadoActivo activo={d.activo} /></TableCell>
                    <TableCell className="text-right">
                      {permisos["destinos.editar"] && (
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/maestros/editar/destinos/${d.id}`} title="Editar"><Pencil /></Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {destinos?.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Sin destinos.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      {permisos["destinos.editar"] && (
        <Card className="h-fit">
          <CardHeader><CardTitle>Nuevo destino</CardTitle></CardHeader>
          <CardContent><FormularioMaestro tabla="destinos" columnas={1} /></CardContent>
        </Card>
      )}
    </div>
  );
}
