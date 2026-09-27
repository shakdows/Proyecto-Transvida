import Link from "next/link";
import { Pencil } from "lucide-react";
import { FormularioMaestro } from "@/components/maestros/formulario-maestro";
import { EstadoActivo, Filtros, patronBusqueda } from "@/components/maestros/utiles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPermisos } from "@/lib/auth";
import { CLASE_RESIDUO, OPCIONES } from "@/lib/catalogos";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Tipos de residuo" };

const COLOR_CLASE: Record<string, string> = {
  aprovechable: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  no_peligroso: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  peligroso: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export default async function TiposResiduoPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { q, clase } = await searchParams;
  const permisos = await getPermisos();
  const supabase = await createClient();
  let consulta = supabase.from("tipos_residuo").select("*").order("clase").order("nombre");
  const patron = patronBusqueda(q);
  if (patron) consulta = consulta.or(`nombre.ilike.${patron},codigo.ilike.${patron}`);
  if (clase) consulta = consulta.eq("clase", clase);
  const { data: tipos } = await consulta;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div>
        <Filtros q={q} placeholder="Buscar por nombre o código" limpiarHref="/maestros/tipos-residuo"
          filtros={[{ name: "clase", label: "Clase", valor: clase, opciones: OPCIONES.clase }]} />
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Clase</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tipos?.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.codigo}</TableCell>
                    <TableCell className="font-medium">{t.nombre}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_CLASE[t.clase]}`}>{CLASE_RESIDUO[t.clase]}</span>
                    </TableCell>
                    <TableCell><Badge variant="outline">kg</Badge></TableCell>
                    <TableCell><EstadoActivo activo={t.activo} /></TableCell>
                    <TableCell className="text-right">
                      {permisos["tipos_residuo.editar"] && (
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/maestros/editar/tipos_residuo/${t.id}`} title="Editar"><Pencil /></Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <p className="mt-2 text-xs text-muted-foreground">{tipos?.length ?? 0} tipo(s). Todos se registran en kilogramos (kg).</p>
      </div>
      {permisos["tipos_residuo.editar"] && (
        <Card className="h-fit">
          <CardHeader><CardTitle>Nuevo tipo de residuo</CardTitle></CardHeader>
          <CardContent><FormularioMaestro tabla="tipos_residuo" columnas={1} /></CardContent>
        </Card>
      )}
    </div>
  );
}
