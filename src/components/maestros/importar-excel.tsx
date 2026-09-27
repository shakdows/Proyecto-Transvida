"use client";

import { useActionState } from "react";
import { Download, Upload } from "lucide-react";
import { importarExcel, type ResultadoImportacion } from "@/app/actions/importar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TipoImportacion } from "@/lib/excel";

export function ImportarExcel({ tipo }: { tipo: TipoImportacion }) {
  const [res, accion, enviando] = useActionState<ResultadoImportacion, FormData>(importarExcel.bind(null, tipo), {});

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Descarga la plantilla, llénala y súbela. Se cargan las filas correctas y se listan las que tengan errores.
      </p>
      <Button asChild variant="outline" size="sm" className="self-start">
        <a href={`/maestros/plantilla/${tipo}`}>
          <Download />
          Descargar plantilla
        </a>
      </Button>
      <form action={accion} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input name="archivo" type="file" accept=".xlsx" required className="py-1.5" />
        <Button type="submit" size="sm" disabled={enviando}>
          <Upload />
          {enviando ? "Cargando…" : "Cargar"}
        </Button>
      </form>
      {res.error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{res.error}</p>}
      {res.creados !== undefined && (
        <div role="status" className="rounded-md bg-muted px-3 py-2 text-sm">
          <p className="font-medium">
            {res.creados} registro(s) creados · {res.errores?.length ?? 0} con errores
          </p>
          {res.errores && res.errores.length > 0 && (
            <ul className="mt-2 max-h-48 list-disc overflow-y-auto pl-5 text-xs text-destructive">
              {res.errores.map((e) => (
                <li key={e.fila}>
                  Fila {e.fila}: {e.mensaje}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
