import type { Rol } from "@/lib/roles";

export const PERMISOS = [
  { clave: "clientes.editar", label: "Crear y editar clientes" },
  { clave: "sedes.editar", label: "Crear y editar sedes de clientes" },
  { clave: "tipos_residuo.editar", label: "Crear y editar tipos de residuo" },
  { clave: "unidades.editar", label: "Crear y editar unidades, sus documentos y tipos de unidad" },
  { clave: "choferes.editar", label: "Crear y editar choferes y capacitaciones" },
  { clave: "destinos.editar", label: "Crear y editar destinos" },
  { clave: "tarifas.editar", label: "Crear y editar tarifas" },
  { clave: "maestros.eliminar", label: "Eliminar registros de maestros (pide la clave de eliminación)" },
] as const;

export type Permiso = (typeof PERMISOS)[number]["clave"];

/** Roles cuyos permisos se configuran en pantalla (ADMIN siempre puede todo) */
export const ROLES_CONFIGURABLES: Rol[] = ["operaciones", "facturacion", "planta", "chofer"];

export type MapaPermisos = Record<Permiso, boolean>;

export function todosLosPermisos(valor: boolean): MapaPermisos {
  return Object.fromEntries(PERMISOS.map((p) => [p.clave, valor])) as MapaPermisos;
}
