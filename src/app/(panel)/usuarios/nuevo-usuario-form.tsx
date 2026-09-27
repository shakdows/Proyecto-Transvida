"use client";

import { useActionState, useState } from "react";
import { crearUsuario, type EstadoForm } from "@/app/actions/admin";
import { Campo, MensajeForm } from "@/components/form-estado";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { ROL_LABEL, ROLES } from "@/lib/roles";

type Props = {
  esSuper: boolean;
  organizaciones: { id: string; razon_social: string }[];
  clientes: { id: string; razon_social: string; organization_id: string }[];
};

export function NuevoUsuarioForm({ esSuper, organizaciones, clientes }: Props) {
  const [estado, accion, enviando] = useActionState<EstadoForm, FormData>(crearUsuario, {});
  const [rol, setRol] = useState("");
  const [org, setOrg] = useState(organizaciones[0]?.id ?? "");

  const rolesDisponibles = ROLES.filter((r) => esSuper || r !== "super_admin");
  const clientesDeOrg = esSuper ? clientes.filter((c) => c.organization_id === org) : clientes;

  return (
    <form action={accion} className="flex flex-col gap-3">
      <Campo label="Nombre completo" htmlFor="nombre">
        <Input id="nombre" name="nombre" required />
      </Campo>
      <Campo label="Correo" htmlFor="email">
        <Input id="email" name="email" type="email" required />
      </Campo>
      <Campo label="Contraseña inicial (mín. 8 caracteres)" htmlFor="password">
        <Input id="password" name="password" type="text" minLength={8} required />
      </Campo>
      <Campo label="Rol" htmlFor="rol">
        <Select id="rol" name="rol" required value={rol} onChange={(e) => setRol(e.target.value)}>
          <option value="" disabled>
            Elige un rol…
          </option>
          {rolesDisponibles.map((r) => (
            <option key={r} value={r}>
              {ROL_LABEL[r]}
            </option>
          ))}
        </Select>
      </Campo>
      {esSuper && rol !== "super_admin" && (
        <Campo label="Organización" htmlFor="organization_id">
          <Select id="organization_id" name="organization_id" value={org} onChange={(e) => setOrg(e.target.value)}>
            {organizaciones.map((o) => (
              <option key={o.id} value={o.id}>
                {o.razon_social}
              </option>
            ))}
          </Select>
        </Campo>
      )}
      {rol === "cliente" && (
        <Campo label="Empresa cliente" htmlFor="cliente_id">
          <Select id="cliente_id" name="cliente_id" required defaultValue="">
            <option value="" disabled>
              Elige la empresa…
            </option>
            {clientesDeOrg.map((c) => (
              <option key={c.id} value={c.id}>
                {c.razon_social}
              </option>
            ))}
          </Select>
        </Campo>
      )}
      <MensajeForm estado={estado} />
      <Button type="submit" disabled={enviando}>
        {enviando ? "Creando…" : "Crear usuario"}
      </Button>
    </form>
  );
}
