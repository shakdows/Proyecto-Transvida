import { Encabezado } from "@/components/encabezado";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRol } from "@/lib/auth";
import { MarcaForm } from "./marca-form";

export const metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
  const { organizacion } = await requireRol(["admin"]);
  if (!organizacion) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <Encabezado titulo="Configuración" descripcion="Datos y marca de tu organización." />
      <Card>
        <CardHeader>
          <CardTitle>{organizacion.razon_social}</CardTitle>
          <p className="text-sm text-muted-foreground">RUC {organizacion.ruc}</p>
        </CardHeader>
        <CardContent>
          <MarcaForm organizacion={organizacion} />
        </CardContent>
      </Card>
    </div>
  );
}
