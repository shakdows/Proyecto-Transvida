import { Encabezado } from "@/components/encabezado";
import { Pestanas } from "@/components/maestros/pestanas";
import { requireRol } from "@/lib/auth";
import { SECCIONES_MAESTROS } from "@/lib/maestros";

const ROLES_MAESTROS = ["admin", "operaciones", "facturacion", "planta"] as const;

export default async function MaestrosLayout({ children }: { children: React.ReactNode }) {
  const { perfil } = await requireRol([...ROLES_MAESTROS]);
  const comercial = ["admin", "operaciones", "facturacion"].includes(perfil.rol);
  const items = SECCIONES_MAESTROS.filter((s) => !("soloComercial" in s) || comercial);

  return (
    <div className="mx-auto max-w-6xl">
      <Encabezado titulo="Maestros" descripcion="Datos base de la operación: clientes, residuos, flota, choferes, destinos y tarifas." />
      <Pestanas items={items.map((i) => ({ href: i.href, label: i.label }))} />
      {children}
    </div>
  );
}
