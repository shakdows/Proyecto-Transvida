import { OPCIONES, type Opcion } from "@/lib/catalogos";
import type { Permiso } from "@/lib/permisos";

/**
 * Definición de cada maestro: sus campos (para pintar el formulario y validar
 * en el servidor), la tabla y el permiso que se necesita para editarlo.
 */
export type TipoCampo = "texto" | "numero" | "fecha" | "select" | "email" | "textarea" | "checkbox" | "oculto";

export type Campo = {
  name: string;
  label: string;
  tipo: TipoCampo;
  requerido?: boolean;
  opciones?: Opcion[];
  /** Opciones que llegan desde la base de datos (clientes, tipos, usuarios…) */
  opcionesDinamicas?: "clientes" | "tiposUnidad" | "tiposResiduo" | "usuariosChofer";
  validar?: "ruc" | "dni" | "placa";
  mayusculas?: boolean;
  placeholder?: string;
  ayuda?: string;
  soloEdicion?: boolean;
  min?: number;
};

export type Maestro = {
  tabla: TablaMaestro;
  singular: string;
  articulo: "el" | "la";
  permiso: Permiso;
  /** Ruta donde vuelve después de guardar/eliminar */
  ruta: (fila: Record<string, unknown>) => string;
  campos: Campo[];
};

export const TABLAS_MAESTRO = [
  "clientes",
  "sedes",
  "tipos_residuo",
  "tipos_unidad",
  "unidades",
  "documentos_unidad",
  "choferes",
  "capacitaciones",
  "destinos",
  "tarifas",
] as const;
export type TablaMaestro = (typeof TABLAS_MAESTRO)[number];

const activo: Campo = { name: "activo", label: "Activo", tipo: "checkbox", soloEdicion: true };

export const MAESTROS: Record<TablaMaestro, Maestro> = {
  clientes: {
    tabla: "clientes",
    singular: "cliente",
    articulo: "el",
    permiso: "clientes.editar",
    ruta: (f) => (f.id ? `/maestros/clientes/${f.id}` : "/maestros/clientes"),
    campos: [
      { name: "razon_social", label: "Razón social", tipo: "texto", requerido: true },
      { name: "ruc", label: "RUC", tipo: "texto", requerido: true, validar: "ruc", placeholder: "11 dígitos" },
      { name: "rubro", label: "Rubro", tipo: "texto", placeholder: "Ej. Manufactura" },
      { name: "direccion_fiscal", label: "Dirección fiscal", tipo: "texto" },
      { name: "contacto_nombre", label: "Contacto", tipo: "texto" },
      { name: "contacto_email", label: "Correo de contacto", tipo: "email" },
      { name: "contacto_telefono", label: "Teléfono de contacto", tipo: "texto" },
      activo,
    ],
  },
  sedes: {
    tabla: "sedes",
    singular: "sede",
    articulo: "la",
    permiso: "sedes.editar",
    ruta: (f) => `/maestros/clientes/${f.cliente_id}`,
    campos: [
      { name: "cliente_id", label: "Cliente", tipo: "oculto", requerido: true },
      { name: "nombre", label: "Nombre de la sede", tipo: "texto", requerido: true, placeholder: "Ej. Planta Ate" },
      { name: "direccion", label: "Dirección", tipo: "texto", requerido: true },
      { name: "distrito", label: "Distrito", tipo: "texto" },
      { name: "provincia", label: "Provincia", tipo: "texto" },
      { name: "departamento", label: "Departamento", tipo: "texto" },
      { name: "horario_recojo", label: "Horario de recojo", tipo: "texto", placeholder: "Ej. Lun-Vie 08:00-12:00" },
      { name: "contacto_nombre", label: "Contacto en sede", tipo: "texto" },
      { name: "contacto_telefono", label: "Teléfono en sede", tipo: "texto" },
      { name: "latitud", label: "Latitud", tipo: "numero", placeholder: "-12.0464", ayuda: "Opcional (Google Maps)" },
      { name: "longitud", label: "Longitud", tipo: "numero", placeholder: "-77.0428", ayuda: "Opcional (Google Maps)" },
      activo,
    ],
  },
  tipos_residuo: {
    tabla: "tipos_residuo",
    singular: "tipo de residuo",
    articulo: "el",
    permiso: "tipos_residuo.editar",
    ruta: () => "/maestros/tipos-residuo",
    campos: [
      { name: "codigo", label: "Código", tipo: "texto", requerido: true, mayusculas: true, placeholder: "Ej. PAP" },
      { name: "nombre", label: "Nombre", tipo: "texto", requerido: true },
      { name: "clase", label: "Clase", tipo: "select", requerido: true, opciones: OPCIONES.clase },
      activo,
    ],
  },
  tipos_unidad: {
    tabla: "tipos_unidad",
    singular: "tipo de unidad",
    articulo: "el",
    permiso: "unidades.editar",
    ruta: () => "/maestros/tipos-unidad",
    campos: [{ name: "nombre", label: "Nombre", tipo: "texto", requerido: true, placeholder: "Ej. Compactador" }],
  },
  unidades: {
    tabla: "unidades",
    singular: "unidad",
    articulo: "la",
    permiso: "unidades.editar",
    ruta: (f) => (f.id ? `/maestros/unidades/${f.id}` : "/maestros/unidades"),
    campos: [
      { name: "placa", label: "Placa", tipo: "texto", requerido: true, validar: "placa", mayusculas: true, placeholder: "ABC-123" },
      { name: "tipo_unidad_id", label: "Tipo de unidad", tipo: "select", requerido: true, opcionesDinamicas: "tiposUnidad" },
      { name: "capacidad_kg", label: "Capacidad (kg)", tipo: "numero", requerido: true, min: 1 },
      { name: "estado", label: "Estado", tipo: "select", requerido: true, opciones: OPCIONES.estadoUnidad },
      { name: "marca", label: "Marca", tipo: "texto" },
      { name: "modelo", label: "Modelo", tipo: "texto" },
      { name: "anio", label: "Año", tipo: "numero", min: 1950 },
      { name: "observaciones", label: "Observaciones", tipo: "textarea" },
    ],
  },
  documentos_unidad: {
    tabla: "documentos_unidad",
    singular: "documento",
    articulo: "el",
    permiso: "unidades.editar",
    ruta: (f) => `/maestros/unidades/${f.unidad_id}`,
    campos: [
      { name: "unidad_id", label: "Unidad", tipo: "oculto", requerido: true },
      { name: "tipo", label: "Documento", tipo: "select", requerido: true, opciones: OPCIONES.tipoDocumento },
      { name: "numero", label: "Número", tipo: "texto" },
      { name: "fecha_emision", label: "Fecha de emisión", tipo: "fecha" },
      { name: "fecha_vencimiento", label: "Fecha de vencimiento", tipo: "fecha", requerido: true },
      { name: "archivo_path", label: "Archivo", tipo: "oculto" },
    ],
  },
  choferes: {
    tabla: "choferes",
    singular: "chofer",
    articulo: "el",
    permiso: "choferes.editar",
    ruta: (f) => (f.id ? `/maestros/choferes/${f.id}` : "/maestros/choferes"),
    campos: [
      { name: "nombres", label: "Nombres", tipo: "texto", requerido: true },
      { name: "apellidos", label: "Apellidos", tipo: "texto", requerido: true },
      { name: "dni", label: "DNI", tipo: "texto", requerido: true, validar: "dni", placeholder: "8 dígitos" },
      { name: "telefono", label: "Teléfono", tipo: "texto" },
      { name: "licencia_numero", label: "N.º de licencia", tipo: "texto", requerido: true, mayusculas: true },
      { name: "licencia_categoria", label: "Categoría", tipo: "select", requerido: true, opciones: OPCIONES.categoriaLicencia },
      { name: "licencia_vencimiento", label: "Vencimiento de licencia", tipo: "fecha", requerido: true },
      {
        name: "profile_id",
        label: "Usuario del sistema",
        tipo: "select",
        opcionesDinamicas: "usuariosChofer",
        ayuda: "Opcional: vincula al usuario con rol Chofer para la app móvil (Fase 4)",
      },
      activo,
    ],
  },
  capacitaciones: {
    tabla: "capacitaciones",
    singular: "capacitación",
    articulo: "la",
    permiso: "choferes.editar",
    ruta: (f) => `/maestros/choferes/${f.chofer_id}`,
    campos: [
      { name: "chofer_id", label: "Chofer", tipo: "oculto", requerido: true },
      { name: "nombre", label: "Capacitación", tipo: "texto", requerido: true },
      { name: "fecha", label: "Fecha", tipo: "fecha", requerido: true },
      { name: "vencimiento", label: "Vence", tipo: "fecha" },
    ],
  },
  destinos: {
    tabla: "destinos",
    singular: "destino",
    articulo: "el",
    permiso: "destinos.editar",
    ruta: () => "/maestros/destinos",
    campos: [
      { name: "nombre", label: "Nombre", tipo: "texto", requerido: true },
      { name: "tipo", label: "Tipo", tipo: "select", requerido: true, opciones: OPCIONES.tipoDestino },
      { name: "autorizacion", label: "N.º de autorización", tipo: "texto" },
      { name: "direccion", label: "Dirección", tipo: "texto" },
      activo,
    ],
  },
  tarifas: {
    tabla: "tarifas",
    singular: "tarifa",
    articulo: "la",
    permiso: "tarifas.editar",
    ruta: () => "/maestros/tarifas",
    campos: [
      { name: "cliente_id", label: "Cliente", tipo: "select", requerido: true, opcionesDinamicas: "clientes" },
      { name: "tipo_residuo_id", label: "Tipo de residuo", tipo: "select", requerido: true, opcionesDinamicas: "tiposResiduo" },
      { name: "modalidad", label: "Modalidad", tipo: "select", requerido: true, opciones: OPCIONES.modalidad },
      { name: "precio_con_igv", label: "Precio S/ (incluye IGV)", tipo: "numero", requerido: true, min: 0 },
      { name: "vigente_desde", label: "Vigente desde", tipo: "fecha", requerido: true },
      { name: "vigente_hasta", label: "Vigente hasta", tipo: "fecha", ayuda: "Vacío = sin fecha de fin" },
      { name: "observaciones", label: "Observaciones", tipo: "textarea" },
    ],
  },
};

/** Rutas de la sección Maestros (pestañas) */
export const SECCIONES_MAESTROS = [
  { href: "/maestros/clientes", label: "Clientes" },
  { href: "/maestros/tipos-residuo", label: "Tipos de residuo" },
  { href: "/maestros/unidades", label: "Unidades" },
  { href: "/maestros/tipos-unidad", label: "Tipos de unidad" },
  { href: "/maestros/choferes", label: "Choferes" },
  { href: "/maestros/destinos", label: "Destinos" },
  { href: "/maestros/tarifas", label: "Tarifas", soloComercial: true },
] as const;
