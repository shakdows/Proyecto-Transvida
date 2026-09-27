export type Opcion = { value: string; label: string };

const opciones = (o: Record<string, string>): Opcion[] =>
  Object.entries(o).map(([value, label]) => ({ value, label }));

export const CLASE_RESIDUO: Record<string, string> = {
  aprovechable: "Aprovechable",
  no_peligroso: "No peligroso",
  peligroso: "Peligroso",
};

export const ESTADO_UNIDAD: Record<string, string> = {
  operativa: "Operativa",
  mantenimiento: "En mantenimiento",
  inactiva: "Inactiva",
};

export const TIPO_DOCUMENTO_UNIDAD: Record<string, string> = {
  soat: "SOAT",
  revision_tecnica: "Revisión técnica",
  habilitacion: "Habilitación",
  poliza: "Póliza de seguro",
  otro: "Otro",
};

export const CATEGORIA_LICENCIA = ["A-I", "A-IIa", "A-IIb", "A-IIIa", "A-IIIb", "A-IIIc"];

export const TIPO_DESTINO: Record<string, string> = {
  relleno_seguridad: "Relleno de seguridad",
  planta_valorizacion: "Planta de valorización",
  otro: "Otro",
};

export const MODALIDAD_TARIFA: Record<string, string> = {
  por_servicio: "Por servicio",
  por_kg: "Por kg",
  por_viaje: "Por viaje",
};

export const OPCIONES = {
  clase: opciones(CLASE_RESIDUO),
  estadoUnidad: opciones(ESTADO_UNIDAD),
  tipoDocumento: opciones(TIPO_DOCUMENTO_UNIDAD),
  categoriaLicencia: CATEGORIA_LICENCIA.map((c) => ({ value: c, label: c })),
  tipoDestino: opciones(TIPO_DESTINO),
  modalidad: opciones(MODALIDAD_TARIFA),
};
