import Link from "next/link";
import { FormularioMaestro } from "@/components/maestros/formulario-maestro";
import { ImportarExcel } from "@/components/maestros/importar-excel";
import { EstadoActivo, Filtros, patronBusqueda } from "@/components/maestros/utiles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPermisos } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Clientes" };

export default async function ClientesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { q, rubro, estado } = await searchParams;
  const permisos = await getPermisos();
  const supabase = await createClient();

  let consulta = supabase
    .from("clientes")
    .select("id, razon_social, ruc, rubro, contacto_nombre, activo, sedes(count)")
    .order("razon_social");
  const patron = patronBusqueda(q);
  if (patron) consulta = consulta.or(`razon_social.ilike.${patron},ruc.ilike.${patron}`);
  if (rubro) consulta = consulta.eq("rubro", rubro);
  if (estado) consulta = consulta.eq("activo", estado === "activo");

  const [{ data: clientes }, { data: rubros }] = await Promise.all([
    consulta,
    supabase.from("clientes").select("rubro").not("rubro", "is", null),
  ]);
  const listaRubros = [...new Set((rubros ?? []).map((r) => r.rubro as string))].sort();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <Filtros
          q={q}
          placeholder="Buscar por razón social o RUC"
          limpiarHref="/maestros/clientes"
          filtros={[
            { name: "rubro", label: "Rubro", valor: rubro, opciones: listaRubros.map((r) => ({ value: r, label: r })) },
            { name: "estado", label: "Estado", valor: estado, opciones: [{ value: "activo", label: "Activos" }, { value: "inactivo", label: "Inactivos" }] },
          ]}
        />
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Razón social</TableHead>
                  <TableHead>RUC</TableHead>
                  <TableHead>Rubro</TableHead>
                  <TableHead className="text-center">Sedes</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes?.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/maestros/clientes/${c.id}`} className="font-medium text-brand hover:underline">
                        {c.razon_social}
                      </Link>
                      {c.contacto_nombre && <p className="text-xs text-muted-foreground">{c.contacto_nombre}</p>}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.ruc}</TableCell>
                    <TableCell>{c.rubro ?? "—"}</TableCell>
                    <TableCell className="text-center">{(c.sedes as unknown as { count: number }[])[0]?.count ?? 0}</TableCell>
                    <TableCell>
                      <EstadoActivo activo={c.activo} />
                    </TableCell>
                  </TableRow>
                ))}
                {clientes?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No hay clientes con esos filtros.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <p className="mt-2 text-xs text-muted-foreground">{clientes?.length ?? 0} cliente(s)</p>
      </div>

      {permisos["clientes.editar"] && (
        <div className="flex flex-col gap-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Nuevo cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <FormularioMaestro tabla="clientes" columnas={1} />
            </CardContent>
          </Card>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Cargar desde Excel</CardTitle>
            </CardHeader>
            <CardContent>
              <ImportarExcel tipo="clientes" />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
