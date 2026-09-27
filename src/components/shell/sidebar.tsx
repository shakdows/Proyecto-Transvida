"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { ItemMenu } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { IconoMenuItem } from "./icono";

function Enlaces({ items, onNavegar }: { items: ItemMenu[]; onNavegar?: () => void }) {
  const pathname = usePathname();
  const activos = items.filter((i) => !i.fase);
  const proximos = items.filter((i) => i.fase);

  return (
    <nav className="flex flex-col gap-1 p-3 text-sm">
      {activos.map((item) => {
        const activo = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavegar}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 font-medium transition-colors",
              activo ? "bg-brand/10 text-brand" : "text-foreground/80 hover:bg-accent",
            )}
          >
            <IconoMenuItem icono={item.icono} className="size-4" />
            {item.label}
          </Link>
        );
      })}

      {proximos.length > 0 && (
        <>
          <p className="mt-4 px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Próximamente
          </p>
          {proximos.map((item) => (
            <span
              key={item.href}
              aria-disabled
              title={`Disponible en la Fase ${item.fase}`}
              className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-muted-foreground/70"
            >
              <IconoMenuItem icono={item.icono} className="size-4" />
              <span className="flex-1">{item.label}</span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold">F{item.fase}</span>
            </span>
          ))}
        </>
      )}
    </nav>
  );
}

export function Sidebar({ items, cabecera }: { items: ItemMenu[]; cabecera: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      {/* Escritorio */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r bg-sidebar lg:flex">
        <div className="border-b px-4 py-4">{cabecera}</div>
        <Enlaces items={items} />
      </aside>

      {/* Celular: botón y panel deslizable */}
      <button
        type="button"
        aria-label="Abrir menú"
        onClick={() => setAbierto(true)}
        className="fixed left-3 top-3 z-40 flex size-10 items-center justify-center rounded-md border bg-card lg:hidden"
      >
        <Menu className="size-5" />
      </button>
      {abierto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAbierto(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col overflow-y-auto border-r bg-sidebar">
            <div className="flex items-center justify-between border-b px-4 py-4">
              {cabecera}
              <button type="button" aria-label="Cerrar menú" onClick={() => setAbierto(false)} className="p-2">
                <X className="size-5" />
              </button>
            </div>
            <Enlaces items={items} onNavegar={() => setAbierto(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
