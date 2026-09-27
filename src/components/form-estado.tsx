import type { EstadoForm } from "@/app/actions/admin";

export function MensajeForm({ estado }: { estado: EstadoForm }) {
  if (estado.error)
    return (
      <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {estado.error}
      </p>
    );
  if (estado.ok)
    return (
      <p role="status" className="rounded-md bg-brand/10 px-3 py-2 text-sm text-brand">
        {estado.ok}
      </p>
    );
  return null;
}

export function Campo({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
