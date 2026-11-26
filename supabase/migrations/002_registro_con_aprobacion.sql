-- =====================================================================
-- SST 360 · Registro de cuentas con aprobación del administrador
-- Ejecutar DESPUÉS de 001_schema.sql (SQL Editor → New query → Run). Es seguro re-ejecutarlo.
-- =====================================================================

-- 1) Estado de la cuenta
alter table public.profiles
  add column if not exists estado_cuenta text not null default 'aprobado'
  check (estado_cuenta in ('pendiente','aprobado','rechazado'));
create index if not exists profiles_estado_cuenta_idx on public.profiles(estado_cuenta);

-- 2) Usuario activo (las cuentas pendientes/rechazadas NO lo son)
create or replace function public.is_active() returns boolean
language sql stable as $$ select public.get_my_role() is not null $$;

-- 3) Alta de usuarios:
--    · Creado por el administrador (API con service_role → app_metadata.rol presente) → activo y aprobado.
--    · Autorregistro desde la app (sin app_metadata.rol) → PENDIENTE e inactivo, rol trabajador.
--    El rol jamás se toma de user_metadata (editable por el usuario).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare r text := new.raw_app_meta_data->>'rol'; pend boolean; nom text; cod text; a record;
begin
  if r is not null and r not in ('trabajador','supervisor','administrador') then r := 'trabajador'; end if;
  pend := (r is null);
  nom := coalesce(nullif(trim(new.raw_user_meta_data->>'nombre_completo'), ''), split_part(new.email, '@', 1));
  cod := nullif(trim(new.raw_user_meta_data->>'codigo_trabajador'), '');
  begin
    insert into public.profiles (id, nombre_completo, email, rol, codigo_trabajador, activo, estado_cuenta)
    values (new.id, nom, new.email, coalesce(r, 'trabajador'), cod, not pend, case when pend then 'pendiente' else 'aprobado' end)
    on conflict (id) do nothing;
  exception when unique_violation then   -- ID de trabajador repetido: se crea sin ID y el admin lo corrige
    insert into public.profiles (id, nombre_completo, email, rol, codigo_trabajador, activo, estado_cuenta)
    values (new.id, nom, new.email, coalesce(r, 'trabajador'), null, not pend, case when pend then 'pendiente' else 'aprobado' end)
    on conflict (id) do nothing;
  end;
  if pend then
    for a in select id from public.profiles where rol = 'administrador' and activo loop
      perform public.notify(a.id, 'Nueva solicitud de cuenta', nom || ' solicita acceso a SST 360', 'alerta', new.id);
    end loop;
  end if;
  return new;
end $$;

-- 4) Un usuario no puede cambiar su propio estado de cuenta, rol, área, etc.
create or replace function public.protect_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and coalesce(public.get_my_role(), '') <> 'administrador' then
    new.rol := old.rol; new.area_id := old.area_id; new.supervisor_id := old.supervisor_id;
    new.activo := old.activo; new.codigo_trabajador := old.codigo_trabajador; new.email := old.email;
    new.estado_cuenta := old.estado_cuenta;
  end if;
  return new;
end $$;

-- 5) Funciones públicas para la pantalla de registro / login por ID
create or replace function public.codigo_disponible(p_codigo text) returns boolean
language sql stable security definer set search_path = public as
$$ select not exists (select 1 from public.profiles where lower(codigo_trabajador) = lower(trim(p_codigo))) $$;
grant execute on function public.codigo_disponible(text) to anon, authenticated;

create or replace function public.email_por_codigo(p_codigo text) returns text
language sql stable security definer set search_path = public as
$$ select email from public.profiles where lower(codigo_trabajador) = lower(trim(p_codigo)) limit 1 $$;
grant execute on function public.email_por_codigo(text) to anon, authenticated;

-- 6) Las cuentas pendientes no ven NADA de la organización ni pueden insertar registros
drop policy if exists "areas_read" on public.areas;
create policy "areas_read" on public.areas for select to authenticated using (public.is_active());
drop policy if exists "epp_catalogo_read" on public.epp_catalogo;
create policy "epp_catalogo_read" on public.epp_catalogo for select to authenticated using (public.is_active());
drop policy if exists "config_read" on public.configuracion_sistema;
create policy "config_read" on public.configuracion_sistema for select to authenticated using (public.is_active());
drop policy if exists "cap_read" on public.capacitaciones;
create policy "cap_read" on public.capacitaciones for select to authenticated using (public.is_active());
drop policy if exists "documentos_read" on public.documentos_sst;
create policy "documentos_read" on public.documentos_sst for select to authenticated using (
  public.is_active() and (visible_para = 'todos'
    or area_id = (select area_id from public.profiles where id = auth.uid()) or public.is_staff()));
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_active());

drop policy if exists "asist_worker_insert" on public.asistencias;
create policy "asist_worker_insert" on public.asistencias for insert to authenticated with check (trabajador_id = auth.uid() and public.is_active());
drop policy if exists "epp_sol_worker_insert" on public.epp_solicitudes;
create policy "epp_sol_worker_insert" on public.epp_solicitudes for insert to authenticated
  with check (trabajador_id = auth.uid() and estado = 'enviado' and public.is_active());
drop policy if exists "rep_worker_insert" on public.reportes_subestandar;
create policy "rep_worker_insert" on public.reportes_subestandar for insert to authenticated
  with check (trabajador_id = auth.uid() and estado = 'pendiente' and public.is_active());
drop policy if exists "msg_insert" on public.mensajes;
create policy "msg_insert" on public.mensajes for insert to authenticated with check (remitente_id = auth.uid() and public.is_active());
drop policy if exists "fotos_insert_own" on storage.objects;
create policy "fotos_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id in ('asistencias-fotos','reportes-evidencias') and (storage.foldername(name))[1] = auth.uid()::text and public.is_active());
