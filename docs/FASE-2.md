# Fase 2 — Maestros: qué hay y cómo probarlo

## Qué se construyó
- Menú **Maestros** con pestañas: Clientes (con sus sedes), Tipos de residuo, Unidades (con documentos y vencimientos),
  Tipos de unidad, Choferes (con capacitaciones), Destinos y Tarifas.
- Búsqueda y filtros en cada listado. **Carga desde Excel** para clientes y unidades (plantilla descargable, reporte de errores por fila).
- Pesos y capacidades siempre en **kg**. Tarifas en **S/ con IGV incluido**. Fechas dd/mm/aaaa.
- Semáforo de vencimiento en documentos de unidad, licencias y capacitaciones (rojo vencido, ámbar ≤ 30 días, verde vigente).
- PDF de documentos guardados en Supabase Storage, privados por organización.
- **Configuración → Permisos por rol**: casillas para decidir qué puede editar cada rol. El Administrador siempre puede todo.
- **Clave de eliminación**: eliminar cualquier maestro pide la clave (inicial **1234**, se cambia en Configuración).
  Un registro con información relacionada (ej. un cliente con sedes) no se puede borrar: se desactiva.
- Tipos de residuo genéricos precargados (papel, cartón, madera, plástico, metal, vidrio, orgánicos, generales,
  aceites usados, trapos contaminados, RAEE, biocontaminados) y tipos de unidad (compactador, furgón, volquete,
  baranda, cisterna, camioneta). Toda organización nueva los recibe automáticamente.

## Permisos por defecto
| Acción | Operaciones | Facturación | Planta | Chofer |
|---|---|---|---|---|
| Clientes | — | — | — | — |
| Sedes, unidades, choferes, destinos | ✔ | — | — | — |
| Tarifas | — | ✔ | — | — |
| Eliminar (con clave) | — | — | — | — |

## Prueba "Listo cuando" (usuario admin@ecoruta.test / Demo2026!)
1. **Maestros → Clientes → Nuevo cliente**: razón social y un RUC válido (ej. `20100070970`). Al guardar se abre su ficha.
2. En la ficha, **+ Agregar sede** dos veces (nombre y dirección). Deben aparecer las 2 sedes en la tabla.
3. **Tipos de residuo → Nuevo**: registra tres (ej. `CHA` Chatarra fina, `TON` Tóner, `LOD` Lodos). Se ven en la lista.
4. **Unidades → Nueva unidad** dos veces (placa, tipo, capacidad en kg). Se abren sus fichas; agrega un SOAT a una.
5. **Choferes → Nuevo chofer** dos veces (DNI de 8 dígitos, licencia, categoría, vencimiento).
6. Revisa los listados: el cliente con "2" sedes, los tipos, las dos unidades y los dos choferes.
7. Extra: **Tipos de unidad** → agrega uno → ábrelo con el lápiz → **Eliminar** → clave `0000` (rechaza) y luego `1234` (elimina).
8. Extra: entra como `operaciones@ecoruta.test`: puede crear unidades pero no clientes; como `chofer@ecoruta.test` no ve Maestros.

## Modo prueba (acceso con un clic)
En la pantalla de login hay botones para entrar con cada usuario demo sin escribir la contraseña.
Para ocultarlos (por ejemplo, antes de dar acceso a un cliente real), agrega en Vercel la variable
`MODO_DEMO` con el valor `false` y vuelve a desplegar.
