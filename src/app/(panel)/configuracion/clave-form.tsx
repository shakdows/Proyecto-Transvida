"use client";

import { useActionState, useEffect, useRef } from "react";
import { cambiarClaveEliminacion, type EstadoForm } from "@/app/actions/maestros";
import { Campo, MensajeForm } from "@/components/form-estado";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ClaveForm() {
  const [estado, accion, enviando] = useActionState<EstadoForm, FormData>(cambiarClaveEliminacion, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado.ok) ref.current?.reset();
  }, [estado]);
  return (
    <form ref={ref} action={accion} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo label="Clave actual" htmlFor="actual">
          <Input id="actual" name="actual" type="password" autoComplete="off" required />
        </Campo>
        <Campo label="Nueva clave (mín. 4)" htmlFor="nueva">
          <Input id="nueva" name="nueva" type="password" autoComplete="off" minLength={4} required />
        </Campo>
        <Campo label="Repite la nueva clave" htmlFor="confirmar">
          <Input id="confirmar" name="confirmar" type="password" autoComplete="off" minLength={4} required />
        </Campo>
      </div>
      <MensajeForm estado={estado} />
      <Button type="submit" disabled={enviando} className="self-start">
        {enviando ? "Guardando…" : "Cambiar clave"}
      </Button>
    </form>
  );
}
