-- Datos iniciales (ejecutar DESPUÉS de 001_schema.sql).
-- Los usuarios demo (1 admin, 1 supervisor, 3 trabajadores) se crean con: node scripts/seed-users.mjs
insert into public.areas (nombre, descripcion) values
  ('Operaciones', 'Planta y producción'),
  ('Almacén', 'Logística y almacenamiento')
on conflict (nombre) do nothing;

insert into public.epp_catalogo (nombre, categoria, descripcion, vida_util_dias, stock_disponible) values
  ('Casco de seguridad', 'Cabeza', 'Casco dieléctrico clase E', 1095, 40),
  ('Botas de seguridad', 'Pies', 'Punta de acero, suela antideslizante', 365, 30),
  ('Chaleco reflectivo', 'Cuerpo', 'Alta visibilidad clase 2', 365, 60),
  ('Guantes de nitrilo', 'Manos', 'Resistentes a químicos', 90, 200),
  ('Lentes de seguridad', 'Ojos', 'Antiempañantes, policarbonato', 365, 80),
  ('Protector auditivo', 'Oídos', 'Tapones / orejeras NRR 25', 180, 100),
  ('Respirador N95', 'Respiratorio', 'Filtro de partículas', 30, 150),
  ('Arnés de seguridad', 'Altura', 'Arnés de 4 puntos', 730, 15);

insert into public.configuracion_sistema (clave, valor, descripcion) values
  ('horario_laboral', '{"hora_entrada":"08:00","hora_salida":"17:00","tolerancia_min":10,"zona_horaria":"America/Lima"}', 'Horario y tolerancia para marcar tardanza'),
  ('alertas_vencimiento', '{"epp_dias_antes":15,"revision_medica_dias_antes":30}', 'Días de anticipación para alertas de vencimiento'),
  ('organizacion', '{"nombre":"Mi Empresa S.A.C."}', 'Datos generales de la organización')
on conflict (clave) do nothing;
