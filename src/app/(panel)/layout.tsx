import { LogOut } from "lucide-react";
import { cerrarSesion } from "@/app/actions/auth";
import { Footer } from "@/components/footer";
import { LogoOrganizacion, textoSobre } from "@/components/marca";
import { Sidebar } from "@/components/shell/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRol } from "@/lib/auth";
import { menuPara, ROL_LABEL } from "@/lib/roles";

const COLOR_PLATAFORMA = "#0f766e";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { perfil, organizacion } = await requireRol();

  const nombreOrg = organizacion
    ? organizacion.nombre_comercial || organizacion.razon_social
    : "ResiduIQ · Plataforma";
  const colorMarca = organizacion?.color_marca ?? COLOR_PLATAFORMA;

  // "Mi empresa" apunta a la empresa del usuario CLIENTE
  const items = menuPara(perfil.rol).map((item) =>
    item.icono === "empresa" ? { ...item, href: `/empresa/${perfil.cliente_id}` } : item,
  );

  const cabecera = (
    <div className="flex min-w-0 items-center gap-3">
      <LogoOrganizacion nombre={nombreOrg} logoUrl={organizacion?.logo_url} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{nombreOrg}</p>
        <p className="text-xs text-muted-foreground">ResiduIQ</p>
      </div>
    </div>
  );

  return (
    <div
      className="flex min-h-screen"
      style={
        {
          "--brand": colorMarca,
          "--brand-foreground": textoSobre(colorMarca),
        } as React.CSSProperties
      }
    >
      <Sidebar items={items} cabecera={cabecera} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/90 px-4 pl-16 backdrop-blur sm:px-6 lg:pl-6">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">Organización activa</p>
            <p className="truncate text-sm font-semibold">
              {organizacion ? organizacion.razon_social : "Administración de la plataforma"}
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{perfil.nombre}</p>
            <Badge>{ROL_LABEL[perfil.rol]}</Badge>
          </div>
          <ThemeToggle />
          <form action={cerrarSesion}>
            <Button variant="outline" size="sm" type="submit" title="Cerrar sesión">
              <LogOut />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </form>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
