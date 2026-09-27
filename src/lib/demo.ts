/** Usuarios demo (empresas ficticias) para el acceso rápido de la pantalla de login */
export const USUARIOS_DEMO: { email: string; rol: string; detalle: string }[] = [
  { email: "superadmin@residuiq.test", rol: "Super admin", detalle: "Plataforma" },
  { email: "admin@ecoruta.test", rol: "Administrador", detalle: "EcoRuta" },
  { email: "operaciones@ecoruta.test", rol: "Operaciones", detalle: "EcoRuta" },
  { email: "chofer@ecoruta.test", rol: "Chofer", detalle: "EcoRuta" },
  { email: "planta@ecoruta.test", rol: "Planta", detalle: "EcoRuta" },
  { email: "facturacion@ecoruta.test", rol: "Facturación", detalle: "EcoRuta" },
  { email: "cliente@andinas.test", rol: "Cliente", detalle: "Industrias Andinas" },
  { email: "admin@verdecircular.test", rol: "Administrador", detalle: "Verde Circular (otra EO-RS)" },
];

/** Se muestran salvo que la variable de entorno MODO_DEMO sea "false" */
export const modoDemoActivo = () => process.env.MODO_DEMO !== "false";
