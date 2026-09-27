import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Sin acceso" };

export default function SinAccesoPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <ShieldAlert className="size-12 text-destructive" />
      <h1 className="mt-4 text-xl font-semibold">No tienes acceso a esta sección</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Tu rol no tiene permiso para ver esta página o la información no pertenece a tu empresa.
      </p>
      <Button asChild className="mt-6">
        <Link href="/inicio">Volver al inicio</Link>
      </Button>
    </div>
  );
}
