import { Encabezado } from "@/components/encabezado";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatFecha } from "@/lib/utils";
import { NuevaOrganizacionForm } from "./nueva-organizacion-form";

export const metadata = { title: "Organizaciones" };

export default async function OrganizacionesPage() {
  await requireRol(["super_admin"]);
  const supabase = await createClient();
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, razon_social, nombre_comercial, ruc, registro_eors, color_marca, plan, activo, created_at")
    .order("razon_social");

  return (
    <div className="mx-auto max-w-6xl">
      <Encabezado titulo="Organizaciones" descripcion="Empresas operadoras de residuos sólidos (EO-RS) que usan la plataforma." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Razón social</TableHead>
                  <TableHead>RUC</TableHead>
                  <TableHead>Registro EO-RS</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Alta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs?.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="size-3 rounded-full" style={{ background: o.color_marca }} />
                        <div>
                          <p className="font-medium">{o.razon_social}</p>
                          {o.nombre_comercial && <p className="text-xs text-muted-foreground">{o.nombre_comercial}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{o.ruc}</TableCell>
                    <TableCell className="text-xs">{o.registro_eors ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{o.plan}</Badge>
                    </TableCell>
                    <TableCell>{formatFecha(o.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Nueva organización</CardTitle>
          </CardHeader>
          <CardContent>
            <NuevaOrganizacionForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
