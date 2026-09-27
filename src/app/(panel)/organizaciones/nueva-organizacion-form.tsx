"use client";

import { useActionState } from "react";
import { crearOrganizacion, type EstadoForm } from "@/app/actions/admin";
import { Campo, MensajeForm } from "@/components/form-estado";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NuevaOrganizacionForm() {
  const [estado, accion, enviando] = useActionState<EstadoForm, FormData>(crearOrganizacion, {});
  return (
    <form action={accion} className="flex flex-col gap-3">
      <Campo label="Razón social" htmlFor="razon_social">
        <Input id="razon_social" name="razon_social" required />
      </Campo>
      <Campo label="Nombre comercial" htmlFor="nombre_comercial">
        <Input id="nombre_comercial" name="nombre_comercial" />
      </Campo>
      <Campo label="RUC" htmlFor="ruc">
        <Input id="ruc" name="ruc" inputMode="numeric" maxLength={11} pattern="\d{11}" required />
      </Campo>
      <Campo label="Registro EO-RS" htmlFor="registro_eors">
        <Input id="registro_eors" name="registro_eors" />
      </Campo>
      <Campo label="Color de marca" htmlFor="color_marca">
        <Input id="color_marca" name="color_marca" type="color" defaultValue="#0f766e" className="h-10 p-1" />
      </Campo>
      <MensajeForm estado={estado} />
      <Button type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Crear organización"}
      </Button>
    </form>
  );
}
