import type { Cell, CellValue } from "exceljs";

export type TipoImportacion = "clientes" | "unidades";

export type ColumnaExcel = { key: string; header: string; ejemplo: string | number; ancho: number };

/** Columnas de las plantillas de carga masiva (el * indica obligatorio) */
export const COLUMNAS: Record<TipoImportacion, ColumnaExcel[]> = {
  clientes: [
    { key: "razon_social", header: "Razón social*", ejemplo: "Empresa Ejemplo S.A.C.", ancho: 34 },
    { key: "ruc", header: "RUC*", ejemplo: "20601234565", ancho: 14 },
    { key: "rubro", header: "Rubro", ejemplo: "Manufactura", ancho: 16 },
    { key: "direccion_fiscal", header: "Dirección fiscal", ejemplo: "Av. Principal 123, Lima", ancho: 30 },
    { key: "contacto_nombre", header: "Contacto", ejemplo: "Nombre Apellido", ancho: 22 },
    { key: "contacto_email", header: "Correo de contacto", ejemplo: "contacto@empresa.com", ancho: 26 },
    { key: "contacto_telefono", header: "Teléfono de contacto", ejemplo: "987654321", ancho: 18 },
  ],
  unidades: [
    { key: "placa", header: "Placa*", ejemplo: "ABC-123", ancho: 12 },
    { key: "tipo_unidad", header: "Tipo de unidad*", ejemplo: "Compactador", ancho: 18 },
    { key: "capacidad_kg", header: "Capacidad (kg)*", ejemplo: 8000, ancho: 16 },
    { key: "estado", header: "Estado", ejemplo: "Operativa", ancho: 16 },
    { key: "marca", header: "Marca", ejemplo: "Volvo", ancho: 14 },
    { key: "modelo", header: "Modelo", ejemplo: "FL", ancho: 14 },
    { key: "anio", header: "Año", ejemplo: 2020, ancho: 8 },
  ],
};

/** Normaliza un encabezado: minúsculas, sin tildes, sin símbolos */
export function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Texto de una celda de Excel, sea número, texto enriquecido, fórmula o enlace */
export function textoCelda(celda: Cell | undefined): string {
  if (!celda) return "";
  const v: CellValue = celda.value;
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((t) => t.text).join("").trim();
    if ("text" in v) return String(v.text).trim();
    if ("result" in v && v.result !== undefined) return String(v.result).trim();
  }
  return String(celda.text ?? "").trim();
}
