"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { getPermisos, requireRol } from "@/lib/auth";
import { ESTADO_UNIDAD } from "@/lib/catalogos";
import { COLUMNAS, normalizar, textoCelda, type TipoImportacion } from "@/lib/excel";
import { createClient } from "@/lib/supabase/server";
import { rucValido } from "@/lib/utils";

export type ResultadoImportacion = {
  error?: string;
  creados?: number;
  errores?: { fila: number; mensaje: string }[];
};

const MAX_FILAS = 500;

export async function importarExcel(
  tipo: TipoImportacion,
  _prev: ResultadoImportacion,
  f: FormData,
): Promise<ResultadoImportacion> {
  const { perfil } = await requireRol(["admin", "operaciones", "chofer", "planta", "facturacion"]);
  const permisos = await getPermisos();
  if (!permisos[tipo === "clientes" ? "clientes.editar" : "unidades.editar"]) {
    return { error: "No tienes permiso para cargar este maestro." };
  }

  const archivo = f.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) return { error: "Elige un archivo Excel (.xlsx)." };
  if (!archivo.name.toLowerCase().endsWith(".xlsx")) return { error: "El archivo debe ser .xlsx (Excel)." };

  const libro = new ExcelJS.Workbook();
  try {
    await libro.xlsx.load(await archivo.arrayBuffer());
  } catch {
    return { error: "No se pudo leer el archivo. Usa la plantilla descargable." };
  }
  const hoja = libro.worksheets[0];
  if (!hoja) return { error: "El archivo no tiene hojas." };

  // Ubicar columnas por su encabezado (fila 1)
  const columnas = COLUMNAS[tipo];
  const indice: Record<string, number> = {};
  hoja.getRow(1).eachCell((celda, col) => {
    const h = normalizar(textoCelda(celda));
    const c = columnas.find((x) => normalizar(x.header) === h || normalizar(x.key) === h);
    if (c) indice[c.key] = col;
  });
  const faltan = columnas.filter((c) => c.header.endsWith("*") && !indice[c.key]);
  if (faltan.length) {
    return { error: `Faltan columnas obligatorias: ${faltan.map((c) => c.header.replace("*", "")).join(", ")}.` };
  }

  const filas: { numero: number; valores: Record<string, string> }[] = [];
  hoja.eachRow((row, numero) => {
    if (numero === 1) return;
    const valores: Record<string, string> = {};
    for (const [key, col] of Object.entries(indice)) valores[key] = textoCelda(row.getCell(col));
    if (Object.values(valores).some((v) => v !== "")) filas.push({ numero, valores });
  });
  if (filas.length === 0) return { error: "La hoja no tiene filas con datos." };
  if (filas.length > MAX_FILAS) return { error: `Máximo ${MAX_FILAS} filas por carga.` };

  const supabase = await createClient();
  const org = perfil.organization_id!;
  const errores: { fila: number; mensaje: string }[] = [];
  let creados = 0;

  let tiposUnidad = new Map<string, string>();
  if (tipo === "unidades") {
    const { data } = await supabase.from("tipos_unidad").select("id, nombre");
    tiposUnidad = new Map((data ?? []).map((t) => [normalizar(t.nombre), t.id]));
  }
  const estados = new Map(Object.entries(ESTADO_UNIDAD).map(([k, v]) => [normalizar(v), k]));
  Object.keys(ESTADO_UNIDAD).forEach((k) => estados.set(normalizar(k), k));

  for (const { numero, valores: v } of filas) {
    let registro: Record<string, unknown>;

    if (tipo === "clientes") {
      if (!v.razon_social) { errores.push({ fila: numero, mensaje: "Falta la razón social." }); continue; }
      const ruc = v.ruc.replace(/\D/g, "");
      if (!rucValido(ruc)) { errores.push({ fila: numero, mensaje: `RUC no válido: "${v.ruc}".` }); continue; }
      const email = v.contacto_email?.toLowerCase() || null;
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        errores.push({ fila: numero, mensaje: `Correo no válido: "${email}".` });
        continue;
      }
      registro = {
        organization_id: org,
        razon_social: v.razon_social,
        ruc,
        rubro: v.rubro || null,
        direccion_fiscal: v.direccion_fiscal || null,
        contacto_nombre: v.contacto_nombre || null,
        contacto_email: email,
        contacto_telefono: v.contacto_telefono || null,
      };
    } else {
      const placa = v.placa.toUpperCase().replace(/\s/g, "");
      if (!/^[A-Z0-9]{2,4}-?[A-Z0-9]{2,4}$/.test(placa)) {
        errores.push({ fila: numero, mensaje: `Placa no válida: "${v.placa}".` });
        continue;
      }
      const tipoId = tiposUnidad.get(normalizar(v.tipo_unidad));
      if (!tipoId) {
        errores.push({ fila: numero, mensaje: `Tipo de unidad "${v.tipo_unidad}" no existe. Créalo primero en Tipos de unidad.` });
        continue;
      }
      const capacidad = Number(v.capacidad_kg.replace(",", "."));
      if (!Number.isFinite(capacidad) || capacidad <= 0) {
        errores.push({ fila: numero, mensaje: `Capacidad no válida: "${v.capacidad_kg}".` });
        continue;
      }
      const estado = v.estado ? estados.get(normalizar(v.estado)) : "operativa";
      if (!estado) { errores.push({ fila: numero, mensaje: `Estado no válido: "${v.estado}".` }); continue; }
      const anio = v.anio ? Number(v.anio) : null;
      if (anio !== null && (!Number.isInteger(anio) || anio < 1950 || anio > 2100)) {
        errores.push({ fila: numero, mensaje: `Año no válido: "${v.anio}".` });
        continue;
      }
      registro = {
        organization_id: org,
        placa,
        tipo_unidad_id: tipoId,
        capacidad_kg: capacidad,
        estado,
        marca: v.marca || null,
        modelo: v.modelo || null,
        anio,
      };
    }

    const { error } = await supabase.from(tipo).insert(registro);
    if (error) {
      errores.push({
        fila: numero,
        mensaje: error.code === "23505" ? "Ya existe (RUC o placa repetida)." : error.message,
      });
    } else {
      creados++;
    }
  }

  revalidatePath("/maestros", "layout");
  return { creados, errores };
}
