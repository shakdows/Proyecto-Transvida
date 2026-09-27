import { redirect } from "next/navigation";
import { Encabezado } from "@/components/encabezado";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatFecha } from "@/lib/utils";

export const metadata = { title: "Empresa" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EmpresaPage({ params }: { params: Promise<{ id: string }> }) {
  const { perfil } = await requireRol(["admin", "operaciones", "facturacion", "cliente"]);
  const { id } = await params;

  // Un CLIENTE solo puede abrir su propia empresa (además, la base de datos lo impide con RLS).
  if (perfil.rol === "cliente" && id !== perfil.cliente_id) redirect("/sin-acceso");
  if (!UUID.test(id)) redirect("/sin-acceso");

  const supabase = await createClient();
  const { data: empresa } = await supabase
    .from("clientes")
    .select("id, razon_social, ruc, rubro, contacto_nombre, contacto_email, contacto_telefono, created_at")
    .eq("id", id)
    .maybeSingle();

  // Si la base de datos no la devuelve, es de otra organización o no existe.
  if (!empresa) redirect("/sin-acceso");

  const { data: sedes } = await supabase
    .from("sedes")
    .select("id, nombre, direccion, distrito, horario_recojo, contacto_nombre")
    .eq("cliente_id", id)
    .eq("activo", true)
    .order("nombre");

  const filas: [string, string][] = [
    ["Razón social", empresa.razon_social],
    ["RUC", empresa.ruc],
    ["Rubro", empresa.rubro ?? "—"],
    ["Contacto", empresa.contacto_nombre ?? "—"],
    ["Correo de contacto", empresa.contacto_email ?? "—"],
    ["Teléfono", empresa.contacto_telefono ?? "—"],
    ["Cliente desde", formatFecha(empresa.created_at)],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <Encabezado
        titulo={empresa.razon_social}
        descripcion={perfil.rol === "cliente" ? "Datos de tu empresa." : "Ficha del cliente."}
      />
      <Card>
        <CardHeader>
          <CardTitle>Datos generales</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[180px_1fr]">
            {filas.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-sm text-muted-foreground">{k}</dt>
                <dd className="text-sm font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Sedes ({sedes?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {sedes?.map((s) => (
            <div key={s.id} className="rounded-md border p-3 text-sm">
              <p className="font-medium">{s.nombre}</p>
              <p className="text-muted-foreground">{[s.direccion, s.distrito].filter(Boolean).join(", ")}</p>
              {s.horario_recojo && <p className="text-xs text-muted-foreground">Horario de recojo: {s.horario_recojo}</p>}
            </div>
          ))}
          {sedes?.length === 0 && <p className="text-sm text-muted-foreground">Sin sedes registradas.</p>}
        </CardContent>
      </Card>
      <p className="mt-4 text-sm text-muted-foreground">
        Servicios, documentos y el dashboard ambiental se agregan en las próximas fases.
      </p>
    </div>
  );
}
