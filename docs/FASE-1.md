# Fase 1 — Cimientos: qué hay y cómo probarlo

## Qué se construyó
- Login con correo y contraseña.
- Organizaciones (EO-RS), empresas cliente (mínimo, se completan en la Fase 2) y usuarios con uno de 7 roles.
- Seguridad multiempresa en la base de datos (RLS): cada EO-RS ve solo lo suyo y un usuario CLIENTE solo ve su propia empresa.
- Diseño base: menú lateral según el rol, cabecera con la organización activa, pie con el crédito, tema claro/oscuro.
- Color de marca y logo configurables por organización (menú **Configuración**, usuario ADMIN).
- Datos demo con empresas ficticias (`supabase/seed.sql`).

## Usuarios demo
Contraseña de todos: **`Demo2026!`**

| Rol | Correo | Organización |
|---|---|---|
| SUPER_ADMIN | superadmin@residuiq.test | Plataforma |
| ADMIN | admin@ecoruta.test | EcoRuta |
| OPERACIONES | operaciones@ecoruta.test | EcoRuta |
| CHOFER | chofer@ecoruta.test | EcoRuta |
| PLANTA | planta@ecoruta.test | EcoRuta |
| FACTURACION | facturacion@ecoruta.test | EcoRuta |
| CLIENTE | cliente@andinas.test | EcoRuta → Industrias Andinas |
| CLIENTE (otra empresa) | cliente@pacifico.test | EcoRuta → Alimentos del Pacífico |
| ADMIN (otra EO-RS) | admin@verdecircular.test | Verde Circular |
| CLIENTE (otra EO-RS) | cliente@sierra.test | Verde Circular → Textiles Sierra |

## Menú que debe ver cada rol
| Rol | Opciones activas | "Próximamente" |
|---|---|---|
| SUPER_ADMIN | Inicio, Organizaciones, Usuarios | — |
| ADMIN | Inicio, Usuarios, Clientes, Configuración | Maestros, Programación, Flota, Valorización, Pre-facturación, Analítica |
| OPERACIONES | Inicio, Clientes | Programación, Flota |
| CHOFER | Inicio | Mis recojos de hoy |
| PLANTA | Inicio | Pesaje y cierre, Valorización |
| FACTURACION | Inicio, Clientes | Pre-facturación |
| CLIENTE | Inicio, Mi empresa | Mis servicios y reportes |

## Prueba "Listo cuando"
1. Entra con cada usuario de la tabla y comprueba que su menú coincide con la tabla de arriba. Sal con el botón **Salir**.
2. Entra como **admin@ecoruta.test** → **Clientes** → haz clic en *Alimentos del Pacífico Demo S.A.* y **copia la dirección (URL)** de la barra del navegador. Sal.
3. Entra como **cliente@andinas.test** → **Mi empresa**: debe mostrar *Industrias Andinas Demo S.A.C.*
4. Pega en la barra la URL copiada en el paso 2 (la de otra empresa) → debe salir **"No tienes acceso a esta sección"**.
5. Con el mismo cliente escribe a mano `/usuarios`, `/clientes`, `/organizaciones` y `/configuracion` al final de la dirección → en todas debe salir **"No tienes acceso a esta sección"**.
6. Extra: entra como **admin@verdecircular.test** → **Clientes**: solo aparecen *Textiles Sierra* y *Minera Horizonte* (nada de EcoRuta).

## Volver a cargar los datos demo
En Supabase → **SQL Editor**, pega el contenido de `supabase/seed.sql` y pulsa **Run**. Borra y vuelve a crear los datos demo.
