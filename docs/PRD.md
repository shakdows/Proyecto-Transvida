# ResiduIQ — Especificación del producto (PRD)

## 1. Problema
Una EO-RS recolecta, transporta, pesa, dispone o valoriza residuos de clientes industriales. Hoy la información vive
en guías en papel, WhatsApp y Excel. Eso genera tres dolores:
1. **El cliente generador** necesita pruebas de qué pasó con sus residuos (manifiestos, certificados, kg por tipo,
   % valorizado) para cumplir la norma y para sus reportes de sostenibilidad, y tarda días en recibirlas.
2. **Operaciones** no ve en un solo lugar qué unidad y chofer están habilitados, qué recojos hay hoy y qué se cerró.
3. **Facturación** reprocesa: cruza a mano servicios, guías y pesos para emitir facturas.

## 2. Idea central
**Cada recolección es un registro único** que nace en la programación, se completa en campo (chofer),
se cierra en planta/balanza y termina en tres salidas: el portal del cliente, el control de la flota y la factura.

```
Programación → Registro en campo (chofer) → Pesaje y destino → Cierre con documentos
                                                                  ├─ Portal del cliente + dashboard ambiental
                                                                  ├─ Indicadores de flota y costos
                                                                  └─ Pre-factura y conciliación
```

## 3. Roles
| Rol | Qué hace |
|---|---|
| SUPER_ADMIN | Dueño de la plataforma. Crea organizaciones (EO-RS) y sus planes. |
| ADMIN | Administra su EO-RS: usuarios, maestros, configuración y marca. |
| OPERACIONES | Programa recojos, asigna unidad y chofer, supervisa el día. |
| CHOFER | Ve sus recojos del día en el celular y registra llegada, fotos, firma, guía y observaciones. |
| PLANTA | Registra pesajes en balanza, destino final y clasificación de materiales valorizables. |
| FACTURACION | Revisa servicios cerrados, genera pre-facturas y concilia. |
| CLIENTE | Usuario del generador: solo ve su empresa y sus sedes (portal). |

## 4. Modelo de datos (primera versión)
- **organizations**: EO-RS (razón social, RUC, logo, color de marca, registro de EO-RS).
- **clientes**: generadores (razón social, RUC, rubro, contacto) → **sedes** (dirección, distrito, coordenadas, horario de recojo).
- **tipos_residuo**: nombre, clase (peligroso / no peligroso / aprovechable), código, unidad de registro kg.
- **unidades**: placa, tipo, capacidad (kg), estado → **documentos_unidad** (SOAT, revisión técnica, habilitaciones, póliza) con fecha de vencimiento y archivo.
- **choferes**: datos, licencia (categoría y vencimiento), capacitaciones con vencimiento.
- **destinos**: relleno de seguridad, planta de valorización, otro (nombre, autorización).
- **servicios** (recolecciones): cliente, sede, fecha programada, unidad, chofer, estado
  (`programado → en_ruta → en_sede → recogido → pesado → cerrado → facturado`, más `cancelado`).
- **servicio_residuos**: tipo de residuo, kg estimado, kg real (balanza), destino.
- **servicio_evidencias**: fotos, firma del responsable del cliente, hora y ubicación.
- **documentos_servicio**: guía de remisión, manifiesto, certificado de disposición/valorización (PDF).
- **materiales_valorizados**: ingresos a planta por material (cartón, plástico, metal…) en kg, stock y ventas.
- **tarifas**: por cliente y tipo de residuo (por servicio, por kg o por viaje).
- **prefacturas**: agrupan servicios cerrados de un período por cliente.

> Validar con el cliente piloto: nombres exactos de documentos que emiten, formato de su manifiesto y certificado,
> y cómo tarifican hoy. Referencia normativa: D. Leg. 1278 (Ley de Gestión Integral de Residuos Sólidos) y su reglamento.

## 5. Fases
Regla: no se avanza de fase sin la anterior funcionando. Al final de cada fase: lista de qué probar.

### Fase 1 — Cimientos
Proyecto Next.js + Supabase, login, organizaciones, usuarios y roles, RLS multiempresa, layout base (menú lateral,
cabecera con organización activa, pie con crédito), tema claro/oscuro y seed demo.
**Listo cuando:** puedo entrar con un usuario de cada rol, cada uno ve solo su menú, y un CLIENTE no puede ver datos de otra empresa ni forzando la URL.

### Fase 2 — Maestros
CRUD de clientes y sedes, tipos de residuo, unidades, choferes, destinos y tarifas. Búsqueda, filtros y carga desde Excel para clientes y unidades.
**Listo cuando:** registro un cliente con dos sedes, tres tipos de residuo, dos unidades y dos choferes sin errores y los veo listados.

### Fase 3 — Programación de recojos
Calendario (día/semana) y lista de servicios; crear servicio, asignar unidad y chofer, validar capacidad y que la
unidad/chofer no estén vencidos. Recojos recurrentes (ej. cada lunes).
**Listo cuando:** programo una semana de recojos y el sistema me bloquea si asigno una unidad con SOAT vencido.

### Fase 4 — App del chofer (móvil)
Vista "Mis recojos de hoy", botón por etapa (en ruta, en sede, recogido), fotos, firma en pantalla, número de guía,
observaciones, hora y ubicación automáticas. Guardado tolerante a mala señal.
**Listo cuando:** desde el celular completo un recojo con foto y firma y operaciones lo ve actualizado.

### Fase 5 — Pesaje, destino y cierre
Registro de kg reales por tipo de residuo, destino final, carga de manifiesto y generación del **certificado PDF**
con la marca de la EO-RS. Cierre del servicio.
**Listo cuando:** cierro un servicio y descargo su certificado PDF con kg por tipo y destino.

### Fase 6 — Portal del cliente + dashboard ambiental (entregable estrella)
El CLIENTE ve sus servicios, evidencias y documentos descargables; dashboard con kg por mes, por tipo y por sede,
% valorizado vs. dispuesto, y exportación a Excel/PDF para su reporte anual.
**Listo cuando:** entro como cliente, filtro por sede y año y descargo el reporte consolidado.
> Con esta fase ya hay una versión presentable a la EO-RS.

### Fase 7 — Flota y cumplimiento
Semáforo de vencimientos (unidades y choferes) con alertas, mantenimiento preventivo por km, combustible y costo por servicio y por tonelada.
**Listo cuando:** veo en un tablero qué vence en los próximos 30 días y el costo por tonelada del mes.

### Fase 8 — Valorización
Ingresos a planta por material, stock, ventas de reciclables y margen por material. Avance hacia la meta de % valorizado.
**Listo cuando:** registro ingresos y una venta y el stock y el margen se actualizan solos.

### Fase 9 — Pre-facturación y conciliación
Servicios cerrados → pre-factura por cliente y período según tarifas; conciliación servicio vs. guía vs. kg vs. facturado; exportación a Excel.
**Listo cuando:** genero la pre-factura del mes de un cliente y el sistema marca los servicios sin guía o sin peso.

### Fase 10 — Analítica e IA
Tablero gerencial (servicios, kg, clientes top, cumplimiento de horarios, costos) con recomendaciones por reglas
gratuitas y el botón premium "Análisis ejecutivo con IA" (ver regla en CLAUDE.md).

## 6. Fuera de alcance (por ahora)
Facturación electrónica SUNAT directa (se exporta para el sistema contable), GPS en tiempo real, app nativa de tiendas.
