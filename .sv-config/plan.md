# Stock Vision — Autenticación, Roles y Protección de Rutas

Agregar autenticación real (email + contraseña), control de roles (Administrador / Operador), bloqueo por intentos fallidos y protección de rutas. Toda la funcionalidad actual (Inventario, Carga, Predictivo, Reportes) se conserva intacta.

## Backend — Supabase

Habilito Supabase (Supabase administrado). Razón: bcrypt, unicidad de email, conteo de intentos fallidos y bloqueo de 15 min requieren persistencia server-side. Supabase Auth ya hace hashing seguro de contraseñas (bcrypt) y unicidad de email — no se almacenan contraseñas en texto plano nunca.

### Esquema

- `profiles` (id uuid PK → auth.users, full_name text, created_at) — auto-creado por trigger en signup.
- `user_roles` (id, user_id uuid, role app_role enum) con enum `app_role` = `'administrador' | 'operador'`. Tabla separada (anti-escalada de privilegios). Función `has_role(uuid, app_role)` SECURITY DEFINER para usar en RLS.
- `auth_attempts` (email text, failed_count int, locked_until timestamptz, last_attempt timestamptz). Server fn `recordFailedAttempt` / `checkLockout` / `clearAttempts`.

RLS:
- `profiles`: el usuario lee/edita el suyo; admin lee todos.
- `user_roles`: lectura propia + admin lectura/escritura.
- `auth_attempts`: solo service role (gestionado por server fns).

GRANTs explícitos en todas las tablas (`authenticated`, `service_role`).

## Server functions (`src/lib/auth.functions.ts`)

- `checkLockout({ email })` → admin client: si `locked_until > now`, devuelve `{ locked: true, minutesLeft }`.
- `signIn({ email, password })`:
  1. `checkLockout`. Si bloqueado → error.
  2. Llama `supabase.auth.signInWithPassword`.
  3. Falla → `recordFailedAttempt` (incrementa; al 5º intento `locked_until = now + 15 min`).
  4. Éxito → `clearAttempts` + devuelve sesión.
- `signUp({ email, password, fullName, role })` (solo admin puede asignar rol Operador desde gestión; primer signup público crea Operador por defecto).
- Trigger SQL `handle_new_user` crea `profiles` + asigna rol por defecto `operador`.

## Frontend

### Rutas nuevas
- `src/routes/auth.tsx` — login + tab de registro. Logo StockVision, campos email/password, errores inline ("Credenciales inválidas", "Cuenta bloqueada por 15 min", contador). Validación live de contraseña en registro con checkmarks: ≥8, mayúscula, minúscula, número, especial.
- `src/routes/_authenticated/route.tsx` — gate manejado por la integración (`ssr: false`, redirige a `/auth`).

### Reorganización de rutas existentes
Mover a subtree protegido:
- `inventario.tsx` → `_authenticated/inventario.tsx`
- `carga.tsx` → `_authenticated/carga.tsx`
- `predictivo.tsx` → `_authenticated/predictivo.tsx`
- `reportes.tsx` → `_authenticated/reportes.tsx`
- `index.tsx` redirige a `/inventario` (sigue protegido por el gate).

Contenido de archivos sin cambios — solo se moverán y se actualizarán los `createFileRoute("/...")`.

### RBAC en UI
- `useCurrentUser()` hook lee perfil + rol vía server fn `getMe` (`requireSupabaseAuth`).
- `AppShell`:
  - Sidebar filtra entradas según rol. Operador ve solo **Inventario** (lectura + movimientos) y un nuevo botón "Registrar movimiento". Oculta **Carga de Datos**, **Predictivo**, **Reportes**.
  - Avatar dropdown arriba a la derecha: nombre, badge de rol (verde Administrador / azul Operador), botón "Cerrar sesión" que hace `signOut` + limpia caché + navega a `/auth`.
- Gate a nivel ruta para acciones admin: `_authenticated/predictivo.tsx` y `_authenticated/reportes.tsx` muestran 403 si rol ≠ admin (defensa en profundidad además del filtrado del sidebar).
- Inventario en modo Operador: deshabilita botones de editar stock mínimo (solo lectura) pero permite la subhoja "Registrar movimiento" (entrada/salida) que actualiza el stock actual.

### Diseño login
- Layout split: lado izquierdo gradient navy → primary con logo grande y tagline "Inventario inteligente para Pymes". Lado derecho card blanca con formulario.
- Tabs "Iniciar sesión" / "Crear cuenta".
- Checklist de contraseña con `Check` verde / `X` gris animado.
- Mensajes de error en banner rojo sutil arriba del form.

## Wiring

- `__root.tsx`: agrega `onAuthStateChange` (filtrado SIGNED_IN/OUT/USER_UPDATED) → `router.invalidate()` + `queryClient.invalidateQueries()` (salvo SIGNED_OUT).
- `src/start.ts`: verificar que `attachSupabaseAuth` esté en `functionMiddleware` (lo añade la integración).
- Toasts con `sonner` para feedback (login exitoso, cuenta bloqueada, etc.).

## Resumen de archivos

Nuevos:
- `src/routes/auth.tsx`
- `src/lib/auth.functions.ts`
- `src/lib/use-current-user.ts`
- `src/components/password-checklist.tsx`
- `src/components/user-menu.tsx`
- migración SQL (profiles, user_roles, auth_attempts, trigger, RLS, grants)

Editados:
- `src/components/app-shell.tsx` (filtrado por rol + user menu)
- `src/routes/__root.tsx` (auth listener)
- `src/routes/index.tsx` (sigue redirigiendo)
- 4 rutas movidas a `_authenticated/`

¿Procedo a implementarlo así?
