import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { BotonEliminar } from "@/components/maestros/boton-eliminar";
import { FormularioMaestro } from "@/components/maestros/formulario-maestro";
import { EstadoActivo, SinPermiso } from "@/components/maestros/utiles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPermisos, requireRol } from "@/lib/auth";
import { MODALIDAD_TARIFA } from "@/lib/catalogos";
import { createClient } from "@/lib/supabase/server";
import { formatFecha, formatSoles } from "@/lib/utils";

export const metadata = { title: "Cliente" };

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { perfil } = await requireRol(["admin", "operaciones", "facturacion", "planta"]);
  const permisos = await getPermisos();
  const supabase = await createClient();
  const verTarifas = ["admin", "operaciones", "facturacion"].includes(perfil.rol);

  const { data: cliente } = await supabase.from("clientes").select("*").eq("id", id).maybeSingle();
  if (!cliente) notFound();

  const [{ data: sedes }, { data: tarifas }] = await Promise.all([
    supabase.from("sedes").select("*").eq("cliente_id", id).order("nombre"),
    verTarifas
      ? supabase
          .from("tarifas")
          .select("id, modalidad, precio_con_igv, vigente_desde, vigente_hasta, tipos_residuo(nombre)")
          .eq("cliente_id", id)
          .order("vigente_desde", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link href="/maestros/clientes">
              <ArrowLeft /> Clientes
            </Link>
          </Button>
          <h2 className="text-xl font-semibold">{cliente.razon_social}</h2>
          <p className="text-sm text-muted-foreground">
            RUC {cliente.ruc} · <EstadoActivo activo={cliente.activo} />
          </p>
        </div>
        {permisos["maestros.eliminar"] && (
          <BotonEliminar tabla="clientes" id={cliente.id} descripcion={`el cliente ${cliente.razon_social}`} volverA="/maestros/clientes" />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del cliente</CardTitle>
        </CardHeader>
        <CardContent>
          {permisos["clientes.editar"] ? (
            <FormularioMaestro tabla="clientes" id={cliente.id} valores={cliente} columnas={3} />
          ) : (
            <>
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                {[
                  ["Rubro", cliente.rubro],
                  ["Dirección fiscal", cliente.direccion_fiscal],
                  ["Contacto", cliente.contacto_nombre],
                  ["Correo", cliente.contacto_email],
                  ["Teléfono", cliente.contacto_telefono],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v || "—"}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3">
                <SinPermiso />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sedes ({sedes?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sede</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Horario de recojo</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sedes?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.nombre}</TableCell>
                  <TableCell>
                    {s.direccion}
                    <p className="text-xs text-muted-foreground">{[s.distrito, s.provincia, s.departamento].filter(Boolean).join(", ")}</p>
                  </TableCell>
                  <TableCell>{s.horario_recojo ?? "—"}</TableCell>
                  <TableCell>
                    {s.contacto_nombre ?? "—"}
                    {s.contacto_telefono && <p className="text-xs text-muted-foreground">{s.contacto_telefono}</p>}
                  </TableCell>
                  <TableCell>
                    <EstadoActivo activo={s.activo} />
                  </TableCell>
                  <TableCell className="text-right">
                    {permisos["sedes.editar"] && (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/maestros/editar/sedes/${s.id}`} title="Editar sede">
                          <Pencil />
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {sedes?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                    Este cliente aún no tiene sedes.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {permisos["sedes.editar"] && (
            <details className="rounded-md border p-4">
              <summary className="cursor-pointer text-sm font-semibold">+ Agregar sede</summary>
              <div className="mt-4">
                <FormularioMaestro tabla="sedes" fijos={{ cliente_id: cliente.id }} columnas={3} />
              </div>
            </details>
          )}
        </CardContent>
      </Card>

      {verTarifas && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Tarifas</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href={`/maestros/tarifas?cliente=${cliente.id}`}>Ver en Tarifas</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de residuo</TableHead>
                  <TableHead>Modalidad</TableHead>
                  <TableHead className="text-right">Precio (inc. IGV)</TableHead>
                  <TableHead>Vigencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tarifas ?? []).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{(t.tipos_residuo as unknown as { nombre: string } | null)?.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{MODALIDAD_TARIFA[t.modalidad]}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatSoles(t.precio_con_igv)}</TableCell>
                    <TableCell className="text-xs">
                      {formatFecha(t.vigente_desde)} → {t.vigente_hasta ? formatFecha(t.vigente_hasta) : "sin fin"}
                    </TableCell>
                  </TableRow>
                ))}
                {(tarifas ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                      Sin tarifas registradas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
