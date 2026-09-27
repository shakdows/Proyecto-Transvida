import Link from "next/link";
import { Encabezado } from "@/components/encabezado";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Clientes" };

export default async function ClientesPage() {
  await requireRol(["admin", "operaciones", "facturacion"]);
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, razon_social, ruc, rubro, contacto_nombre")
    .order("razon_social");

  return (
    <div className="mx-auto max-w-5xl">
      <Encabezado titulo="Clientes" descripcion="Empresas generadoras atendidas por tu organización.">
        <Badge variant="secondary">Registro y edición: Fase 2</Badge>
      </Encabezado>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razón social</TableHead>
                <TableHead>RUC</TableHead>
                <TableHead>Rubro</TableHead>
                <TableHead>Contacto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/empresa/${c.id}`} className="font-medium text-brand hover:underline">
                      {c.razon_social}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{c.ruc}</TableCell>
                  <TableCell>{c.rubro ?? "—"}</TableCell>
                  <TableCell>{c.contacto_nombre ?? "—"}</TableCell>
                </TableRow>
              ))}
              {clientes?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    Aún no hay clientes.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
