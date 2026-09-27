"use client";

import { useActionState } from "react";
import { guardarPermisos, type EstadoForm } from "@/app/actions/maestros";
import { MensajeForm } from "@/components/form-estado";
import { Button } from "@/components/ui/button";
import { PERMISOS, ROLES_CONFIGURABLES } from "@/lib/permisos";
import { ROL_LABEL } from "@/lib/roles";

export function PermisosForm({ actuales }: { actuales: Record<string, boolean> }) {
  const [estado, accion, enviando] = useActionState<EstadoForm, FormData>(guardarPermisos, {});
  return (
    <form action={accion} className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 pr-3 text-left font-semibold">Acción</th>
              <th className="px-2 py-2 text-center font-semibold text-muted-foreground">Administrador</th>
              {ROLES_CONFIGURABLES.map((r) => (
                <th key={r} className="px-2 py-2 text-center font-semibold">{ROL_LABEL[r]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISOS.map((p) => (
              <tr key={p.clave} className="border-b last:border-0 hover:bg-muted/40">
                <td className="py-2 pr-3">{p.label}</td>
                <td className="px-2 py-2 text-center">
                  <input type="checkbox" checked disabled aria-label="Administrador siempre" className="size-4" />
                </td>
                {ROLES_CONFIGURABLES.map((r) => (
                  <td key={r} className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      name={`${r}:${p.clave}`}
                      defaultChecked={actuales[`${r}:${p.clave}`] ?? false}
                      aria-label={`${ROL_LABEL[r]}: ${p.label}`}
                      className="size-4 accent-[var(--brand)]"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        El administrador siempre tiene todos los permisos. Consultar maestros está permitido para todo el personal de la EO-RS;
        las tarifas solo las ven Administrador, Operaciones y Facturación (o quien tenga permiso de editarlas). Las próximas fases
        agregarán aquí nuevas acciones (por ejemplo, asignar unidad y chofer a un recojo).
      </p>
      <MensajeForm estado={estado} />
      <Button type="submit" disabled={enviando} className="self-start">
        {enviando ? "Guardando…" : "Guardar permisos"}
      </Button>
    </form>
  );
}
