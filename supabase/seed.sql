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

-- ---------------------------------------------------------------------
-- Fase 2 · Maestros de demostración (EcoRuta). Los tipos de residuo,
-- tipos de unidad, permisos y la clave 1234 se crean solos por organización.
-- ---------------------------------------------------------------------
do $$
declare
  org1 uuid := (select id from public.organizations where ruc = '20601234565');
  cli_andinas uuid := (select id from public.clientes where ruc = '20603456786');
  cli_pacifico uuid := (select id from public.clientes where ruc = '20604567891');
  u1 uuid; u2 uuid; ch1 uuid;
begin
  insert into public.sedes (organization_id, cliente_id, nombre, direccion, distrito, provincia, departamento, horario_recojo, contacto_nombre)
  values
    (org1, cli_andinas, 'Planta Ate', 'Av. Industrial 1450', 'Ate', 'Lima', 'Lima', 'Lun-Vie 08:00-12:00', 'Lucía Paredes'),
    (org1, cli_andinas, 'Almacén Lurín', 'Calle Los Pinos 220', 'Lurín', 'Lima', 'Lima', 'Mar y Jue 14:00-17:00', 'Mario Chávez'),
    (org1, cli_pacifico, 'Planta Callao', 'Av. Néstor Gambetta 3200', 'Callao', 'Callao', 'Callao', 'Lun-Sáb 07:00-11:00', 'Jorge Salas');

  insert into public.unidades (organization_id, placa, tipo_unidad_id, capacidad_kg, marca, modelo, anio)
  values (org1, 'ABC-123', (select id from public.tipos_unidad where organization_id = org1 and nombre = 'Compactador'), 8000, 'Volvo', 'FL', 2020)
  returning id into u1;
  insert into public.unidades (organization_id, placa, tipo_unidad_id, capacidad_kg, marca, modelo, anio)
  values (org1, 'XYZ-789', (select id from public.tipos_unidad where organization_id = org1 and nombre = 'Furgón'), 3500, 'Hino', 'Dutro', 2018)
  returning id into u2;

  insert into public.documentos_unidad (organization_id, unidad_id, tipo, numero, fecha_emision, fecha_vencimiento)
  values
    (org1, u1, 'soat', 'SOAT-000111', current_date - 200, current_date + 165),
    (org1, u1, 'revision_tecnica', 'RT-2026-555', current_date - 100, current_date + 265),
    (org1, u2, 'soat', 'SOAT-000222', current_date - 380, current_date - 15);  -- vencido (para la Fase 3)

  insert into public.choferes (organization_id, nombres, apellidos, dni, telefono, licencia_numero, licencia_categoria, licencia_vencimiento, profile_id)
  values (org1, 'Pedro', 'Huamán Soto', '40123456', '987654321', 'Q40123456', 'A-IIIb', current_date + 400,
          (select id from public.profiles where email = 'chofer@ecoruta.test'))
  returning id into ch1;
  insert into public.choferes (organization_id, nombres, apellidos, dni, telefono, licencia_numero, licencia_categoria, licencia_vencimiento)
  values (org1, 'Luis', 'Ramos Vega', '41234567', '912345678', 'Q41234567', 'A-IIb', current_date + 20);

  insert into public.capacitaciones (organization_id, chofer_id, nombre, fecha, vencimiento)
  values (org1, ch1, 'Manejo de residuos peligrosos', current_date - 60, current_date + 305);

  insert into public.destinos (organization_id, nombre, tipo, autorizacion, direccion)
  values
    (org1, 'Relleno de Seguridad Demo Sur', 'relleno_seguridad', 'RS-DEMO-001', 'Km 40 Panamericana Sur'),
    (org1, 'Planta de Valorización Demo Norte', 'planta_valorizacion', 'PV-DEMO-002', 'Av. Los Reciclajes 100, Carabayllo');

  insert into public.tarifas (organization_id, cliente_id, tipo_residuo_id, modalidad, precio_con_igv)
  values
    (org1, cli_andinas, (select id from public.tipos_residuo where organization_id = org1 and codigo = 'GEN'), 'por_kg', 0.45),
    (org1, cli_andinas, (select id from public.tipos_residuo where organization_id = org1 and codigo = 'ACE'), 'por_servicio', 350.00),
    (org1, cli_pacifico, (select id from public.tipos_residuo where organization_id = org1 and codigo = 'ORG'), 'por_viaje', 280.00);
end $$;
