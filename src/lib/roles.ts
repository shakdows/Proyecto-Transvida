export const ROLES = [
  "super_admin",
  "admin",
  "operaciones",
  "chofer",
  "planta",
  "facturacion",
  "cliente",
] as const;

export type Rol = (typeof ROLES)[number];

export const ROL_LABEL: Record<Rol, string> = {
  super_admin: "Super administrador",
  admin: "Administrador",
  operaciones: "Operaciones",
  chofer: "Chofer",
  planta: "Planta",
  facturacion: "Facturación",
  cliente: "Cliente",
};

export type IconoMenu =
  | "inicio"
  | "organizaciones"
  | "usuarios"
  | "configuracion"
  | "clientes"
  | "empresa"
  | "maestros"
  | "programacion"
  | "recojos"
  | "pesaje"
  | "portal"
  | "flota"
  | "valorizacion"
  | "facturacion"
  | "analitica";

export type ItemMenu = {
  label: string;
  href: string;
  icono: IconoMenu;
  roles: Rol[];
  /** Si tiene fase, el módulo aún no está construido y se muestra deshabilitado */
  fase?: number;
};

/** Menú lateral: cada rol ve solo sus opciones. */
export const MENU: ItemMenu[] = [
  { label: "Inicio", href: "/inicio", icono: "inicio", roles: [...ROLES] },
  { label: "Organizaciones", href: "/organizaciones", icono: "organizaciones", roles: ["super_admin"] },
  { label: "Usuarios", href: "/usuarios", icono: "usuarios", roles: ["super_admin", "admin"] },
  { label: "Maestros", href: "/maestros", icono: "maestros", roles: ["admin", "operaciones", "facturacion", "planta"] },
  { label: "Mi empresa", href: "/empresa", icono: "empresa", roles: ["cliente"] },
  { label: "Configuración", href: "/configuracion", icono: "configuracion", roles: ["admin"] },
  // Módulos de fases siguientes
  { label: "Programación", href: "/programacion", icono: "programacion", roles: ["admin", "operaciones"], fase: 3 },
  { label: "Mis recojos de hoy", href: "/mis-recojos", icono: "recojos", roles: ["chofer"], fase: 4 },
  { label: "Pesaje y cierre", href: "/pesaje", icono: "pesaje", roles: ["planta"], fase: 5 },
  { label: "Mis servicios y reportes", href: "/portal", icono: "portal", roles: ["cliente"], fase: 6 },
  { label: "Flota y cumplimiento", href: "/flota", icono: "flota", roles: ["admin", "operaciones"], fase: 7 },
  { label: "Valorización", href: "/valorizacion", icono: "valorizacion", roles: ["admin", "planta"], fase: 8 },
  { label: "Pre-facturación", href: "/prefacturacion", icono: "facturacion", roles: ["admin", "facturacion"], fase: 9 },
  { label: "Analítica", href: "/analitica", icono: "analitica", roles: ["admin"], fase: 10 },
];

export function menuPara(rol: Rol) {
  return MENU.filter((item) => item.roles.includes(rol));
}
