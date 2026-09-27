import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import type { Opcion } from "@/lib/catalogos";
import { cn, diasHasta, estadoVencimiento, formatFecha } from "@/lib/utils";

/** Fecha con semáforo: vencido (rojo), vence en 30 días o menos (ámbar), vigente (verde) */
export function Vencimiento({ fecha }: { fecha: string | null | undefined }) {
  const estado = estadoVencimiento(fecha);
  if (!estado || !fecha) return <span className="text-muted-foreground">—</span>;
  const d = diasHasta(fecha);
  const estilos = {
    vencido: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    por_vencer: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    vigente: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  }[estado];
  const texto = estado === "vencido" ? `Vencido hace ${-d} d` : estado === "por_vencer" ? `Vence en ${d} d` : "Vigente";
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span>{formatFecha(fecha)}</span>
      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", estilos)}>{texto}</span>
    </span>
  );
}

export function EstadoActivo({ activo }: { activo: boolean }) {
  return activo ? <Badge>Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>;
}

/** Buscador y filtros por URL (funciona sin JavaScript) */
export function Filtros({
  q,
  placeholder,
  filtros = [],
  limpiarHref,
  sinBusqueda = false,
}: {
  q?: string;
  placeholder?: string;
  sinBusqueda?: boolean;
  filtros?: { name: string; label: string; valor?: string; opciones: Opcion[] }[];
  limpiarHref: string;
}) {
  const hayFiltros = Boolean(q) || filtros.some((f) => f.valor);
  return (
    <form method="get" className="mb-4 flex flex-wrap items-center gap-2">
      {!sinBusqueda && (
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder={placeholder} className="pl-8" />
        </div>
      )}
      {filtros.map((f) => (
        <Select key={f.name} name={f.name} defaultValue={f.valor ?? ""} aria-label={f.label} className="w-auto min-w-40">
          <option value="">{f.label}: todos</option>
          {f.opciones.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      ))}
      <Button type="submit" variant="secondary">
        Buscar
      </Button>
      {hayFiltros && (
        <Button asChild variant="ghost">
          <Link href={limpiarHref}>Limpiar</Link>
        </Button>
      )}
    </form>
  );
}

/** Texto de búsqueda seguro para filtros ilike de PostgREST */
export function patronBusqueda(q: string | undefined) {
  const limpio = (q ?? "").replace(/[%_,()*\\]/g, " ").trim();
  return limpio ? `%${limpio}%` : null;
}

export function SinPermiso() {
  return <p className="text-sm text-muted-foreground">Solo lectura: tu rol no tiene permiso para editar esta sección.</p>;
}
