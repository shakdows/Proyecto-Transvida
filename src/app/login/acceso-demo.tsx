"use client";

import { useState, useTransition } from "react";
import { FlaskConical } from "lucide-react";
import { entrarComoDemo } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { USUARIOS_DEMO } from "@/lib/demo";

export function AccesoDemo() {
  const [error, setError] = useState<string>();
  const [cargando, setCargando] = useState<string>();
  const [, iniciar] = useTransition();

  return (
    <div className="mt-6 rounded-lg border border-dashed p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <FlaskConical className="size-4 text-brand" /> Modo prueba: entrar con un clic
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Usuarios de empresas ficticias. Lo que registres se guarda de verdad.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {USUARIOS_DEMO.map((u) => (
          <Button
            key={u.email}
            type="button"
            variant="outline"
            className="h-auto flex-col items-start gap-0 whitespace-normal px-3 py-2 text-left"
            disabled={Boolean(cargando)}
            onClick={() => {
              setError(undefined);
              setCargando(u.email);
              iniciar(async () => {
                const r = await entrarComoDemo(u.email);
                if (r?.error) {
                  setError(r.error);
                  setCargando(undefined);
                }
              });
            }}
          >
            <span className="text-sm font-semibold">{cargando === u.email ? "Entrando…" : u.rol}</span>
            <span className="text-xs font-normal text-muted-foreground">{u.detalle}</span>
          </Button>
        ))}
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
