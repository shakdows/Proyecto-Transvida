# ResiduIQ — Instrucciones para Claude Code

> Nombre provisional. Plataforma SaaS para empresas operadoras de residuos sólidos (EO-RS).
> Cliente piloto: Transvida Perú (Transportes S&R S.R.L.). El sistema se venderá también a otras EO-RS,
> por eso **nada del cliente piloto va hardcodeado**: nombre, logo, colores y datos se configuran por organización.

## Quién te habla
El dueño del proyecto (Alexis) **no programa**. Conoce muy bien el negocio (compras, facturación, logística,
comercio exterior) y construye apoyándose en IA. Por eso:
- Explica cada cambio en lenguaje simple, sin jerga.
- Al terminar cada fase, entrega una lista corta de **qué probar y cómo** (pasos exactos, qué usuario usar).
- Cuando necesites algo de él (claves de Supabase, cuenta de Vercel, un dato del negocio), pídelo con pasos claros.
- Si una decisión de negocio no está en `docs/PRD.md`, **pregunta antes de inventar**.

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Supabase: PostgreSQL, Auth, Storage (fotos, firmas, PDF) y Row Level Security
- Gráficos: Recharts · PDF: @react-pdf/renderer · Excel: SheetJS
- Despliegue: Vercel · Código en GitHub (usuario `shakdows`)

## Reglas de trabajo
1. **Trabaja por fases** según `docs/PRD.md`. No avances a la siguiente fase sin dejar la actual funcionando y probada.
2. **Multiempresa desde el día uno**: toda tabla de negocio lleva `organization_id` y RLS. Un cliente generador solo ve lo suyo.
3. **Pesos siempre en kilogramos (kg)**. Toneladas solo como dato derivado en reportes (kg / 1000), nunca como unidad de registro.
4. Localización Perú: español, moneda S/, fechas dd/mm/aaaa, zona horaria America/Lima, RUC de 11 dígitos validado.
5. La vista del **chofer es mobile-first** (se usa en el celular, en campo, a veces con mala señal: formularios cortos, botones grandes).
6. Datos de demostración (seed) con empresas ficticias. **No usar nombres ni logos reales** en el seed.
7. Un commit claro al cerrar cada fase: `fase-N: descripción`.
8. Antes de dar una fase por terminada: el proyecto compila, no hay errores de TypeScript y el flujo principal de la fase se probó.

## Diseño
- SaaS profesional y sobrio para gerentes de operaciones y jefes ambientales: limpio, legible, tablas densas pero claras.
- Tema claro por defecto con modo oscuro. Color de marca configurable por organización (tokens CSS).
- Pie de página de la plataforma con crédito del desarrollador:
  - Línea principal: **Alexis Brian Ramírez Ramírez · CEO**
  - Línea secundaria más pequeña: Negocios Internacionales · Administrador de Empresas · Developer · Data Science · Machine Learning · Análisis e Ingeniería de Datos · Electrónica en automatización industrial

## Regla comercial fija
- El botón **"Análisis ejecutivo con IA"** (diagnóstico, prioridades, riesgos y metas sobre los datos filtrados) es siempre un
  complemento premium: mostrar arriba del botón un badge ámbar **"Complemento · US$50/mes"**
  (fondo `#fdecc8`, borde `#f5cf8a`). Las recomendaciones por reglas en cada gráfico son gratuitas.

## Documentos del proyecto
- `docs/PRD.md` — qué se construye, roles, modelo de datos y fases con criterios de aceptación. **Léelo antes de cada fase.**
