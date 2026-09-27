import ExcelJS from "exceljs";
import { getSesion } from "@/lib/auth";
import { ESTADO_UNIDAD } from "@/lib/catalogos";
import { COLUMNAS, type TipoImportacion } from "@/lib/excel";
import { createClient } from "@/lib/supabase/server";

/** Descarga la plantilla de Excel para la carga masiva de clientes o unidades */
export async function GET(_req: Request, { params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  if (tipo !== "clientes" && tipo !== "unidades") return new Response("No encontrado", { status: 404 });
  const sesion = await getSesion();
  if (!sesion || sesion.sinPerfil || sesion.perfil.rol === "cliente") return new Response("Sin acceso", { status: 403 });

  const columnas = COLUMNAS[tipo as TipoImportacion];
  const libro = new ExcelJS.Workbook();
  libro.creator = "ResiduIQ";

  const hoja = libro.addWorksheet(tipo === "clientes" ? "Clientes" : "Unidades");
  hoja.columns = columnas.map((c) => ({ header: c.header, key: c.key, width: c.ancho }));
  hoja.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  hoja.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
  hoja.addRow(Object.fromEntries(columnas.map((c) => [c.key, c.ejemplo])));
  hoja.getColumn("ruc").numFmt = "@";
  hoja.views = [{ state: "frozen", ySplit: 1 }];

  const ayuda = libro.addWorksheet("Instrucciones");
  ayuda.getColumn(1).width = 100;
  const lineas = [
    "Instrucciones",
    "1. Llena una fila por registro en la primera hoja. No cambies los títulos de la fila 1.",
    "2. Las columnas con * son obligatorias. Borra la fila de ejemplo antes de cargar.",
    "3. Guarda como .xlsx y súbelo en ResiduIQ con el botón «Cargar desde Excel».",
  ];
  if (tipo === "clientes") {
    lineas.push("4. RUC: 11 dígitos. Se valida el dígito verificador.");
  } else {
    const supabase = await createClient();
    const { data } = await supabase.from("tipos_unidad").select("nombre").order("nombre");
    lineas.push(
      "4. Placa: formato ABC-123. Capacidad siempre en kilogramos (kg).",
      `5. Tipos de unidad válidos: ${(data ?? []).map((t) => t.nombre).join(", ")}.`,
      `6. Estado (opcional, por defecto Operativa): ${Object.values(ESTADO_UNIDAD).join(", ")}.`,
    );
  }
  lineas.forEach((l, i) => {
    const fila = ayuda.addRow([l]);
    if (i === 0) fila.font = { bold: true, size: 14 };
  });

  const buffer = await libro.xlsx.writeBuffer();
  return new Response(buffer as ArrayBuffer, {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="plantilla-${tipo}.xlsx"`,
      "cache-control": "no-store",
    },
  });
}
