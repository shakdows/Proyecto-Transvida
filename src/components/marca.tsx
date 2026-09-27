import { cn, iniciales } from "@/lib/utils";

/** Logo de la organización; si no tiene imagen muestra sus iniciales con el color de marca. */
export function LogoOrganizacion({
  nombre,
  logoUrl,
  className,
}: {
  nombre: string;
  logoUrl?: string | null;
  className?: string;
}) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={nombre} className={cn("size-9 rounded-md object-contain", className)} />;
  }
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-md bg-brand text-sm font-bold text-brand-foreground",
        className,
      )}
    >
      {iniciales(nombre)}
    </span>
  );
}

/** Blanco o casi negro según qué contraste mejor con el color de marca. */
export function textoSobre(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const luminancia = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminancia > 0.45 ? "#0f172a" : "#ffffff";
}
