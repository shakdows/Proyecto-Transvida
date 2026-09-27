"use client";

import { useActionState } from "react";
import { actualizarMarca, type EstadoForm } from "@/app/actions/admin";
import { Campo, MensajeForm } from "@/components/form-estado";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Organizacion } from "@/lib/auth";

export function MarcaForm({ organizacion }: { organizacion: Organizacion }) {
  const [estado, accion, enviando] = useActionState<EstadoForm, FormData>(actualizarMarca, {});
  return (
    <form action={accion} className="flex flex-col gap-4">
      <Campo label="Nombre comercial" htmlFor="nombre_comercial">
        <Input id="nombre_comercial" name="nombre_comercial" defaultValue={organizacion.nombre_comercial ?? ""} />
      </Campo>
      <Campo label="Registro EO-RS" htmlFor="registro_eors">
        <Input id="registro_eors" name="registro_eors" defaultValue={organizacion.registro_eors ?? ""} />
      </Campo>
      <Campo label="Color de marca" htmlFor="color_marca">
        <Input id="color_marca" name="color_marca" type="color" defaultValue={organizacion.color_marca} className="h-10 w-24 p-1" />
      </Campo>
      <Campo label="Enlace del logo (https://…, opcional)" htmlFor="logo_url">
        <Input id="logo_url" name="logo_url" type="url" defaultValue={organizacion.logo_url ?? ""} placeholder="https://" />
      </Campo>
      <MensajeForm estado={estado} />
      <Button type="submit" disabled={enviando} className="self-start">
        {enviando ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
