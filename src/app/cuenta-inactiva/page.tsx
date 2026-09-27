import { cerrarSesion } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Cuenta inactiva" };

export default function CuentaInactivaPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-semibold">Tu cuenta no está activa</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Tu usuario no tiene un perfil activo en ninguna organización. Pide ayuda al administrador de tu empresa.
      </p>
      <form action={cerrarSesion} className="mt-6">
        <Button type="submit">Volver al inicio de sesión</Button>
      </form>
    </main>
  );
}
