# ENCUADRES-FCQI

Sistema web para la gestión de **encuadres** y **PUAs** (Programas de Unidad de
Aprendizaje) de la Facultad de Ciencias Químicas e Ingeniería (FCQI, UABC).
Permite que capturistas publiquen los PUAs de cada materia, que profesores
concreten un encuadre por grupo, que los alumnos firmen su enterado y
registren avances por tema, y que administradores y lectores supervisen todo
el flujo.

Aplicación Next.js 15 (App Router) apoyada en Supabase (Postgres + Storage) y
NextAuth 4 para la autenticación por correo/contraseña.

---

## Arquitectura

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Navegador (React 19)                        │
│                        Radix UI + Tailwind 4                         │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                            NextAuth 4                                │
│   Login por correo + password (bcryptjs salt 12) → JWT de sesión     │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          middleware.ts                               │
│      Redirige según rol y ruta protegida (admin, profesor, etc.)     │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    app/  —  Next.js 15 App Router                    │
│                                                                      │
│   (auth)/    — login                                                 │
│   (main)/    — layout autenticado, sidebar por rol                   │
│      admin/  capturista/  profesor/  alumno/  lector/                │
│                                                                      │
│   api/       — endpoints REST (usuarios, alumnos, auth)              │
└──────┬──────────────────┬───────────────────┬────────────────────────┘
       │                  │                   │
       │ hooks/*          │ lib/*             │ components/*
       │ (form state)     │ (auth, permisos)  │ (UI + shadcn)
       ▼                  ▼                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        Supabase (BaaS)                               │
│  Postgres (27 tablas) · Auth · Storage bucket "evidencias-encuadre"  │
└──────────────────────────────────────────────────────────────────────┘
```

| Capa               | Responsabilidad                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `app/(auth)/`      | Página pública de login.                                                                    |
| `app/(main)/`      | Layout autenticado, sidebar por rol y páginas por rol (admin/capturista/profesor/alumno/lector). |
| `app/api/`         | Endpoints REST server-side (`/api/auth`, `/api/usuarios`, `/api/alumnos`).                  |
| `middleware.ts`    | Guardia de acceso por rol y ruta.                                                           |
| `components/`      | 26 componentes de UI (shadcn + propios: modales, editores de PUA, tablas, print, etc.).     |
| `hooks/`           | Hooks de formularios y persistencia (`useEncuadreForm`, `useRegistroAvances`, …).           |
| `lib/`             | Utilidades base: cliente Supabase, autenticación, permisos operativos.                      |
| Supabase (externo) | Postgres, Auth y Storage; políticas RLS y triggers.                                         |

Detalle por archivo en [`docs/codigo/codigo.md`](./docs/codigo/codigo.md); detalle de la BD en [`docs/database/bd.md`](./docs/database/bd.md).

---

## Requisitos previos

- **Node.js** ≥ 18.18 (recomendado 20 LTS).
- **npm** ≥ 10 (o `pnpm`, o `yarn`, o `bun` — el repo lleva `pnpm-workspace.yaml`
  y `pnpm-lock.yaml`, así que **pnpm** es el gestor esperado).
- Cuenta de **Supabase** con el schema del proyecto. Alternativa local: seguir
  [`docs/database/bd.md` sección 10](./docs/database/bd.md#10-migración-a-postgres-local) para
  levantar un Postgres self-hosted equivalente.
- Un secreto para NextAuth (cualquier string aleatorio de 32+ caracteres).

---

## Variables de entorno

Copiar `.env.example` como `.env.local` en la raíz y completar los valores:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Solo servidor. Nunca exponer en código cliente.
SUPABASE_SERVICE_ROLE_KEY=

# NextAuth
NEXTAUTH_SECRET=
```

| Variable                        | Uso                                                                    | Ámbito                    |
| ------------------------------- | ---------------------------------------------------------------------- | ------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL del proyecto Supabase.                                             | Cliente + servidor.       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública para el SDK de Supabase (respeta RLS).                   | Cliente + servidor.       |
| `SUPABASE_SERVICE_ROLE_KEY`     | Clave admin que salta RLS; usada sólo por los endpoints `app/api/*`.   | **Solo servidor.**        |
| `NEXTAUTH_SECRET`               | Secreto para firmar el JWT de sesión de NextAuth.                      | Solo servidor.            |

`SUPABASE_SERVICE_ROLE_KEY` **no** debe usarse en componentes cliente ni
exponerse con el prefijo `NEXT_PUBLIC_`. `NODE_ENV` lo maneja Next.js
automáticamente; no hace falta declararlo.

---

## Instalación y arranque

```bash
# 1. Instalar dependencias
pnpm install
# (o npm install / yarn install)

# 2. Configurar variables de entorno
cp .env.example .env.local
# editar .env.local con los valores reales

# 3. Levantar el servidor de desarrollo (Turbopack)
pnpm dev
# → http://localhost:3000

# 4. Build de producción
pnpm build
pnpm start

# 5. Linter
pnpm lint
```

Scripts disponibles (ver [`package.json`](./package.json)):

| Script         | Descripción                                                         |
| -------------- | ------------------------------------------------------------------- |
| `pnpm dev`     | Servidor de desarrollo con `next dev --turbopack` en el puerto 3000. |
| `pnpm build`   | Build de producción.                                                |
| `pnpm start`   | Sirve el build.                                                     |
| `pnpm lint`    | Linter (`next lint`).                                               |

---

## Roles y cuentas de prueba

El sistema reconoce cinco roles con sidebars y permisos distintos:

| Rol              | Puede...                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------- |
| **admin**        | Gestionar usuarios, materias/programas, anuncios, ventanas de operación, permisos especiales y consultar resultados. |
| **capturista**   | Editar PUAs (datos generales, unidades, taller, laboratorio) y encuadres (asignaciones profesor–grupo). |
| **profesor**     | Editar el encuadre de sus cursos, gestionar alumnos inscritos y registrar avances por tema. |
| **alumno**       | Ver el encuadre de sus cursos, firmar "enterado" y registrar avances por tema.            |
| **lector**       | Consultar (solo lectura) el estado global: cursos, avances y coincidencia profesor–alumno. |

Cuentas creadas para pruebas y demostración:

| Rol           | Correo                 | Contraseña       |
| ------------- | ---------------------- | ---------------- |
| Administrador | `admin@gmail.com`      | `admin123`       |
| Capturista    | `capturista@gmail.com` | `capturista123`  |
| Profesor      | `profe2@gmail.com`     | `profesor123`    |
| Alumno        | `alumno@gmail.com`     | `alumno123`      |
| Lector        | `lector@gmail.com`     | `lector123`      |

> Uso exclusivo para pruebas. No usar en producción.

---

## Estructura de carpetas

```
encuadres-fcqi/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Grupo público: login
│   │   └── page.tsx
│   ├── (main)/                   # Grupo autenticado
│   │   ├── layout.tsx            # Sidebar + VerificarPeriodo
│   │   ├── admin/                # 12 páginas de administrador
│   │   ├── capturista/           # 7 páginas de capturista (materias, PUA, encuadre)
│   │   ├── profesor/             # 7 páginas de profesor (cursos + tabs)
│   │   ├── alumno/               # 3 páginas de alumno (cursos + tabs)
│   │   └── lector/               # 3 páginas de lector (dashboard + cursos) + stub vacío `/lector/reportes`
│   ├── api/                      # Endpoints REST
│   │   ├── auth/                 # NextAuth
│   │   ├── usuarios/             # Alta manual y masiva
│   │   └── alumnos/              # Registro y asociación al encuadre
│   ├── layout.tsx                # Providers globales (Session, Confirm, Toast)
│   └── globals.css
├── components/                   # 26 componentes (shadcn + propios)
├── hooks/                        # Hooks de formularios y persistencia
├── lib/                          # Cliente Supabase, auth, permisos
├── middleware.ts                 # Guardia por rol y ruta
├── public/                       # Assets estáticos (logo UABC, favicon)
├── docs/                         # Documentación viva del proyecto
│   ├── codigo/                   # codigo.md (referencia), riesgos.md (bugs) y decisiones.md (bitácora de diseño)
│   ├── verificar_bd.sql          # 17 consultas de solo lectura para re-verificar en Supabase
│   └── database/                 # bd.md (referencia), riesgos.md (verificación) y decisiones.md (bitácora)
├── .env.example                  # Plantilla de variables de entorno
└── package.json
```

---

## Documentación adicional

Toda la documentación viva vive en [`docs/`](./docs/):

| Recurso | Contenido |
| --- | --- |
| [`docs/codigo/codigo.md`](./docs/codigo/codigo.md) | Referencia técnica del código: páginas, componentes, hooks, utilidades y endpoints REST. |
| [`docs/codigo/riesgos.md`](./docs/codigo/riesgos.md) | Bugs, `⚠️` y archivos huérfanos por área del código. |
| [`docs/codigo/decisiones.md`](./docs/codigo/decisiones.md) | Bitácora del **porqué** de decisiones y patrones del código. |
| [`docs/database/bd.md`](./docs/database/bd.md) | Referencia de la base de datos: tablas, ENUMs, funciones, triggers, RLS y guía de migración local. |
| [`docs/database/riesgos.md`](./docs/database/riesgos.md) | Advertencias, código muerto y reporte de verificación exhaustiva contra Supabase. |
| [`docs/database/decisiones.md`](./docs/database/decisiones.md) | Observaciones de diseño y patrones recurrentes de la BD. |
| [`docs/database/schema_completo.sql`](./docs/database/schema_completo.sql) | **Fuente de verdad ejecutable**: script único de creación en 8 partes. |
| [`docs/database/Documentacion_Base_Datos_ENCUADRES_FCQI_ENTREGA.pdf`](./docs/database/Documentacion_Base_Datos_ENCUADRES_FCQI_ENTREGA.pdf) | Documento oficial de entrega de la BD (Dashboard de Supabase congelado). |
| [`docs/Documentacion_Tecnica_ENCUADRES_FCQI_ENTREGA.pdf`](./docs/Documentacion_Tecnica_ENCUADRES_FCQI_ENTREGA.pdf) | Documento técnico de entrega (arquitectura, tecnologías, roles, seguridad). |

---

## Stack

- **Next.js 15** (App Router, Turbopack) + **React 19**
- **NextAuth 4** (Credentials + JWT) + **bcryptjs**
- **Supabase JS** (Postgres, Auth, Storage)
- **Radix UI + shadcn/ui** + **Tailwind CSS 4**
- **React Hook Form** + **Zod**
- **date-fns**, **lucide-react**, **xlsx** (import masivo), **resend** (correo)

Ver `package.json` para versiones exactas.

---

## Puntos críticos a tomar en cuenta

Hallazgos que quien continúe el proyecto debe conocer antes de desplegar o cambiar código. Verificados el **2026-09-21** contra Supabase real (ver [reporte completo](./docs/database/riesgos.md#4-verificación-exhaustiva-contra-supabase)).

### Seguridad — bloqueantes antes de exponer la app

| # | Hallazgo | Impacto | Dónde vive |
|---|---|---|---|
| 1 | **RLS OFF en las 27 tablas de `public`** + `anon` y `authenticated` con `DELETE, INSERT, TRUNCATE, UPDATE, SELECT, REFERENCES, TRIGGER` sobre TODAS las tablas | Cualquier cliente con la anon key puede leer o escribir cualquier tabla — la única defensa hoy son los endpoints `app/api/*` que usan `SUPABASE_SERVICE_ROLE_KEY`, pero se pueden saltar | [`docs/database/riesgos.md` — advertencia 4](./docs/database/riesgos.md#1-advertencias-importantes) |
| 2 | Las 8 funciones RPC (incluida `eliminar_programa_periodo` SECURITY DEFINER) tienen `EXECUTE` a `anon`/`PUBLIC` | `supabase.rpc('eliminar_programa_periodo', {...})` desde cualquier cliente borra un programa completo en cascada | [`docs/database/riesgos.md` — advertencia 5](./docs/database/riesgos.md#1-advertencias-importantes) |
| 3 | Bucket `evidencias-encuadre` es `public=true` sin `file_size_limit` ni `allowed_mime_types` | Subir/leer/borrar archivos sin restricción; sin límite de tamaño ni tipo MIME | [`docs/database/riesgos.md` — advertencia 6](./docs/database/riesgos.md#1-advertencias-importantes) |
| 4 | Endpoints `app/api/*` usan `SUPABASE_SERVICE_ROLE_KEY` **sin validar sesión NextAuth** | Deuda de seguridad; hoy el frontend es el único cliente pero cualquiera con la URL puede llamarlos | [`docs/codigo/codigo.md` — Endpoints REST](./docs/codigo/codigo.md#endpoints-rest) |

### Features rotas o con comportamiento inesperado

| # | Hallazgo | Impacto | Dónde vive |
|---|---|---|---|
| 5 | Feature **"Clonar estructura de periodo"** llama la RPC `clonar_estructura_periodo` que **no existe** en Supabase | Botón que siempre falla en producción | [`docs/database/riesgos.md` §2](./docs/database/riesgos.md#2-rpc-clonar_estructura_periodo--no-existe) · [`codigo.md`](./docs/codigo/codigo.md#admin-clonar-periodo) |
| 6 | `authorize()` de NextAuth **reactiva TODOS los encuadres del alumno** al hacer login | Contradice `revocarAcceso`; pendiente decidir si bug o feature | [`docs/codigo/codigo.md` — /api/auth](./docs/codigo/codigo.md#apiauthnextauth) |
| 7 | `notification-bell.tsx` tiene 4 divergencias con el schema (tabla `profiles` inexistente, cols `leido`/`updated_at`/`user_id` inexistentes) | No ha explotado porque nadie lo monta; si se integra, revienta | [`docs/codigo/riesgos.md` — huérfanos](./docs/codigo/riesgos.md#6-archivos-huérfanos-y-candidatos-a-borrar) |
| 8 | Incisos nivel 4 de `ContenidoEditor` (`unidades` de PUA) **se pierden al recargar** | Bug de round-trip: el editor los pinta y serializa, pero `useUnidadesForm` solo re-parsea niveles 2 y 3 | [`docs/codigo/codigo.md` — contenido-editor](./docs/codigo/codigo.md#contenido-editortsx) |
| 9 | `FullEncuadreTable` firma el encuadre con `acepto: true` implícito — el alumno nunca marca un checkbox | Trazabilidad legal engañosa: la firma no representa consentimiento explícito | [`docs/codigo/riesgos.md` — huérfanos](./docs/codigo/riesgos.md#6-archivos-huérfanos-y-candidatos-a-borrar) |
| 10 | `EvidenciaEncuadre` acumula fotos huérfanas: al reemplazar, sube nuevo path e inserta fila nueva, sin borrar la anterior | Bucket crece indefinidamente | [`docs/codigo/codigo.md` — EvidenciaEncuadre](./docs/codigo/codigo.md#evidenciaencuadretsx) |
| 11 | `verificar-periodo` es **fail-open**: si la query a `configuracion_fechas` falla, deja pasar al usuario | Cualquier error de red bypasea la ventana de tiempo | [`docs/codigo/codigo.md` — verificar-periodo](./docs/codigo/codigo.md#verificar-periodotsx) |
| 12 | Alumno: nombre de firma valida ≥5 caracteres **solo en el cliente**; RLS de `encuadre_firmas` no refuerza | Bypaseable con supabase-js directo | [`docs/codigo/codigo.md` — Alumno tab encuadre](./docs/codigo/codigo.md#alumno-tab-encuadre) |
| 13 | `TablaCriterios` **no valida** que el total sume 100% ni rangos | PUAs inconsistentes si el padre no valida | [`docs/codigo/riesgos.md` — huérfanos](./docs/codigo/riesgos.md#6-archivos-huérfanos-y-candidatos-a-borrar) |

### Código muerto y divergencias BD ↔ código

| # | Hallazgo | Dónde vive |
|---|---|---|
| 14 | Tabla `user_notifications` **no existe** en Supabase, pero las funciones `fn_fanout_anuncio` y `mark_notification_read` la usan → funciones muertas | [`docs/database/riesgos.md` §3](./docs/database/riesgos.md#3-código-muerto-en-la-bd) |
| 15 | `notificaciones-dropdown.tsx` es archivo vacío (0 bytes); nadie lo importa | [`docs/codigo/riesgos.md` — huérfanos](./docs/codigo/riesgos.md#6-archivos-huérfanos-y-candidatos-a-borrar) |
| 16 | `/lector/reportes/page.tsx` es archivo vacío (0 bytes); Next.js no genera ruta | [`docs/codigo/riesgos.md` — huérfanos](./docs/codigo/riesgos.md#6-archivos-huérfanos-y-candidatos-a-borrar) |
| 17 | Rol `personal` existe en `roles` pero **ninguna ruta ni sidebar lo destina**; el middleware no lo reconoce | [`docs/database/bd.md` §2](./docs/database/bd.md#2-inventario-de-tablas) |
| 18 | `schema_completo.sql` siembra 6 roles (incluye `personal`); Supabase real tiene 5 | [`docs/database/bd.md` §2](./docs/database/bd.md#2-inventario-de-tablas) |
| 19 | Dos fuentes de verdad para el sidebar: `menuItemsByRole` inline en `app-sidebar.tsx` (el que se usa) vs `lib/sidebar-items.ts` | [`docs/codigo/codigo.md` — app-sidebar](./docs/codigo/codigo.md#app-sidebartsx) |
| 20 | Índices en `permisos_operacion_encuadre`: los reales son `permisos_op_lookup_idx`, `permisos_op_programa_idx`, `permisos_op_encuadre_alumnos_idx` (el SQL de referencia definía otros nombres) | [`docs/database/riesgos.md` §4.2](./docs/database/riesgos.md#42-hallazgos-menores-informativos) |

> **Nota:** ninguno de estos hallazgos ha sido corregido — este proyecto es solo documentación. Cada fila apunta al archivo donde se detalla el impacto y el estado.

---

## Glosario de dominio

| Término | Definición |
| --- | --- |
| **Encuadre** | Plan de trabajo derivado del PUA que un profesor concreta para un grupo específico en un periodo. |
| **PUA** | Programa de Unidad de Aprendizaje. Definición formal de una materia para un periodo académico. |
| **Unidad** | División temática mayor de un PUA (una materia se divide en varias unidades). |
| **Tema** | Contenido específico dentro de una unidad. Se marca como visto en `temas_checkin`. |
| **Criterios de evaluación** | Porcentajes que suman 100 y definen cómo se califica al alumno. |
| **Criterios de acreditación** | Condiciones adicionales para acreditar (p.ej. "asistencia mínima 80%"). |
| **Plan de temas** | Distribución semanal de los temas del PUA a lo largo del periodo. |
| **Periodo** | Ciclo académico (ej. `2026-1`, `2026-2`). Muchas tablas llevan la columna `periodo`. |
| **Ventana de tiempo** | Rango habilitado por el admin (`configuracion_fechas`) para editar encuadre, firmar, registrar avances o editar PUA. |
| **Permiso operativo** | Excepción por usuario/curso registrada en `permisos_operacion_encuadre`; suplanta a la ventana global. |
| **Coincidencia** | Métrica del rol lector: pareja `(alumno, tema)` con checkin de ambos; si `tema_visto` coincide se cuenta como acierto. |
