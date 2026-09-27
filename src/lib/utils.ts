import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ZONA = "America/Lima";

/** Fecha en formato dd/mm/aaaa, hora de Lima */
export function formatFecha(valor: string | Date | null | undefined) {
  if (!valor) return "—";
  // Fechas sin hora (aaaa-mm-dd) se muestran tal cual, sin conversión de zona horaria
  if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [a, m, d] = valor.split("-");
    return `${d}/${m}/${a}`;
  }
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: ZONA,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(valor));
}

/** Valida un RUC peruano (11 dígitos + dígito verificador) */
export function rucValido(ruc: string) {
  if (!/^(10|15|16|17|20)\d{9}$/.test(ruc)) return false;
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const suma = pesos.reduce((acc, p, i) => acc + p * Number(ruc[i]), 0);
  let dv = 11 - (suma % 11);
  if (dv === 10) dv = 0;
  if (dv === 11) dv = 1;
  return dv === Number(ruc[10]);
}

/** Iniciales para avatares/logos sin imagen */
export function iniciales(texto: string) {
  return texto
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/** Fecha de hoy en Lima como aaaa-mm-dd */
export function hoyLima() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(new Date());
}

/** Días que faltan (negativo si ya pasó) hasta una fecha aaaa-mm-dd, según Lima */
export function diasHasta(fecha: string) {
  const ms = Date.parse(fecha + "T00:00:00Z") - Date.parse(hoyLima() + "T00:00:00Z");
  return Math.round(ms / 86_400_000);
}

export type EstadoVencimiento = "vencido" | "por_vencer" | "vigente";

/** Vencido, por vencer (30 días o menos) o vigente */
export function estadoVencimiento(fecha: string | null | undefined): EstadoVencimiento | null {
  if (!fecha) return null;
  const d = diasHasta(fecha);
  if (d < 0) return "vencido";
  if (d <= 30) return "por_vencer";
  return "vigente";
}

/** Soles: S/ 1,234.50 */
export function formatSoles(n: number | string | null | undefined) {
  if (n === null || n === undefined || n === "") return "—";
  return "S/ " + new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n));
}

/** Kilogramos: 1,234.5 kg */
export function formatKg(n: number | string | null | undefined) {
  if (n === null || n === undefined || n === "") return "—";
  return new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 }).format(Number(n)) + " kg";
}
