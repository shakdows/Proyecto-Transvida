import {
  BarChart3,
  Briefcase,
  Building,
  Building2,
  CalendarDays,
  Database,
  FileText,
  Home,
  Receipt,
  Recycle,
  Scale,
  Settings,
  Truck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { IconoMenu } from "@/lib/roles";

const ICONOS: Record<IconoMenu, LucideIcon> = {
  inicio: Home,
  organizaciones: Building2,
  usuarios: Users,
  configuracion: Settings,
  clientes: Briefcase,
  empresa: Building,
  maestros: Database,
  programacion: CalendarDays,
  recojos: Truck,
  pesaje: Scale,
  portal: FileText,
  flota: Wrench,
  valorizacion: Recycle,
  facturacion: Receipt,
  analitica: BarChart3,
};

export function IconoMenuItem({ icono, className }: { icono: IconoMenu; className?: string }) {
  const Icono = ICONOS[icono];
  return <Icono className={className} />;
}
