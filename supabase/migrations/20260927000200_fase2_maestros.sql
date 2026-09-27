-- =====================================================================
-- ResiduIQ · Fase 2 — Maestros
-- Permisos configurables por rol, clave de eliminación, catálogos,
-- clientes/sedes, tipos de residuo, unidades (+documentos), choferes
-- (+capacitaciones), destinos y tarifas (precio con IGV). Pesos en kg.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Permisos configurables por organización y rol
-- (ADMIN siempre puede todo; CLIENTE nunca edita maestros)
-- ---------------------------------------------------------------------
create table public.permisos_rol (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rol public.app_rol not null check (rol in ('operaciones', 'chofer', 'planta', 'facturacion')),
  permiso text not null check (permiso in (
    'clientes.editar', 'sedes.editar', 'tipos_residuo.editar', 'unidades.editar',
    'choferes.editar', 'destinos.editar', 'tarifas.editar', 'maestros.eliminar'
  )),
  permitido boolean not null default false,
  primary key (organization_id, rol, permiso)
);

create or replace function private.puede(p_permiso text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select case
    when private.mi_rol() in ('super_admin', 'admin') then true
    when private.mi_rol() is null or private.mi_rol() = 'cliente' then false
    else coalesce((
      select permitido from public.permisos_rol
      where organization_id = private.mi_org() and rol = private.mi_rol() and permiso = p_permiso
    ), false)
  end
$$;

alter table public.permisos_rol enable row level security;
create policy permisos_select on public.permisos_rol for select to authenticated
  using ((select private.es_super_admin())
         or (organization_id = (select private.mi_org()) and (select private.es_personal_eors())));
create policy permisos_update on public.permisos_rol for update to authenticated
  using ((select private.es_super_admin())
         or (organization_id = (select private.mi_org()) and (select private.mi_rol()) = 'admin'))
  with check ((select private.es_super_admin())
         or (organization_id = (select private.mi_org()) and (select private.mi_rol()) = 'admin'));

-- ---------------------------------------------------------------------
-- Clave de eliminación por organización (guardada cifrada, nunca expuesta)
-- ---------------------------------------------------------------------
create table private.config_org (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  clave_eliminacion_hash text not null
);
revoke all on private.config_org from public, anon, authenticated;

create or replace function private.clave_ok(p_org uuid, p_clave text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select clave_eliminacion_hash = extensions.crypt(coalesce(p_clave, ''), clave_eliminacion_hash)
     from private.config_org where organization_id = p_org),
    p_clave = '1234')
$$;

create or replace function public.cambiar_clave_eliminacion(p_actual text, p_nueva text)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_org uuid := private.mi_org();
begin
  if private.mi_rol() is distinct from 'admin' then
    raise exception 'Solo el administrador puede cambiar la clave de eliminación';
  end if;
  if not private.clave_ok(v_org, p_actual) then
    raise exception 'La clave actual no es correcta';
  end if;
  if length(coalesce(p_nueva, '')) < 4 then
    raise exception 'La nueva clave debe tener al menos 4 caracteres';
  end if;
  insert into private.config_org (organization_id, clave_eliminacion_hash)
  values (v_org, extensions.crypt(p_nueva, extensions.gen_salt('bf')))
  on conflict (organization_id) do update set clave_eliminacion_hash = excluded.clave_eliminacion_hash;
end;
$$;
revoke all on function public.cambiar_clave_eliminacion(text, text) from public, anon;
grant execute on function public.cambiar_clave_eliminacion(text, text) to authenticated;

-- ---------------------------------------------------------------------
-- Clientes: completar y reforzar integridad
-- ---------------------------------------------------------------------
alter table public.clientes add column activo boolean not null default true;
alter table public.clientes add column direccion_fiscal text;
alter table public.clientes add constraint clientes_id_org_key unique (id, organization_id);

-- Un cliente con usuarios no se puede borrar sin antes reasignarlos
alter table public.profiles drop constraint profiles_cliente_id_fkey;
alter table public.profiles add constraint profiles_cliente_id_fkey
  foreign key (cliente_id) references public.clientes(id) on delete restrict;
alter table public.profiles add constraint profiles_id_org_key unique (id, organization_id);

drop policy clientes_write on public.clientes;
create policy clientes_insert on public.clientes for insert to authenticated
  with check ((select private.es_super_admin())
         or (organization_id = (select private.mi_org()) and (select private.puede('clientes.editar'))));
create policy clientes_update on public.clientes for update to authenticated
  using ((select private.es_super_admin())
         or (organization_id = (select private.mi_org()) and (select private.puede('clientes.editar'))))
  with check ((select private.es_super_admin())
         or (organization_id = (select private.mi_org()) and (select private.puede('clientes.editar'))));

-- ---------------------------------------------------------------------
-- Sedes
-- ---------------------------------------------------------------------
create table public.sedes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  cliente_id uuid not null,
  nombre text not null,
  direccion text not null,
  distrito text,
  provincia text,
  departamento text,
  latitud numeric(9, 6) check (latitud between -90 and 90),
  longitud numeric(9, 6) check (longitud between -180 and 180),
  horario_recojo text,
  contacto_nombre text,
  contacto_telefono text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key (cliente_id, organization_id) references public.clientes(id, organization_id) on delete restrict
);
create index sedes_org_idx on public.sedes(organization_id);
create index sedes_cliente_idx on public.sedes(cliente_id);

-- ---------------------------------------------------------------------
-- Tipos de residuo (unidad de registro siempre kg)
-- ---------------------------------------------------------------------
create table public.tipos_residuo (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  codigo text not null,
  nombre text not null,
  clase text not null check (clase in ('peligroso', 'no_peligroso', 'aprovechable')),
  unidad text not null default 'kg' check (unidad = 'kg'),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, codigo),
  unique (id, organization_id)
);

-- ---------------------------------------------------------------------
-- Unidades (vehículos) y sus documentos
-- ---------------------------------------------------------------------
create table public.tipos_unidad (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, nombre),
  unique (id, organization_id)
);

create table public.unidades (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  placa text not null check (placa ~ '^[A-Z0-9]{2,4}-?[A-Z0-9]{2,4}$'),
  tipo_unidad_id uuid not null,
  capacidad_kg numeric(12, 2) not null check (capacidad_kg > 0),
  marca text,
  modelo text,
  anio int check (anio between 1950 and 2100),
  estado text not null default 'operativa' check (estado in ('operativa', 'mantenimiento', 'inactiva')),
  observaciones text,
  created_at timestamptz not null default now(),
  unique (organization_id, placa),
  unique (id, organization_id),
  foreign key (tipo_unidad_id, organization_id) references public.tipos_unidad(id, organization_id) on delete restrict
);
create index unidades_org_idx on public.unidades(organization_id);

create table public.documentos_unidad (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  unidad_id uuid not null,
  tipo text not null check (tipo in ('soat', 'revision_tecnica', 'habilitacion', 'poliza', 'otro')),
  numero text,
  fecha_emision date,
  fecha_vencimiento date not null,
  archivo_path text,
  created_at timestamptz not null default now(),
  foreign key (unidad_id, organization_id) references public.unidades(id, organization_id) on delete cascade
);
create index documentos_unidad_unidad_idx on public.documentos_unidad(unidad_id);

-- ---------------------------------------------------------------------
-- Choferes y capacitaciones
-- ---------------------------------------------------------------------
create table public.choferes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  nombres text not null,
  apellidos text not null,
  dni text not null check (dni ~ '^[0-9]{8}$'),
  telefono text,
  licencia_numero text not null,
  licencia_categoria text not null check (licencia_categoria in ('A-I', 'A-IIa', 'A-IIb', 'A-IIIa', 'A-IIIb', 'A-IIIc')),
  licencia_vencimiento date not null,
  profile_id uuid unique,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, dni),
  unique (id, organization_id),
  foreign key (profile_id, organization_id) references public.profiles(id, organization_id) on delete set null (profile_id)
);
create index choferes_org_idx on public.choferes(organization_id);

create table public.capacitaciones (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  chofer_id uuid not null,
  nombre text not null,
  fecha date not null,
  vencimiento date,
  created_at timestamptz not null default now(),
  foreign key (chofer_id, organization_id) references public.choferes(id, organization_id) on delete cascade
);
create index capacitaciones_chofer_idx on public.capacitaciones(chofer_id);

-- ---------------------------------------------------------------------
-- Destinos
-- ---------------------------------------------------------------------
create table public.destinos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  nombre text not null,
  tipo text not null check (tipo in ('relleno_seguridad', 'planta_valorizacion', 'otro')),
  autorizacion text,
  direccion text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, nombre)
);

-- ---------------------------------------------------------------------
-- Tarifas (precio en S/ con IGV incluido)
-- ---------------------------------------------------------------------
create table public.tarifas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  cliente_id uuid not null,
  tipo_residuo_id uuid not null,
  modalidad text not null check (modalidad in ('por_servicio', 'por_kg', 'por_viaje')),
  precio_con_igv numeric(12, 2) not null check (precio_con_igv >= 0),
  vigente_desde date not null default current_date,
  vigente_hasta date,
  observaciones text,
  created_at timestamptz not null default now(),
  check (vigente_hasta is null or vigente_hasta >= vigente_desde),
  foreign key (cliente_id, organization_id) references public.clientes(id, organization_id) on delete restrict,
  foreign key (tipo_residuo_id, organization_id) references public.tipos_residuo(id, organization_id) on delete restrict
);
create index tarifas_org_idx on public.tarifas(organization_id);
create index tarifas_cliente_idx on public.tarifas(cliente_id);

-- ---------------------------------------------------------------------
-- RLS de los maestros
--   Lectura: personal de la EO-RS (CLIENTE solo sus sedes).
--   Escritura: según permiso configurable.
--   Eliminación: solo con la función eliminar_maestro (pide clave).
-- ---------------------------------------------------------------------
do $$
declare
  t record;
begin
  for t in select * from (values
    ('sedes', 'sedes.editar'),
    ('tipos_residuo', 'tipos_residuo.editar'),
    ('tipos_unidad', 'unidades.editar'),
    ('unidades', 'unidades.editar'),
    ('documentos_unidad', 'unidades.editar'),
    ('choferes', 'choferes.editar'),
    ('capacitaciones', 'choferes.editar'),
    ('destinos', 'destinos.editar'),
    ('tarifas', 'tarifas.editar')
  ) as x(tabla, permiso) loop
    execute format('alter table public.%I enable row level security', t.tabla);
    execute format($p$
      create policy %1$s_insert on public.%1$I for insert to authenticated
        with check ((select private.es_super_admin())
          or (organization_id = (select private.mi_org()) and (select private.puede(%2$L))))$p$,
      t.tabla, t.permiso);
    execute format($p$
      create policy %1$s_update on public.%1$I for update to authenticated
        using ((select private.es_super_admin())
          or (organization_id = (select private.mi_org()) and (select private.puede(%2$L))))
        with check ((select private.es_super_admin())
          or (organization_id = (select private.mi_org()) and (select private.puede(%2$L))))$p$,
      t.tabla, t.permiso);
    if t.tabla not in ('sedes', 'tarifas') then
      execute format($p$
        create policy %1$s_select on public.%1$I for select to authenticated
          using ((select private.es_super_admin())
            or (organization_id = (select private.mi_org()) and (select private.es_personal_eors())))$p$,
        t.tabla);
    end if;
  end loop;
end $$;

-- Sedes: además el CLIENTE ve las de su empresa
create policy sedes_select on public.sedes for select to authenticated
  using (
    (select private.es_super_admin())
    or (organization_id = (select private.mi_org()) and (select private.es_personal_eors()))
    or ((select private.mi_rol()) = 'cliente'
        and organization_id = (select private.mi_org())
        and cliente_id = (select private.mi_cliente()))
  );

-- Tarifas: información comercial, solo ADMIN, OPERACIONES, FACTURACION o quien tenga el permiso
create policy tarifas_select on public.tarifas for select to authenticated
  using (
    (select private.es_super_admin())
    or (organization_id = (select private.mi_org())
        and ((select private.mi_rol()) in ('admin', 'operaciones', 'facturacion')
             or (select private.puede('tarifas.editar'))))
  );

-- ---------------------------------------------------------------------
-- Eliminación protegida con clave
-- ---------------------------------------------------------------------
create or replace function public.eliminar_maestro(p_tabla text, p_id uuid, p_clave text)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  v_org uuid;
  v_archivo text;
begin
  if p_tabla not in ('clientes', 'sedes', 'tipos_residuo', 'tipos_unidad', 'unidades',
                     'documentos_unidad', 'choferes', 'capacitaciones', 'destinos', 'tarifas') then
    raise exception 'Tabla no permitida';
  end if;

  execute format('select organization_id from public.%I where id = $1', p_tabla) into v_org using p_id;
  if v_org is null or (not private.es_super_admin() and v_org is distinct from private.mi_org()) then
    raise exception 'Registro no encontrado';
  end if;
  if not private.puede('maestros.eliminar') then
    raise exception 'No tienes permiso para eliminar';
  end if;
  if not private.clave_ok(v_org, p_clave) then
    raise exception 'Clave de eliminación incorrecta';
  end if;

  if p_tabla = 'documentos_unidad' then
    select archivo_path into v_archivo from public.documentos_unidad where id = p_id;
  end if;

  begin
    execute format('delete from public.%I where id = $1', p_tabla) using p_id;
  exception when foreign_key_violation then
    raise exception 'No se puede eliminar: tiene información relacionada (sedes, tarifas, usuarios u otros). Desactívalo en su lugar.';
  end;

  return v_archivo; -- ruta del archivo a borrar del almacenamiento, si había uno
end;
$$;
revoke all on function public.eliminar_maestro(text, uuid, text) from public, anon;
grant execute on function public.eliminar_maestro(text, uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- Datos iniciales de cada organización (permisos, clave 1234, catálogos)
-- ---------------------------------------------------------------------
create or replace function private.inicializar_organizacion(p_org uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.permisos_rol (organization_id, rol, permiso, permitido)
  select p_org, r.rol::public.app_rol, p.permiso,
    (r.rol = 'operaciones' and p.permiso in ('sedes.editar', 'unidades.editar', 'choferes.editar', 'destinos.editar'))
    or (r.rol = 'facturacion' and p.permiso = 'tarifas.editar')
  from (values ('operaciones'), ('chofer'), ('planta'), ('facturacion')) r(rol)
  cross join (values ('clientes.editar'), ('sedes.editar'), ('tipos_residuo.editar'), ('unidades.editar'),
                     ('choferes.editar'), ('destinos.editar'), ('tarifas.editar'), ('maestros.eliminar')) p(permiso)
  on conflict do nothing;

  insert into private.config_org (organization_id, clave_eliminacion_hash)
  values (p_org, extensions.crypt('1234', extensions.gen_salt('bf')))
  on conflict do nothing;

  insert into public.tipos_unidad (organization_id, nombre)
  select p_org, n from unnest(array['Compactador', 'Furgón', 'Volquete', 'Baranda', 'Cisterna', 'Camioneta']) n
  on conflict do nothing;

  insert into public.tipos_residuo (organization_id, codigo, nombre, clase)
  select p_org, c, n, k from (values
    ('PAP', 'Papel', 'aprovechable'),
    ('CAR', 'Cartón', 'aprovechable'),
    ('MAD', 'Madera', 'aprovechable'),
    ('PLA', 'Plástico', 'aprovechable'),
    ('MET', 'Metal / chatarra', 'aprovechable'),
    ('VID', 'Vidrio', 'aprovechable'),
    ('ORG', 'Residuos orgánicos', 'aprovechable'),
    ('GEN', 'Residuos generales', 'no_peligroso'),
    ('ACE', 'Aceites usados', 'peligroso'),
    ('TRC', 'Trapos y paños contaminados', 'peligroso'),
    ('RAEE', 'Aparatos eléctricos y electrónicos (RAEE)', 'peligroso'),
    ('BIO', 'Residuos biocontaminados', 'peligroso')
  ) v(c, n, k)
  on conflict do nothing;
end;
$$;

create or replace function private.tr_org_inicializar()
returns trigger language plpgsql security definer set search_path = ''
as $$ begin perform private.inicializar_organizacion(new.id); return new; end $$;

create trigger organizations_inicializar after insert on public.organizations
  for each row execute function private.tr_org_inicializar();

select private.inicializar_organizacion(id) from public.organizations;

-- ---------------------------------------------------------------------
-- Almacenamiento de archivos (PDF de documentos) — privado por organización
-- Ruta: {organization_id}/unidades/{unidad_id}/{archivo}
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos', 'documentos', false, 10485760,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy documentos_leer on storage.objects for select to authenticated
  using (bucket_id = 'documentos'
         and (storage.foldername(name))[1] = (select private.mi_org())::text
         and (select private.es_personal_eors()));
create policy documentos_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos'
         and (storage.foldername(name))[1] = (select private.mi_org())::text
         and (select private.puede('unidades.editar')));
create policy documentos_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'documentos'
         and (storage.foldername(name))[1] = (select private.mi_org())::text
         and (select private.puede('unidades.editar')));
