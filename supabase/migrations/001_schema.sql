-- =====================================================================
-- SST 360 · Esquema completo (15 tablas) · Supabase / PostgreSQL
-- Ejecutar completo en: Supabase → SQL Editor → New query → Run
-- =====================================================================
create extension if not exists "pgcrypto";

-- ---------- Utilidades ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ---------- 1. areas ----------
create table public.areas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  descripcion text,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- 2. profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre_completo text not null default '',
  codigo_trabajador text unique,
  email text,
  telefono text,
  rol text not null default 'trabajador' check (rol in ('trabajador','supervisor','administrador')),
  area_id uuid references public.areas(id) on delete set null,
  supervisor_id uuid references public.profiles(id) on delete set null,
  avatar_url text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.profiles(rol);
create index on public.profiles(supervisor_id);
create index on public.profiles(area_id);

-- ---------- Funciones auxiliares de seguridad (SECURITY DEFINER evita recursión RLS) ----------
create or replace function public.get_my_role() returns text
language sql stable security definer set search_path = public as
$$ select rol from public.profiles where id = auth.uid() and activo $$;

create or replace function public.is_my_worker(w uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles t, public.profiles me
    where t.id = w and me.id = auth.uid() and me.activo and me.rol = 'supervisor'
      and (t.supervisor_id = me.id or (me.area_id is not null and t.area_id = me.area_id))
  ) $$;

create or replace function public.is_staff() returns boolean
language sql stable as $$ select coalesce(public.get_my_role() in ('supervisor','administrador'), false) $$;

-- Login por código de trabajador (devuelve el email para iniciar sesión con Auth)
create or replace function public.email_por_codigo(p_codigo text) returns text
language sql stable security definer set search_path = public as
$$ select email from public.profiles where lower(codigo_trabajador) = lower(p_codigo) and activo limit 1 $$;
grant execute on function public.email_por_codigo(text) to anon, authenticated;

-- ---------- Trigger: crear perfil al registrarse ----------
-- El ROL se lee de raw_app_meta_data (solo modificable desde el servidor con service_role).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nombre_completo, email, rol, codigo_trabajador)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'nombre_completo', split_part(new.email,'@',1)),
          new.email,
          coalesce(new.raw_app_meta_data->>'rol','trabajador'),
          nullif(new.raw_user_meta_data->>'codigo_trabajador',''))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Un usuario NO puede cambiar campos sensibles de su propio perfil
create or replace function public.protect_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and coalesce(public.get_my_role(),'') <> 'administrador' then
    new.rol := old.rol; new.area_id := old.area_id; new.supervisor_id := old.supervisor_id;
    new.activo := old.activo; new.codigo_trabajador := old.codigo_trabajador; new.email := old.email;
  end if;
  return new;
end $$;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile();

-- ---------- 3. asistencias ----------
create table public.asistencias (
  id uuid primary key default gen_random_uuid(),
  trabajador_id uuid not null references public.profiles(id) on delete cascade,
  tipo text not null check (tipo in ('entrada','salida')),
  fecha_hora timestamptz not null default now(),
  foto_url text,
  latitud double precision,
  longitud double precision,
  direccion_texto text,
  estado text not null default 'puntual' check (estado in ('puntual','tardanza')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.asistencias(trabajador_id, fecha_hora desc);

-- ---------- 4. epp_catalogo ----------
create table public.epp_catalogo (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text,
  descripcion text,
  vida_util_dias int not null default 365,
  stock_disponible int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- 5. epp_asignaciones ----------
create table public.epp_asignaciones (
  id uuid primary key default gen_random_uuid(),
  trabajador_id uuid not null references public.profiles(id) on delete cascade,
  epp_id uuid not null references public.epp_catalogo(id) on delete restrict,
  fecha_asignacion date not null default current_date,
  fecha_vencimiento date,
  estado text not null default 'asignado' check (estado in ('asignado','vencido','devuelto')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.epp_asignaciones(trabajador_id);

-- ---------- 6. epp_solicitudes ----------
create table public.epp_solicitudes (
  id uuid primary key default gen_random_uuid(),
  trabajador_id uuid not null references public.profiles(id) on delete cascade,
  epp_id uuid not null references public.epp_catalogo(id) on delete restrict,
  tipo_solicitud text not null check (tipo_solicitud in ('nuevo','reposicion','cambio')),
  motivo text,
  estado text not null default 'enviado' check (estado in ('enviado','en_revision','aprobado','rechazado')),
  revisado_por uuid references public.profiles(id) on delete set null,
  comentario_revision text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.epp_solicitudes(trabajador_id);
create index on public.epp_solicitudes(estado);

-- ---------- 7. reportes_subestandar ----------
create table public.reportes_subestandar (
  id uuid primary key default gen_random_uuid(),
  trabajador_id uuid not null references public.profiles(id) on delete cascade,
  area_id uuid references public.areas(id) on delete set null,
  tipo text not null default 'condicion' check (tipo in ('accion','condicion')),
  categoria text,
  severidad text not null default 'leve' check (severidad in ('leve','moderado','critico')),
  descripcion text not null,
  evidencias_urls text[] not null default '{}',
  estado text not null default 'pendiente' check (estado in ('pendiente','en_proceso','cerrado')),
  supervisor_id uuid references public.profiles(id) on delete set null,
  observaciones_cierre text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.reportes_subestandar(trabajador_id);
create index on public.reportes_subestandar(estado, severidad);

-- ---------- 8. capacitaciones ----------
create table public.capacitaciones (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  fecha_programada timestamptz not null,
  area_id uuid references public.areas(id) on delete set null,
  creado_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- 9. capacitacion_asistentes ----------
create table public.capacitacion_asistentes (
  id uuid primary key default gen_random_uuid(),
  capacitacion_id uuid not null references public.capacitaciones(id) on delete cascade,
  trabajador_id uuid not null references public.profiles(id) on delete cascade,
  estado text not null default 'inscrito' check (estado in ('inscrito','completado','pendiente','ausente')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (capacitacion_id, trabajador_id)
);
create index on public.capacitacion_asistentes(trabajador_id);

-- ---------- 10. revisiones_medicas ----------
create table public.revisiones_medicas (
  id uuid primary key default gen_random_uuid(),
  trabajador_id uuid not null references public.profiles(id) on delete cascade,
  tipo_examen text not null,
  fecha_programada date not null,
  estado text not null default 'programado' check (estado in ('programado','pendiente','realizado')),
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.revisiones_medicas(trabajador_id);

-- ---------- 11. documentos_sst ----------
create table public.documentos_sst (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria text,
  archivo_url text not null,            -- ruta dentro del bucket documentos-sst
  tamano_bytes bigint,
  version text not null default '1.0',
  visible_para text not null default 'todos' check (visible_para in ('todos','area')),
  area_id uuid references public.areas(id) on delete set null,
  subido_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- 12. notificaciones ----------
create table public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.profiles(id) on delete cascade,
  titulo text not null,
  mensaje text,
  tipo text not null default 'info' check (tipo in ('alerta','info','aprobacion','capacitacion','medica')),
  leida boolean not null default false,
  referencia_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.notificaciones(usuario_id, leida, created_at desc);

-- ---------- 13. mensajes ----------
create table public.mensajes (
  id uuid primary key default gen_random_uuid(),
  remitente_id uuid not null references public.profiles(id) on delete cascade,
  destinatario_id uuid not null references public.profiles(id) on delete cascade,
  contenido text not null check (length(contenido) > 0),
  leido boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.mensajes(remitente_id, destinatario_id, created_at desc);
create index on public.mensajes(destinatario_id, leido);

-- ---------- 14. observaciones_sst ----------
create table public.observaciones_sst (
  id uuid primary key default gen_random_uuid(),
  trabajador_id uuid not null references public.profiles(id) on delete cascade,
  supervisor_id uuid not null references public.profiles(id) on delete cascade,
  nota text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.observaciones_sst(trabajador_id);

-- ---------- 15. configuracion_sistema ----------
create table public.configuracion_sistema (
  clave text primary key,
  valor jsonb not null,
  descripcion text,
  actualizado_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- updated_at automático en todas las tablas ----------
do $$ declare t text; begin
  foreach t in array array['areas','profiles','asistencias','epp_catalogo','epp_asignaciones','epp_solicitudes',
    'reportes_subestandar','capacitaciones','capacitacion_asistentes','revisiones_medicas','documentos_sst',
    'notificaciones','mensajes','observaciones_sst','configuracion_sistema'] loop
    execute format('create trigger trg_%1$s_updated before update on public.%1$s for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ---------- Asistencia: hora y estado se calculan en el servidor (anti-fraude) ----------
create or replace function public.asistencia_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare cfg jsonb; tz text; limite time;
begin
  new.fecha_hora := now();
  select valor into cfg from public.configuracion_sistema where clave = 'horario_laboral';
  tz := coalesce(cfg->>'zona_horaria','America/Lima');
  limite := coalesce(cfg->>'hora_entrada','08:00')::time
            + make_interval(mins => coalesce((cfg->>'tolerancia_min')::int, 10));
  if new.tipo = 'entrada' and (new.fecha_hora at time zone tz)::time > limite then
    new.estado := 'tardanza';
  else
    new.estado := 'puntual';
  end if;
  return new;
end $$;
create trigger trg_asistencia_before_insert before insert on public.asistencias
  for each row execute function public.asistencia_before_insert();

-- ---------- Notificaciones automáticas (flujos entre roles) ----------
create or replace function public.notify(u uuid, t text, m text, tp text, ref uuid) returns void
language sql security definer set search_path = public as
$$ insert into public.notificaciones(usuario_id,titulo,mensaje,tipo,referencia_id) select u,t,m,tp,ref where u is not null $$;

create or replace function public.trg_solicitud_epp() returns trigger
language plpgsql security definer set search_path = public as $$
declare sup uuid; nom text; eppn text;
begin
  select nombre into eppn from public.epp_catalogo where id = new.epp_id;
  if tg_op = 'INSERT' then
    select coalesce(p.supervisor_id,(select p2.id from public.profiles p2
             where p2.rol='supervisor' and p2.area_id = p.area_id limit 1)), p.nombre_completo
      into sup, nom from public.profiles p where p.id = new.trabajador_id;
    perform public.notify(sup,'Nueva solicitud de EPP', nom||' solicitó: '||coalesce(eppn,'EPP'),'alerta',new.id);
  elsif new.estado is distinct from old.estado and new.estado in ('aprobado','rechazado','en_revision') then
    perform public.notify(new.trabajador_id,
      case new.estado when 'aprobado' then 'Solicitud aprobada' when 'rechazado' then 'Solicitud rechazada' else 'Solicitud en revisión' end,
      'Tu solicitud de '||coalesce(eppn,'EPP')||' fue actualizada.', 'aprobacion', new.id);
  end if;
  return new;
end $$;
create trigger trg_epp_solicitudes_notify after insert or update on public.epp_solicitudes
  for each row execute function public.trg_solicitud_epp();

create or replace function public.trg_reporte() returns trigger
language plpgsql security definer set search_path = public as $$
declare sup uuid; nom text; ar uuid;
begin
  if tg_op = 'INSERT' then
    select coalesce(p.supervisor_id,(select p2.id from public.profiles p2
             where p2.rol='supervisor' and p2.area_id = p.area_id limit 1)), p.nombre_completo, p.area_id
      into sup, nom, ar from public.profiles p where p.id = new.trabajador_id;
    update public.reportes_subestandar set supervisor_id = sup, area_id = coalesce(new.area_id, ar) where id = new.id;
    perform public.notify(sup,
      case when new.severidad='critico' then 'Reporte CRÍTICO' else 'Nuevo reporte subestándar' end,
      nom||': '||left(new.descripcion,80), 'alerta', new.id);
  elsif new.estado is distinct from old.estado then
    perform public.notify(new.trabajador_id,'Tu reporte cambió a: '||new.estado, left(new.descripcion,80),'info',new.id);
  end if;
  return new;
end $$;
create trigger trg_reportes_notify after insert or update on public.reportes_subestandar
  for each row execute function public.trg_reporte();

create or replace function public.trg_capacitacion_asistente() returns trigger
language plpgsql security definer set search_path = public as $$
declare t text; f timestamptz;
begin
  select titulo, fecha_programada into t, f from public.capacitaciones where id = new.capacitacion_id;
  perform public.notify(new.trabajador_id,'Capacitación programada', t||' · '||to_char(f,'DD/MM/YYYY HH24:MI'),'capacitacion',new.capacitacion_id);
  return new;
end $$;
create trigger trg_cap_asist_notify after insert on public.capacitacion_asistentes
  for each row execute function public.trg_capacitacion_asistente();

create or replace function public.trg_revision() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notify(new.trabajador_id,'Revisión médica programada', new.tipo_examen||' · '||to_char(new.fecha_programada,'DD/MM/YYYY'),'medica',new.id);
  return new;
end $$;
create trigger trg_revision_notify after insert on public.revisiones_medicas
  for each row execute function public.trg_revision();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
do $$ declare t text; begin
  foreach t in array array['areas','profiles','asistencias','epp_catalogo','epp_asignaciones','epp_solicitudes',
    'reportes_subestandar','capacitaciones','capacitacion_asistentes','revisiones_medicas','documentos_sst',
    'notificaciones','mensajes','observaciones_sst','configuracion_sistema'] loop
    execute format('alter table public.%I enable row level security', t);
    -- Administrador: acceso total
    execute format($f$create policy "admin_all_%1$s" on public.%1$I for all to authenticated
      using (public.get_my_role() = 'administrador') with check (public.get_my_role() = 'administrador')$f$, t);
  end loop;
end $$;

-- Lectura general (catálogos y directorio para mensajería)
create policy "areas_read" on public.areas for select to authenticated using (true);
create policy "epp_catalogo_read" on public.epp_catalogo for select to authenticated using (true);
create policy "config_read" on public.configuracion_sistema for select to authenticated using (true);
create policy "documentos_read" on public.documentos_sst for select to authenticated using (
  visible_para = 'todos' or area_id = (select area_id from public.profiles where id = auth.uid()) or public.is_staff());
create policy "profiles_read" on public.profiles for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- asistencias
create policy "asist_worker_select" on public.asistencias for select to authenticated using (trabajador_id = auth.uid());
create policy "asist_worker_insert" on public.asistencias for insert to authenticated with check (trabajador_id = auth.uid());
create policy "asist_sup_select" on public.asistencias for select to authenticated using (public.is_my_worker(trabajador_id));

-- EPP asignaciones
create policy "epp_asig_worker" on public.epp_asignaciones for select to authenticated using (trabajador_id = auth.uid());
create policy "epp_asig_sup_select" on public.epp_asignaciones for select to authenticated using (public.is_my_worker(trabajador_id));
create policy "epp_asig_sup_update" on public.epp_asignaciones for update to authenticated
  using (public.is_my_worker(trabajador_id)) with check (public.is_my_worker(trabajador_id));

-- EPP solicitudes
create policy "epp_sol_worker_select" on public.epp_solicitudes for select to authenticated using (trabajador_id = auth.uid());
create policy "epp_sol_worker_insert" on public.epp_solicitudes for insert to authenticated
  with check (trabajador_id = auth.uid() and estado = 'enviado');
create policy "epp_sol_sup_select" on public.epp_solicitudes for select to authenticated using (public.is_my_worker(trabajador_id));
create policy "epp_sol_sup_update" on public.epp_solicitudes for update to authenticated
  using (public.is_my_worker(trabajador_id)) with check (public.is_my_worker(trabajador_id));

-- reportes subestándar
create policy "rep_worker_select" on public.reportes_subestandar for select to authenticated using (trabajador_id = auth.uid());
create policy "rep_worker_insert" on public.reportes_subestandar for insert to authenticated
  with check (trabajador_id = auth.uid() and estado = 'pendiente');
create policy "rep_sup_select" on public.reportes_subestandar for select to authenticated
  using (public.is_my_worker(trabajador_id) or supervisor_id = auth.uid());
create policy "rep_sup_update" on public.reportes_subestandar for update to authenticated
  using (public.is_my_worker(trabajador_id) or supervisor_id = auth.uid())
  with check (public.is_my_worker(trabajador_id) or supervisor_id = auth.uid());

-- capacitaciones
create policy "cap_read" on public.capacitaciones for select to authenticated using (true);
create policy "cap_sup_write" on public.capacitaciones for insert to authenticated with check (public.get_my_role() = 'supervisor');
create policy "cap_sup_update" on public.capacitaciones for update to authenticated
  using (public.get_my_role() = 'supervisor') with check (public.get_my_role() = 'supervisor');
create policy "capas_worker" on public.capacitacion_asistentes for select to authenticated using (trabajador_id = auth.uid());
create policy "capas_sup_select" on public.capacitacion_asistentes for select to authenticated using (public.is_my_worker(trabajador_id));
create policy "capas_sup_insert" on public.capacitacion_asistentes for insert to authenticated with check (public.is_my_worker(trabajador_id));
create policy "capas_sup_update" on public.capacitacion_asistentes for update to authenticated
  using (public.is_my_worker(trabajador_id)) with check (public.is_my_worker(trabajador_id));

-- revisiones médicas
create policy "rev_worker" on public.revisiones_medicas for select to authenticated using (trabajador_id = auth.uid());
create policy "rev_sup_select" on public.revisiones_medicas for select to authenticated using (public.is_my_worker(trabajador_id));
create policy "rev_sup_update" on public.revisiones_medicas for update to authenticated
  using (public.is_my_worker(trabajador_id)) with check (public.is_my_worker(trabajador_id));

-- notificaciones
create policy "notif_own_select" on public.notificaciones for select to authenticated using (usuario_id = auth.uid());
create policy "notif_own_update" on public.notificaciones for update to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy "notif_sup_insert" on public.notificaciones for insert to authenticated
  with check (public.get_my_role() = 'supervisor' and public.is_my_worker(usuario_id));

-- mensajes
create policy "msg_select" on public.mensajes for select to authenticated
  using (remitente_id = auth.uid() or destinatario_id = auth.uid());
create policy "msg_insert" on public.mensajes for insert to authenticated with check (remitente_id = auth.uid());
create policy "msg_update_read" on public.mensajes for update to authenticated
  using (destinatario_id = auth.uid()) with check (destinatario_id = auth.uid());

-- observaciones
create policy "obs_sup_select" on public.observaciones_sst for select to authenticated using (public.is_my_worker(trabajador_id));
create policy "obs_sup_insert" on public.observaciones_sst for insert to authenticated
  with check (supervisor_id = auth.uid() and public.is_my_worker(trabajador_id));

-- =====================================================================
-- STORAGE (buckets + políticas)
-- =====================================================================
insert into storage.buckets (id, name, public) values
  ('asistencias-fotos', 'asistencias-fotos', false),
  ('reportes-evidencias', 'reportes-evidencias', false),
  ('documentos-sst', 'documentos-sst', false),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Convención de rutas: {user_id}/{archivo}
create policy "fotos_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id in ('asistencias-fotos','reportes-evidencias') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos_select" on storage.objects for select to authenticated
  using (bucket_id in ('asistencias-fotos','reportes-evidencias')
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));
create policy "docs_select" on storage.objects for select to authenticated using (bucket_id = 'documentos-sst');
create policy "docs_admin_write" on storage.objects for all to authenticated
  using (bucket_id = 'documentos-sst' and public.get_my_role() = 'administrador')
  with check (bucket_id = 'documentos-sst' and public.get_my_role() = 'administrador');
create policy "avatars_read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_write_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================================
-- REALTIME
-- =====================================================================
alter publication supabase_realtime add table mensajes, notificaciones, epp_solicitudes, reportes_subestandar, asistencias;
