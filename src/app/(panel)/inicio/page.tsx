import Link from "next/link";
import { Encabezado } from "@/components/encabezado";
import { IconoMenuItem } from "@/components/shell/icono";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRol } from "@/lib/auth";
import { menuPara, ROL_LABEL, type Rol } from "@/lib/roles";

export const metadata = { title: "Inicio" };

const BIENVENIDA: Record<Rol, string> = {
  super_admin: "Administras la plataforma: creas organizaciones (EO-RS) y sus usuarios.",
  admin: "Administras tu EO-RS: usuarios, maestros, configuración y marca.",
  operaciones: "Aquí programarás los recojos, asignarás unidad y chofer y supervisarás el día.",
  chofer: "Aquí verás tus recojos del día y registrarás llegada, fotos, firma y guía.",
  planta: "Aquí registrarás pesajes, destino final y materiales valorizables.",
  facturacion: "Aquí revisarás servicios cerrados, generarás pre-facturas y conciliarás.",
  cliente: "Aquí verás los servicios, documentos y reportes ambientales de tu empresa.",
};

export default async function InicioPage() {
  const { perfil } = await requireRol();
  const modulos = menuPara(perfil.rol).filter((i) => i.href !== "/inicio");

  return (
    <div className="mx-auto max-w-5xl">
      <Encabezado titulo={`Hola, ${perfil.nombre.split(" ")[0]}`} descripcion={BIENVENIDA[perfil.rol]}>
        <Badge>{ROL_LABEL[perfil.rol]}</Badge>
      </Encabezado>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modulos.map((item) => {
          const href = item.icono === "empresa" ? `/empresa/${perfil.cliente_id}` : item.href;
          const contenido = (
            <Card className={item.fase ? "opacity-60" : "transition-shadow hover:shadow-md"}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <IconoMenuItem icono={item.icono} className="size-5 text-brand" />
                  {item.fase && <Badge variant="secondary">Fase {item.fase}</Badge>}
                </div>
                <CardTitle className="mt-2">{item.label}</CardTitle>
                <CardDescription>{item.fase ? "Disponible en una próxima fase." : "Abrir módulo"}</CardDescription>
              </CardHeader>
            </Card>
          );
          return item.fase ? (
            <div key={item.href}>{contenido}</div>
          ) : (
            <Link key={item.href} href={href}>
              {contenido}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
