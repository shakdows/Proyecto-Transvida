import { Encabezado } from "@/components/encabezado";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRol } from "@/lib/auth";
import { ROL_LABEL, type Rol } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { formatFecha } from "@/lib/utils";
import { NuevoUsuarioForm } from "./nuevo-usuario-form";

export const metadata = { title: "Usuarios" };

type FilaUsuario = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  created_at: string;
  organizations: { nombre_comercial: string | null; razon_social: string } | null;
  clientes: { razon_social: string } | null;
};

export default async function UsuariosPage() {
  const { perfil } = await requireRol(["super_admin", "admin"]);
  const esSuper = perfil.rol === "super_admin";
  const supabase = await createClient();

  const [{ data: usuarios }, { data: orgs }, { data: clientes }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nombre, email, rol, activo, created_at, organizations(nombre_comercial, razon_social), clientes(razon_social)")
      .order("created_at")
      .returns<FilaUsuario[]>(),
    supabase.from("organizations").select("id, razon_social").order("razon_social"),
    supabase.from("clientes").select("id, razon_social, organization_id").order("razon_social"),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <Encabezado
        titulo="Usuarios"
        descripcion={esSuper ? "Usuarios de todas las organizaciones." : "Personas con acceso a tu organización."}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Rol</TableHead>
                  {esSuper && <TableHead>Organización</TableHead>}
                  <TableHead>Empresa cliente</TableHead>
                  <TableHead>Alta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p className="font-medium">{u.nombre}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.activo ? "default" : "secondary"}>{ROL_LABEL[u.rol]}</Badge>
                    </TableCell>
                    {esSuper && (
                      <TableCell className="text-xs">
                        {u.organizations ? u.organizations.nombre_comercial || u.organizations.razon_social : "Plataforma"}
                      </TableCell>
                    )}
                    <TableCell className="text-xs">{u.clientes?.razon_social ?? "—"}</TableCell>
                    <TableCell>{formatFecha(u.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Nuevo usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <NuevoUsuarioForm esSuper={esSuper} organizaciones={orgs ?? []} clientes={clientes ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
