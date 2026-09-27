import Link from "next/link";
import { Pencil } from "lucide-react";
import { FormularioMaestro } from "@/components/maestros/formulario-maestro";
import { Filtros } from "@/components/maestros/utiles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPermisos, requireRol } from "@/lib/auth";
import { MODALIDAD_TARIFA, OPCIONES } from "@/lib/catalogos";
import { cargarOpciones } from "@/lib/opciones";
import { createClient } from "@/lib/supabase/server";
import { formatFecha, formatSoles, hoyLima } from "@/lib/utils";

export const metadata = { title: "Tarifas" };

export default async function TarifasPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRol(["admin", "operaciones", "facturacion"]);
  const { cliente, modalidad } = await searchParams;
  const permisos = await getPermisos();
  const supabase = await createClient();
  let consulta = supabase
    .from("tarifas")
    .select("id, modalidad, precio_con_igv, vigente_desde, vigente_hasta, clientes(razon_social), tipos_residuo(nombre, codigo)")
    .order("vigente_desde", { ascending: false });
  if (cliente) consulta = consulta.eq("cliente_id", cliente);
  if (modalidad) consulta = consulta.eq("modalidad", modalidad);
  const [{ data: tarifas }, opciones] = await Promise.all([consulta, cargarOpciones(["clientes", "tiposResiduo"])]);
  const hoy = hoyLima();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <Filtros sinBusqueda limpiarHref="/maestros/tarifas"
          filtros={[
            { name: "cliente", label: "Cliente", valor: cliente, opciones: opciones.clientes ?? [] },
            { name: "modalidad", label: "Modalidad", valor: modalidad, opciones: OPCIONES.modalidad },
          ]} />
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo de residuo</TableHead>
                  <TableHead>Modalidad</TableHead>
                  <TableHead className="text-right">Precio (inc. IGV)</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tarifas?.map((t) => {
                  const vigente = t.vigente_desde <= hoy && (!t.vigente_hasta || t.vigente_hasta >= hoy);
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{(t.clientes as unknown as { razon_social: string } | null)?.razon_social}</TableCell>
                      <TableCell>{(t.tipos_residuo as unknown as { nombre: string } | null)?.nombre}</TableCell>
                      <TableCell><Badge variant="secondary">{MODALIDAD_TARIFA[t.modalidad]}</Badge></TableCell>
                      <TableCell className="text-right font-medium">
                        {formatSoles(t.precio_con_igv)}
                        {t.modalidad === "por_kg" && <span className="text-xs text-muted-foreground"> /kg</span>}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatFecha(t.vigente_desde)} → {t.vigente_hasta ? formatFecha(t.vigente_hasta) : "sin fin"}
                        {!vigente && <Badge variant="secondary" className="ml-1">No vigente</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        {permisos["tarifas.editar"] && (
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/maestros/editar/tarifas/${t.id}`} title="Editar"><Pencil /></Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {tarifas?.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Sin tarifas.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <p className="mt-2 text-xs text-muted-foreground">Precios en soles (S/) con IGV incluido.</p>
      </div>
      {permisos["tarifas.editar"] && (
        <Card className="h-fit">
          <CardHeader><CardTitle>Nueva tarifa</CardTitle></CardHeader>
          <CardContent>
            <FormularioMaestro tabla="tarifas" columnas={1} opciones={opciones}
              valores={{ vigente_desde: hoy, cliente_id: cliente ?? "" }} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
