"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { guardarMaestro, type EstadoForm } from "@/app/actions/maestros";
import { Campo, MensajeForm } from "@/components/form-estado";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import type { Opcion } from "@/lib/catalogos";
import { MAESTROS, type TablaMaestro } from "@/lib/maestros";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Props = {
  tabla: TablaMaestro;
  id?: string | null;
  valores?: Record<string, unknown>;
  opciones?: Partial<Record<string, Opcion[]>>;
  /** Valores fijos de campos ocultos (ej. cliente_id de una sede) */
  fijos?: Record<string, string>;
  /** Permite adjuntar un archivo (se sube directo a Storage en esta carpeta) */
  carpetaArchivo?: string;
  textoBoton?: string;
  columnas?: 1 | 2 | 3;
};

export function FormularioMaestro({ tabla, id = null, valores = {}, opciones = {}, fijos = {}, carpetaArchivo, textoBoton, columnas = 2 }: Props) {
  const maestro = MAESTROS[tabla];
  const [estado, accion, guardando] = useActionState<EstadoForm, FormData>(guardarMaestro.bind(null, tabla, id), {});
  const [subiendo, setSubiendo] = useState(false);
  const enviando = guardando || subiendo;
  const [errorArchivo, setErrorArchivo] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);

  // Al crear con éxito se limpia el formulario
  useEffect(() => {
    if (estado.ok && !id) formRef.current?.reset();
  }, [estado, id]);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorArchivo(undefined);
    const datos = new FormData(e.currentTarget);
    const archivo = datos.get("archivo");
    datos.delete("archivo");

    if (carpetaArchivo && archivo instanceof File && archivo.size > 0) {
      if (archivo.size > 10 * 1024 * 1024) {
        setErrorArchivo("El archivo supera 10 MB.");
        return;
      }
      setSubiendo(true);
      const nombre = archivo.name.normalize("NFD").replace(/[^\w.-]+/g, "_");
      const ruta = `${carpetaArchivo}/${crypto.randomUUID()}-${nombre}`;
      const { error } = await createClient().storage.from("documentos").upload(ruta, archivo);
      setSubiendo(false);
      if (error) {
        setErrorArchivo("No se pudo subir el archivo: " + error.message);
        return;
      }
      datos.set("archivo_path", ruta);
    }
    startTransition(() => accion(datos));
  }

  const campos = maestro.campos.filter((c) => !(c.soloEdicion && !id));

  return (
    <form ref={formRef} onSubmit={enviar} className="flex flex-col gap-4">
      <div className={cn("grid gap-3", columnas === 2 && "sm:grid-cols-2", columnas === 3 && "sm:grid-cols-2 lg:grid-cols-3")}>
        {campos.map((c) => {
          const valor = valores[c.name];
          const idCampo = `${tabla}-${id ?? "nuevo"}-${c.name}`;
          if (c.tipo === "oculto") {
            const v = fijos[c.name] ?? (valor as string | null) ?? "";
            return <input key={c.name} type="hidden" name={c.name} value={v} readOnly />;
          }
          if (c.tipo === "checkbox") {
            return (
              <label key={c.name} className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
                <input type="checkbox" name={c.name} defaultChecked={valor !== false} className="size-4 accent-[var(--brand)]" />
                {c.label}
              </label>
            );
          }
          const etiqueta = c.label + (c.requerido ? " *" : "");
          let control: React.ReactNode;
          if (c.tipo === "select") {
            const lista = c.opciones ?? opciones[c.opcionesDinamicas ?? ""] ?? [];
            control = (
              <Select id={idCampo} name={c.name} required={c.requerido} defaultValue={(valor as string) ?? ""}>
                <option value="">{c.requerido ? "Elige…" : "— Ninguno —"}</option>
                {lista.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            );
          } else if (c.tipo === "textarea") {
            control = (
              <textarea
                id={idCampo}
                name={c.name}
                defaultValue={(valor as string) ?? ""}
                rows={2}
                className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            );
          } else {
            control = (
              <Input
                id={idCampo}
                name={c.name}
                required={c.requerido}
                placeholder={c.placeholder}
                type={c.tipo === "numero" ? "number" : c.tipo === "fecha" ? "date" : c.tipo === "email" ? "email" : "text"}
                step={c.tipo === "numero" ? "any" : undefined}
                min={c.min}
                defaultValue={valor === null || valor === undefined ? "" : String(valor)}
                className={c.mayusculas ? "uppercase" : undefined}
              />
            );
          }
          return (
            <div key={c.name} className={c.tipo === "textarea" ? "sm:col-span-full" : undefined}>
              <Campo label={etiqueta} htmlFor={idCampo}>
                {control}
              </Campo>
              {c.ayuda && <p className="mt-1 text-xs text-muted-foreground">{c.ayuda}</p>}
            </div>
          );
        })}
        {carpetaArchivo && (
          <div className="sm:col-span-full">
            <Campo label="Archivo (PDF o imagen, máx. 10 MB)" htmlFor={`${tabla}-archivo`}>
              <Input id={`${tabla}-archivo`} name="archivo" type="file" accept="application/pdf,image/*" className="py-1.5" />
            </Campo>
            {typeof valores.archivo_path === "string" && valores.archivo_path && (
              <p className="mt-1 text-xs text-muted-foreground">Ya tiene un archivo; si eliges otro, se reemplaza el enlace.</p>
            )}
          </div>
        )}
      </div>
      <MensajeForm estado={errorArchivo ? { error: errorArchivo } : estado} />
      <Button type="submit" disabled={enviando} className="self-start">
        {enviando ? "Guardando…" : (textoBoton ?? (id ? "Guardar cambios" : `Registrar ${maestro.singular}`))}
      </Button>
    </form>
  );
}
