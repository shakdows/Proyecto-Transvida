"use client";

import { useActionState, useRef } from "react";
import { Trash2 } from "lucide-react";
import { eliminarMaestro, type EstadoForm } from "@/app/actions/maestros";
import { MensajeForm } from "@/components/form-estado";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TablaMaestro } from "@/lib/maestros";

/** Elimina un registro pidiendo la clave de eliminación de la organización */
export function BotonEliminar({
  tabla,
  id,
  descripcion,
  volverA,
  pequeno = false,
}: {
  tabla: TablaMaestro;
  id: string;
  descripcion: string;
  volverA: string;
  pequeno?: boolean;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [estado, accion, enviando] = useActionState<EstadoForm, FormData>(
    eliminarMaestro.bind(null, tabla, id, volverA),
    {},
  );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={pequeno ? "sm" : "default"}
        className="text-destructive hover:text-destructive"
        onClick={() => dialogo.current?.showModal()}
        title="Eliminar"
      >
        <Trash2 />
        {!pequeno && "Eliminar"}
      </Button>
      <dialog
        ref={dialogo}
        className="m-auto w-[min(92vw,380px)] rounded-lg border bg-card p-0 text-card-foreground shadow-xl backdrop:bg-black/40"
      >
        <form action={accion} className="flex flex-col gap-3 p-5">
          <h2 className="text-base font-semibold">¿Eliminar {descripcion}?</h2>
          <p className="text-sm text-muted-foreground">
            Esta acción no se puede deshacer. Ingresa la clave de eliminación para confirmar.
          </p>
          <Input name="clave" type="password" inputMode="numeric" autoComplete="off" placeholder="Clave" required autoFocus />
          <MensajeForm estado={estado} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => dialogo.current?.close()}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={enviando}>
              {enviando ? "Eliminando…" : "Eliminar"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
