# SST 360 · Guía exacta de puesta en marcha

Tiempo estimado: 45–60 min. Todo con planes gratuitos (Supabase, Vercel, Expo).

## 0. Qué necesitas
- **Node.js 20 o superior** (nodejs.org) y **Git**.
- Cuentas gratis: **Supabase**, **GitHub**, **Vercel**, **Expo** (expo.dev).
- Un celular Android (o el emulador) y la app **Expo Go** para pruebas rápidas.

Descomprime el ZIP. Todos los comandos se ejecutan desde la carpeta `sst-360/`.

---

## 1. Base de datos en Supabase
1. En supabase.com → **New project**. Elige región cercana (ej. *South America – São Paulo*) y guarda la contraseña de la BD.
2. Cuando termine de crearse: **SQL Editor → New query**. Pega TODO el contenido de `supabase/migrations/001_schema.sql` → **Run**. Debe decir *Success*.
   (Crea 15 tablas, triggers, políticas RLS, 4 buckets de Storage y Realtime.)
3. Nueva query: pega TODO `supabase/migrations/002_registro_con_aprobacion.sql` → **Run**. (Activa el registro con aprobación del administrador y cierra el acceso a cuentas pendientes.) **Siempre después del 001.**
4. Nueva query: pega `supabase/seed.sql` → **Run** (2 áreas, catálogo de EPP y configuración de horario). Ejecútalo **una sola vez**.
5. **Authentication → Providers → Email**: deja *Email* activo y **“Allow new users to sign up” ACTIVADO** (es lo que permite que cada persona cree su cuenta desde la app).
   - **Desactiva “Confirm email”** (recomendado): como el administrador aprueba cada cuenta, no hace falta confirmar el correo, y evitas el límite de correos del plan gratis. Si lo dejas activo, la persona recibirá un enlace antes de poder iniciar sesión.
   - Opcional pero recomendable en producción: **Authentication → Attack Protection → CAPTCHA** para frenar registros basura.
6. **Project Settings → API**: copia
   - `Project URL` → será `…SUPABASE_URL`
   - `anon public` key → `…ANON_KEY`
   - `service_role` key → **solo servidor, nunca en la app ni en GitHub público**.

### Crear usuarios
**Opción A – demo (recomendada para probar):**
```bash
cd scripts
npm install
# Windows PowerShell:
$env:SUPABASE_URL="https://TU-PROYECTO.supabase.co"; $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."; node seed-users.mjs
# Mac/Linux:
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node seed-users.mjs
cd ..
```
Crea: `admin@sst360.test`, `supervisor@sst360.test`, `juan@`, `maria@`, `luis@sst360.test` (clave **Sst360!Demo**), con EPP, capacitaciones y revisiones de ejemplo. Los trabajadores también entran con su ID (`88402`, `88403`, `88404`).

**Opción B – producción (tu propio admin):** Authentication → Users → *Add user* (con correo y clave; queda como *pendiente*) y luego en SQL Editor:
```sql
update public.profiles set rol='administrador', activo=true, estado_cuenta='aprobado', nombre_completo='Tu Nombre' where email='tu@correo.com';
```
Desde ahí crea al resto en la web (Usuarios y Roles). **Borra los usuarios demo antes de salir a producción.**

### Cómo se dan de alta las personas (dos caminos)
1. **Autorregistro (nuevo):** la persona abre la app → **Crear cuenta** (nombre, ID de trabajador, correo, contraseña). Queda **pendiente** y solo ve la pantalla “Cuenta pendiente de aprobación”. El administrador recibe una notificación, entra a la web → **Cuentas pendientes** (aparece con un contador rojo en el menú), elige **rol, área y supervisor** y pulsa **Aprobar y activar**. La app del usuario se actualiza sola en unos segundos. También puede **Rechazar** (y luego re-aprobar desde la pestaña *Rechazadas*).
2. **Alta directa por el administrador:** Web → Trabajadores / Usuarios y Roles → **Nuevo**. Queda activo al instante.

---

## 2. Panel web (local)
```bash
cd apps/web
cp .env.example .env.local      # Windows: copy .env.example .env.local
```
Edita `.env.local` con las 3 variables. Luego:
```bash
npm install
npm run dev                      # http://localhost:3000
```
Entra con `admin@sst360.test`. Un trabajador que intente entrar verá: *“Acceso exclusivo para administradores y supervisores…”*.

## 3. App móvil (local)
```bash
cd apps/mobile
cp .env.example .env
npm install
npx expo install --fix           # alinea versiones con tu SDK de Expo (importante)
npx expo start
```
Escanea el QR con Expo Go. Prueba con `juan@sst360.test` (tema claro) y `supervisor@sst360.test` (oscuro).
> Expo Go solo abre proyectos del SDK vigente. Si tu Expo Go es más nuevo/viejo, `npx expo install --fix` y `npx expo-doctor` te dicen qué ajustar. Si prefieres, usa el APK del paso 5.

**Mapa en asistencia (opcional):** en iOS funciona directo. En Android crea una llave *Maps SDK for Android* en Google Cloud, ponla en `EXPO_PUBLIC_GOOGLE_MAPS_KEY` y reconstruye. Sin llave se muestran las coordenadas con enlace a Google Maps (no se rompe nada).

---

## 4. Publicar la web (GitHub + Vercel)
1. Crea un repositorio **privado** en GitHub y sube el proyecto:
   ```bash
   git init && git add . && git commit -m "SST 360"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/sst360.git
   git push -u origin main
   ```
   (`.env` y `.env.local` ya están en `.gitignore`.)
2. vercel.com → **Add New → Project** → importa el repo → **Root Directory = `apps/web`** → Framework: Next.js.
3. **Environment Variables** (las 3): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. → **Deploy**.
4. Copia la URL (ej. `https://sst360-admin.vercel.app`) y en Supabase → **Authentication → URL Configuration**:
   - **Site URL**: tu URL de Vercel
   - **Redirect URLs**: `http://localhost:3000/**`, `https://*.vercel.app/**`, `sst360://**`
Cada `git push` a `main` redespliega automáticamente.

## 5. APK para Android (EAS Build)
1. Edita `apps/mobile/eas.json` → bloque `preview.env`: pega tu URL y ANON KEY (son públicas por diseño).
2. ```bash
   npm install -g eas-cli
   cd apps/mobile
   eas login
   eas init                         # crea el proyecto en Expo y enlaza el projectId
   eas build -p android --profile preview
   ```
3. Al terminar (10–20 min) Expo te da un **enlace y QR** para descargar el `.apk` e instalarlo (activa “instalar apps desconocidas”).
4. Play Store / iOS: `eas build -p android --profile production` (AAB) y `eas submit`. iOS requiere cuenta Apple Developer.

---

## 6. Las 5 pruebas de punta a punta
| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Web (admin): Trabajadores → *Nuevo* (con correo, clave, área y supervisor) | El trabajador inicia sesión en la app y ve el tema claro |
| 2 | App trabajador: *Registrar asistencia* (foto + GPS) | Aparece en la app del supervisor (detalle del trabajador) y en Web → Registros → Asistencias |
| 3 | App trabajador: *Solicitar EPP* + *Reportar riesgo* con foto | Supervisor recibe notificación, aprueba / cambia estado; el trabajador ve la barra de progreso actualizada |
| 4 | Web: Documentos → subir PDF | Aparece en la app del trabajador (Documentos) |
| 5 | Chat entre trabajador, supervisor y admin (app y web) | Mensajes llegan en tiempo real |
| 6 | App: **Crear cuenta** con datos nuevos → Web (admin): Cuentas pendientes → Aprobar con área y supervisor | La app pasa de “Cuenta pendiente” a la pantalla del trabajador sin reinstalar |

---

## 7. Cobertura de los 53 requerimientos
| Rol | RF | Dónde está |
|---|---|---|
| Trabajador | T01, T15 | `app/(auth)/login.tsx`, `app/(auth)/registro.tsx` (crear cuenta), `app/pendiente.tsx`, Perfil → Cerrar sesión |
| | T02 | `app/worker/index.tsx` |
| | T03 / T04 | `app/asistencia.tsx` (cámara + GPS) / `app/historial.tsx` |
| | T05, T06, T14 | `app/worker/epp.tsx`, `app/solicitar-epp.tsx` |
| | T07, T08 | `app/reportar.tsx` |
| | T09, T10 | `app/worker/capacitaciones.tsx` |
| | T11 | `app/notificaciones.tsx` (+ realtime) |
| | T12 | `app/documentos.tsx` |
| | T13 | `components/shared-screens.tsx` (PerfilScreen) |
| | T16 | `app/worker/mensajes.tsx`, `app/chat/[id].tsx` |
| Supervisor | S01, S16 | login / Perfil |
| | S02, S03 | `app/supervisor/index.tsx` |
| | S04, S05, S12 | `app/trabajador/[id].tsx` |
| | S06 | `app/solicitud/[id].tsx` |
| | S07, S08, S09 | `components/sup-screens.tsx` (Validar), `app/reporte/[id].tsx` |
| | S10 | `app/gestion-capacitaciones.tsx` |
| | S11, S14, S15 | `components/sup-screens.tsx` (Indicadores, compartir reporte) |
| | S13 | `app/notificaciones.tsx` |
| | S17 | `app/supervisor/mensajes.tsx` |
| Administrador | A01, A19 | Web `/login`, cerrar sesión en barra lateral; app móvil |
| | A02, A15 | Web `/dashboard`, `/dashboard/reportes`; app `app/admin/index.tsx` |
| | A03, A04, A17 | Web `/dashboard/usuarios` (+ `/api/admin/users`) y `/dashboard/pendientes` (aprobación de cuentas) |
| | A05, A06, A07 | Web `/trabajadores`, `/supervisores`, `/areas` |
| | A08 | Web `/epp` (catálogo, stock, asignaciones, solicitudes) |
| | A09, A10 | Web `/capacitaciones`, `/revisiones` |
| | A11 | Web `/registros` |
| | A12 | Web `/notificaciones` (avisos globales, por área o rol) |
| | A13 | Web `/documentos` |
| | A14 | Web `/reportes` (CSV/Excel + imprimir/PDF) |
| | A16 | Web `/configuracion` |
| | A18 | Web `/mensajes` |
| | A20 | Web `/subestandar` |

## 8. Decisiones técnicas y límites (léelo)
- **Probado:** revisé la sintaxis de todo el código y la coherencia entre tablas, políticas y pantallas, pero **no pude ejecutar `npm install`/build ni correr la app** en mi entorno (sin red). Es normal que en el primer arranque aparezca algún ajuste de versiones: usa `npx expo install --fix` y `npx expo-doctor`; si algo falla, pega el error aquí y lo corregimos.
- **Cambios frente al documento técnico:** la app móvil usa `StyleSheet` con los mismos tokens de color (en lugar de NativeWind) y `@expo/vector-icons` (en lugar de lucide); la web usa componentes Tailwind propios (sin shadcn/ui CLI) y sin zod/react-hook-form; las pantallas móviles viven en `app/worker`, `app/supervisor`, `app/admin` (Expo Router no permite el mismo `index` en varios grupos). Los tipos/colores compartidos están en `packages/shared` y se copian a las apps con `npm run sync` (evita problemas de workspaces).
- **Seguridad:** las cuentas autorregistradas nacen *pendientes e inactivas* y no pueden leer ni insertar nada hasta que un administrador las apruebe (políticas RLS con `is_active()`); el rol nunca se toma de datos que envía el usuario. El rol se guarda en `app_metadata` (solo servidor); un usuario no puede cambiar su rol/área/supervisor; la hora de asistencia y la tardanza se calculan en el servidor; fotos y evidencias son privadas con URL firmadas. El directorio de `profiles` es legible por usuarios autenticados (necesario para el chat). El login por ID usa `email_por_codigo` y el registro usa `codigo_disponible` (ambas permiten saber si un ID existe; si no lo quieres, elimínalas y usa solo correo). Si alguien abusa del registro, activa CAPTCHA en Supabase.
- **No incluido:** notificaciones *push* con la app cerrada (las alertas son en tiempo real con la app abierta; push requiere `expo-notifications` + FCM), recuperación de contraseña por correo (sí puede restablecerse desde Supabase → Authentication), modo sin conexión, regeneración de tipos (`npx supabase gen types typescript --project-id XXXX > database.types.ts`).
- Edición de usuarios: no cambia correo ni contraseña de otros (hazlo desde Supabase → Authentication). Para “eliminar” un usuario, desactívalo.

## 9. Problemas frecuentes
| Síntoma | Solución |
|---|---|
| `permission denied` / lista vacía | Falta ejecutar `001_schema.sql` completo o el usuario no tiene perfil/área/supervisor asignado |
| Supervisor no ve trabajadores | El trabajador debe tener `supervisor_id` = ese supervisor o la misma área |
| Login web de trabajador rebota | Es lo esperado (solo admin/supervisor) |
| El usuario nuevo se queda en “Cuenta pendiente” | Falta que el admin la apruebe en Web → Cuentas pendientes |
| Crear cuenta dice “Revisa tu correo” | Tienes *Confirm email* activo en Supabase (paso 1.5); desactívalo o confirma el correo |
| Crear cuenta falla con “Database error” | No ejecutaste `002_registro_con_aprobacion.sql` |
| Mi primer admin creado en el panel de Supabase queda “pendiente” | Ejecuta el `update` de la Opción B (incluye `activo=true, estado_cuenta='aprobado'`) |
| Foto/ubicación no se guardan | Concede permisos de cámara y ubicación; revisa que existan los buckets (SQL paso 1.2) |
| Crear usuario falla en Vercel | Falta `SUPABASE_SERVICE_ROLE_KEY` en Vercel (y redeploy) |
| Expo Go no abre el proyecto | `npx expo install --fix`; o usa el APK (paso 5) |
