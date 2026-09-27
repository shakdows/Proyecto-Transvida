import Link from "next/link";
import { FormularioMaestro } from "@/components/maestros/formulario-maestro";
import { ImportarExcel } from "@/components/maestros/importar-excel";
import { Filtros, patronBusqueda, Vencimiento } from "@/components/maestros/utiles";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPermisos } from "@/lib/auth";
import { ESTADO_UNIDAD, OPCIONES } from "@/lib/catalogos";
import { cargarOpciones } from "@/lib/opciones";
import { createClient } from "@/lib/supabase/server";
import { formatKg } from "@/lib/utils";

export const metadata = { title: "Unidades" };

type FilaUnidad = {
  id: string;
  placa: string;
  capacidad_kg: number;
  marca: string | null;
  modelo: string | null;
  estado: string;
  tipos_unidad: { nombre: string } | null;
  documentos_unidad: { tipo: string; fecha_vencimiento: string }[];
};

export default async function UnidadesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { q, estado, tipo } = await searchParams;
  const permisos = await getPermisos();
  const supabase = await createClient();
  let consulta = supabase
    .from("unidades")
    .select("id, placa, capacidad_kg, marca, modelo, estado, tipos_unidad(nombre), documentos_unidad(tipo, fecha_vencimiento)")
    .order("placa");
  const patron = patronBusqueda(q);
  if (patron) consulta = consulta.or(`placa.ilike.${patron},marca.ilike.${patron},modelo.ilike.${patron}`);
  if (estado) consulta = consulta.eq("estado", estado);
  if (tipo) consulta = consulta.eq("tipo_unidad_id", tipo);
  const [{ data }, opciones] = await Promise.all([consulta.returns<FilaUnidad[]>(), cargarOpciones(["tiposUnidad"])]);

  // Documento que vence primero (para el semáforo de la lista)
  const proximo = (docs: FilaUnidad["documentos_unidad"]) =>
    [...docs].sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento))[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <Filtros q={q} placeholder="Buscar por placa, marca o modelo" limpiarHref="/maestros/unidades"
          filtros={[
            { name: "tipo", label: "Tipo", valor: tipo, opciones: opciones.tiposUnidad ?? [] },
            { name: "estado", label: "Estado", valor: estado, opciones: OPCIONES.estadoUnidad },
          ]} />
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Capacidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Próximo vencimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((u) => {
                  const doc = proximo(u.documentos_unidad);
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <Link href={`/maestros/unidades/${u.id}`} className="font-mono font-semibold text-brand hover:underline">{u.placa}</Link>
                        <p className="text-xs text-muted-foreground">{[u.marca, u.modelo].filter(Boolean).join(" ") || "—"}</p>
                      </TableCell>
                      <TableCell>{u.tipos_unidad?.nombre}</TableCell>
                      <TableCell className="text-right">{formatKg(u.capacidad_kg)}</TableCell>
                      <TableCell>
                        <Badge variant={u.estado === "operativa" ? "default" : "secondary"}>{ESTADO_UNIDAD[u.estado]}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {doc ? <Vencimiento fecha={doc.fecha_vencimiento} /> : <span className="text-muted-foreground">Sin documentos</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {data?.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No hay unidades con esos filtros.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <p className="mt-2 text-xs text-muted-foreground">{data?.length ?? 0} unidad(es). Capacidad en kilogramos.</p>
      </div>
      {permisos["unidades.editar"] && (
        <div className="flex flex-col gap-6">
          <Card className="h-fit">
            <CardHeader><CardTitle>Nueva unidad</CardTitle></CardHeader>
            <CardContent>
              <FormularioMaestro tabla="unidades" columnas={1} opciones={opciones} valores={{ estado: "operativa" }} />
            </CardContent>
          </Card>
          <Card className="h-fit">
            <CardHeader><CardTitle>Cargar desde Excel</CardTitle></CardHeader>
            <CardContent><ImportarExcel tipo="unidades" /></CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
