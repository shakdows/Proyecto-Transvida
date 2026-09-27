import Link from "next/link";
import { FormularioMaestro } from "@/components/maestros/formulario-maestro";
import { EstadoActivo, Filtros, patronBusqueda, Vencimiento } from "@/components/maestros/utiles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPermisos } from "@/lib/auth";
import { OPCIONES } from "@/lib/catalogos";
import { cargarOpciones } from "@/lib/opciones";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Choferes" };

export default async function ChoferesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { q, categoria, estado } = await searchParams;
  const permisos = await getPermisos();
  const supabase = await createClient();
  let consulta = supabase
    .from("choferes")
    .select("id, nombres, apellidos, dni, telefono, licencia_numero, licencia_categoria, licencia_vencimiento, activo, capacitaciones(count)")
    .order("apellidos");
  const patron = patronBusqueda(q);
  if (patron) consulta = consulta.or(`nombres.ilike.${patron},apellidos.ilike.${patron},dni.ilike.${patron}`);
  if (categoria) consulta = consulta.eq("licencia_categoria", categoria);
  if (estado) consulta = consulta.eq("activo", estado === "activo");
  const [{ data: choferes }, opciones] = await Promise.all([consulta, cargarOpciones(["usuariosChofer"])]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <Filtros q={q} placeholder="Buscar por nombre o DNI" limpiarHref="/maestros/choferes"
          filtros={[
            { name: "categoria", label: "Licencia", valor: categoria, opciones: OPCIONES.categoriaLicencia },
            { name: "estado", label: "Estado", valor: estado, opciones: [{ value: "activo", label: "Activos" }, { value: "inactivo", label: "Inactivos" }] },
          ]} />
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chofer</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Licencia</TableHead>
                  <TableHead>Vencimiento de licencia</TableHead>
                  <TableHead className="text-center">Capacit.</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {choferes?.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/maestros/choferes/${c.id}`} className="font-medium text-brand hover:underline">
                        {c.apellidos}, {c.nombres}
                      </Link>
                      {c.telefono && <p className="text-xs text-muted-foreground">{c.telefono}</p>}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.dni}</TableCell>
                    <TableCell className="text-xs">{c.licencia_categoria} · {c.licencia_numero}</TableCell>
                    <TableCell className="text-xs"><Vencimiento fecha={c.licencia_vencimiento} /></TableCell>
                    <TableCell className="text-center">{(c.capacitaciones as unknown as { count: number }[])[0]?.count ?? 0}</TableCell>
                    <TableCell><EstadoActivo activo={c.activo} /></TableCell>
                  </TableRow>
                ))}
                {choferes?.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No hay choferes con esos filtros.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <p className="mt-2 text-xs text-muted-foreground">{choferes?.length ?? 0} chofer(es)</p>
      </div>
      {permisos["choferes.editar"] && (
        <Card className="h-fit">
          <CardHeader><CardTitle>Nuevo chofer</CardTitle></CardHeader>
          <CardContent><FormularioMaestro tabla="choferes" columnas={1} opciones={opciones} /></CardContent>
        </Card>
      )}
    </div>
  );
}
