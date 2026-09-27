import { Footer } from "@/components/footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginForm } from "./login-form";

export const metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex justify-end p-3">
        <ThemeToggle />
      </div>
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-brand text-lg font-bold text-brand-foreground">
              R
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">ResiduIQ</h1>
            <p className="mt-1 text-sm text-muted-foreground">Gestión integral para operadoras de residuos sólidos</p>
          </div>
          <LoginForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
