-- =====================================================================
-- ResiduIQ · Datos de demostración (empresas y personas FICTICIAS)
-- Contraseña de todos los usuarios demo: Demo2026!
-- Se puede ejecutar varias veces: borra y vuelve a crear los datos demo.
-- =====================================================================

-- Limpieza de datos demo anteriores
delete from auth.users where email like '%.test';
delete from public.organizations where ruc in ('20601234565', '20602345671');

do $$
declare
  org1 uuid; org2 uuid;
  cli_andinas uuid; cli_pacifico uuid; cli_sierra uuid; cli_horizonte uuid;
  pw text := 'Demo2026!';
begin
  insert into public.organizations (razon_social, nombre_comercial, ruc, registro_eors, color_marca)
  values ('EcoRuta Ambiental Demo S.A.C.', 'EcoRuta', '20601234565', 'EO-RS-0000-DEMO-01', '#0f766e')
  returning id into org1;

  insert into public.organizations (razon_social, nombre_comercial, ruc, registro_eors, color_marca)
  values ('Verde Circular Demo E.I.R.L.', 'Verde Circular', '20602345671', 'EO-RS-0000-DEMO-02', '#1d4ed8')
  returning id into org2;

  insert into public.clientes (organization_id, razon_social, ruc, rubro, contacto_nombre, contacto_email)
  values (org1, 'Industrias Andinas Demo S.A.C.', '20603456786', 'Manufactura', 'Lucía Paredes', 'lucia@andinas.test')
  returning id into cli_andinas;
  insert into public.clientes (organization_id, razon_social, ruc, rubro, contacto_nombre, contacto_email)
  values (org1, 'Alimentos del Pacífico Demo S.A.', '20604567891', 'Alimentos', 'Jorge Salas', 'jorge@pacifico.test')
  returning id into cli_pacifico;
  insert into public.clientes (organization_id, razon_social, ruc, rubro, contacto_nombre, contacto_email)
  values (org2, 'Textiles Sierra Demo S.A.C.', '20605678905', 'Textil', 'Ana Quispe', 'ana@sierra.test')
  returning id into cli_sierra;
  insert into public.clientes (organization_id, razon_social, ruc, rubro, contacto_nombre, contacto_email)
  values (org2, 'Minera Horizonte Demo S.A.', '20606789018', 'Minería', 'Raúl Torres', 'raul@horizonte.test')
  returning id into cli_horizonte;

  -- Plataforma
  perform private.crear_usuario('superadmin@residuiq.test', pw, 'Super Administrador', 'super_admin', null, null);

  -- EO-RS 1: EcoRuta (un usuario por rol)
  perform private.crear_usuario('admin@ecoruta.test',        pw, 'Carla Mendoza',  'admin',       org1, null);
  perform private.crear_usuario('operaciones@ecoruta.test',  pw, 'Diego Rojas',    'operaciones', org1, null);
  perform private.crear_usuario('chofer@ecoruta.test',       pw, 'Pedro Huamán',   'chofer',      org1, null);
  perform private.crear_usuario('planta@ecoruta.test',       pw, 'Rosa Castillo',  'planta',      org1, null);
  perform private.crear_usuario('facturacion@ecoruta.test',  pw, 'Miguel Vargas',  'facturacion', org1, null);
  perform private.crear_usuario('cliente@andinas.test',      pw, 'Lucía Paredes',  'cliente',     org1, cli_andinas);
  perform private.crear_usuario('cliente@pacifico.test',     pw, 'Jorge Salas',    'cliente',     org1, cli_pacifico);

  -- EO-RS 2: Verde Circular
  perform private.crear_usuario('admin@verdecircular.test',  pw, 'Sofía Linares',  'admin',       org2, null);
  perform private.crear_usuario('cliente@sierra.test',       pw, 'Ana Quispe',     'cliente',     org2, cli_sierra);
end $$;
