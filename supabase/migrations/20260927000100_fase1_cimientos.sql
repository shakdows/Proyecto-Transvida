-- =====================================================================
-- ResiduIQ · Fase 1 — Cimientos
-- Organizaciones (EO-RS), clientes generadores (mínimo), perfiles con rol
-- y seguridad multiempresa (RLS).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- Esquema privado para funciones auxiliares (no expuesto por la API)
create schema if not exists private;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------
create type public.app_rol as enum (
  'super_admin', 'admin', 'operaciones', 'chofer', 'planta', 'facturacion', 'cliente'
);

-- ---------------------------------------------------------------------
-- Validación de RUC peruano (11 dígitos + dígito verificador)
-- ---------------------------------------------------------------------
create or replace function public.ruc_valido(ruc text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  pesos int[] := array[5,4,3,2,7,6,5,4,3,2];
  suma int := 0;
  dv int;
begin
  if ruc is null or ruc !~ '^(10|15|16|17|20)[0-9]{9}$' then
    return false;
  end if;
  for i in 1..10 loop
    suma := suma + substr(ruc, i, 1)::int * pesos[i];
  end loop;
  dv := 11 - (suma % 11);
  if dv = 10 then dv := 0; elsif dv = 11 then dv := 1; end if;
  return dv = substr(ruc, 11, 1)::int;
end;
$$;

-- ---------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  razon_social text not null,
  nombre_comercial text,
  ruc text not null unique check (public.ruc_valido(ruc)),
  registro_eors text,
  logo_url text,
  color_marca text not null default '#0f766e' check (color_marca ~ '^#[0-9a-fA-F]{6}$'),
  plan text not null default 'basico',
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  razon_social text not null,
  ruc text not null check (public.ruc_valido(ruc)),
  rubro text,
  contacto_nombre text,
  contacto_email text,
  contacto_telefono text,
  created_at timestamptz not null default now(),
  unique (organization_id, ruc)
);
create index clientes_organization_id_idx on public.clientes(organization_id);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  rol public.app_rol not null,
  nombre text not null,
  email text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  -- Todos menos el SUPER_ADMIN pertenecen a una organización
  constraint profiles_org_requerida check (rol = 'super_admin' or organization_id is not null),
  -- Solo el rol CLIENTE se vincula a un cliente generador, y es obligatorio
  constraint profiles_cliente_coherente check (
    (rol = 'cliente' and cliente_id is not null) or (rol <> 'cliente' and cliente_id is null)
  )
);
create index profiles_organization_id_idx on public.profiles(organization_id);
create index profiles_cliente_id_idx on public.profiles(cliente_id);

-- ---------------------------------------------------------------------
-- Funciones auxiliares para RLS (leen el perfil del usuario conectado)
-- ---------------------------------------------------------------------
create or replace function private.mi_rol()
returns public.app_rol language sql stable security definer set search_path = ''
as $$ select rol from public.profiles where id = auth.uid() and activo $$;

create or replace function private.mi_org()
returns uuid language sql stable security definer set search_path = ''
as $$ select organization_id from public.profiles where id = auth.uid() and activo $$;

create or replace function private.mi_cliente()
returns uuid language sql stable security definer set search_path = ''
as $$ select cliente_id from public.profiles where id = auth.uid() and activo $$;

create or replace function private.es_super_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce((select rol = 'super_admin' from public.profiles where id = auth.uid() and activo), false) $$;

create or replace function private.es_personal_eors()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce((select rol not in ('super_admin','cliente') from public.profiles where id = auth.uid() and activo), false) $$;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.clientes enable row level security;
alter table public.profiles enable row level security;

-- organizations
create policy org_select on public.organizations for select to authenticated
  using ((select private.es_super_admin()) or id = (select private.mi_org()));
create policy org_insert on public.organizations for insert to authenticated
  with check ((select private.es_super_admin()));
create policy org_update on public.organizations for update to authenticated
  using ((select private.es_super_admin())
         or (id = (select private.mi_org()) and (select private.mi_rol()) = 'admin'))
  with check ((select private.es_super_admin())
         or (id = (select private.mi_org()) and (select private.mi_rol()) = 'admin'));
create policy org_delete on public.organizations for delete to authenticated
  using ((select private.es_super_admin()));

-- clientes: el personal de la EO-RS ve los de su organización;
-- un usuario CLIENTE solo ve su propia empresa.
create policy clientes_select on public.clientes for select to authenticated
  using (
    (select private.es_super_admin())
    or ((select private.es_personal_eors()) and organization_id = (select private.mi_org()))
    or ((select private.mi_rol()) = 'cliente'
        and id = (select private.mi_cliente())
        and organization_id = (select private.mi_org()))
  );
create policy clientes_write on public.clientes for all to authenticated
  using ((select private.es_super_admin())
         or (organization_id = (select private.mi_org()) and (select private.mi_rol()) = 'admin'))
  with check ((select private.es_super_admin())
         or (organization_id = (select private.mi_org()) and (select private.mi_rol()) = 'admin'));

-- profiles: cada uno ve el suyo; ADMIN ve los de su organización; SUPER_ADMIN todos.
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.es_super_admin())
    or ((select private.mi_rol()) = 'admin' and organization_id = (select private.mi_org()))
  );
create policy profiles_update on public.profiles for update to authenticated
  using ((select private.es_super_admin())
         or ((select private.mi_rol()) = 'admin' and organization_id = (select private.mi_org())
             and rol <> 'super_admin'))
  with check ((select private.es_super_admin())
         or ((select private.mi_rol()) = 'admin' and organization_id = (select private.mi_org())
             and rol <> 'super_admin'));
-- Los perfiles se crean únicamente con la función admin_crear_usuario (abajo).

-- ---------------------------------------------------------------------
-- Creación de usuarios (Auth + perfil) sin exponer claves secretas
-- ---------------------------------------------------------------------
create or replace function private.crear_usuario(
  p_email text, p_password text, p_nombre text, p_rol public.app_rol,
  p_org uuid, p_cliente uuid
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
  v_email text := lower(trim(p_email));
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Correo no válido';
  end if;
  if length(coalesce(p_password, '')) < 8 then
    raise exception 'La contraseña debe tener al menos 8 caracteres';
  end if;
  if exists (select 1 from auth.users where email = v_email) then
    raise exception 'Ya existe un usuario con ese correo';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nombre', p_nombre), now(), now(), '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_id, v_id::text,
    jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
    'email', now(), now(), now()
  );

  insert into public.profiles (id, organization_id, cliente_id, rol, nombre, email)
  values (v_id, p_org, p_cliente, p_rol, p_nombre, v_email);

  return v_id;
end;
$$;

-- Llamable desde la app: valida que quien crea tenga permiso.
create or replace function public.admin_crear_usuario(
  p_email text, p_password text, p_nombre text, p_rol public.app_rol,
  p_org uuid default null, p_cliente uuid default null
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_rol public.app_rol := private.mi_rol();
  v_org uuid := private.mi_org();
begin
  if v_rol is null or v_rol not in ('super_admin', 'admin') then
    raise exception 'No tienes permiso para crear usuarios';
  end if;

  if v_rol = 'admin' then
    if p_rol = 'super_admin' then
      raise exception 'Un administrador no puede crear super administradores';
    end if;
    p_org := v_org; -- un ADMIN solo crea usuarios en su propia organización
  end if;

  if p_rol = 'super_admin' then
    p_org := null;
    p_cliente := null;
  elsif p_org is null then
    raise exception 'Debes indicar la organización';
  end if;

  if p_rol = 'cliente' then
    if p_cliente is null
       or not exists (select 1 from public.clientes where id = p_cliente and organization_id = p_org) then
      raise exception 'Para el rol Cliente debes elegir una empresa cliente de la organización';
    end if;
  else
    p_cliente := null;
  end if;

  return private.crear_usuario(p_email, p_password, p_nombre, p_rol, p_org, p_cliente);
end;
$$;

revoke all on function public.admin_crear_usuario(text, text, text, public.app_rol, uuid, uuid) from public, anon;
grant execute on function public.admin_crear_usuario(text, text, text, public.app_rol, uuid, uuid) to authenticated;
revoke all on function private.crear_usuario(text, text, text, public.app_rol, uuid, uuid) from public, anon, authenticated;
