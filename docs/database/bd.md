# Base de datos — ENCUADRES-FCQI

Referencia normal de la base de datos: qué contiene, cómo se organiza, cómo replicarla en local.

> **Fuente de verdad:** [`./schema_completo.sql`](./schema_completo.sql) (script ejecutable en 8 partes). Este documento es la narrativa que lo explica.
>
> Para bugs, hallazgos críticos y ⚠️ ver [`./riesgos.md`](./riesgos.md).
> Para observaciones de diseño y patrones ver [`./decisiones.md`](./decisiones.md).
>
> **Última verificación completa contra Supabase:** 2026-09-21 (ver [`./riesgos.md §4`](./riesgos.md#4-verificación-exhaustiva-contra-supabase)).

## Índice

- [1. Fuentes y jerarquía](#1-fuentes-y-jerarquía)
- [2. Inventario de tablas](#2-inventario-de-tablas)
- [3. Tipos personalizados (ENUMs)](#3-tipos-personalizados-enums)
- [4. Funciones vigentes](#4-funciones-vigentes)
- [5. Triggers activos](#5-triggers-activos)
- [6. Policies de RLS](#6-policies-de-rls)
- [7. Discrepancias resueltas frente al export original](#7-discrepancias-resueltas-frente-al-export-original)
- [8. Columnas añadidas frente al snapshot histórico](#8-columnas-añadidas-frente-al-snapshot-histórico)
- [9. Flujos de datos principales](#9-flujos-de-datos-principales)
- [10. Migración a Postgres local](#10-migración-a-postgres-local)

---

## 1. Fuentes y jerarquía

| Archivo | Rol | Estado |
|---|---|---|
| [`./schema_completo.sql`](./schema_completo.sql) | **Fuente de verdad ejecutable.** Reconstruye la BD desde cero (extensiones, ENUMs, tablas, índices, funciones, triggers, RLS, seed). | Vigente. |
| [`./bd.md`](./bd.md) | Narrativa que explica el SQL. | Este archivo. |
| [`./riesgos.md`](./riesgos.md) | Bugs, discrepancias, hallazgos críticos. | Actualizado. |
| [`./decisiones.md`](./decisiones.md) | Observaciones y decisiones de diseño. | Actualizado. |
| [`../verificar_bd.sql`](../verificar_bd.sql) | 17 consultas de solo lectura para confirmar que doc y SQL siguen coincidiendo con Supabase. | Herramienta de QA. |
| `./Documentacion_Base_Datos_ENCUADRES_FCQI_ENTREGA.pdf` | Documento oficial de entrega (dashboard congelado). | Snapshot no reeditable. |

Regla de precedencia y snapshots: ver [`./decisiones.md §3`](./decisiones.md#3-precedencia-de-fuentes).

---

## 2. Inventario de tablas

**27 tablas** en el schema `public`, agrupadas por dominio.

### 2.1 Catálogos base

| Tabla | Columnas clave | Propósito |
|---|---|---|
| `roles` | `id`, `nombre` | **5 roles reales en Supabase** (verificado 2026-09-21): `admin`, `alumno`, `capturista`, `lector`, `profesor`. `schema_completo.sql` siembra 6 (incluye `personal`) por compatibilidad histórica. |
| `licenciaturas` | `id`, `nombre`, `activa` | Carreras disponibles (FK de `materias`) |
| `materias` | `id`, `clave` (UNIQUE), `nombre_materia`, `licenciatura_id` | Materias del catálogo |

### 2.2 Estructura académica (PUA)

| Tabla | Columnas clave | Propósito |
|---|---|---|
| `programas` | `id`, `materia_id`, `estado_programa`, `periodo` | PUA de una materia en un periodo |
| `unidades` | `id`, `programa_id`, `numero`, `titulo`, `competencia` | Unidades del programa |
| `temas` | `id`, `unidad_id`, `numero`, `nombre` | Temas de una unidad |
| `practicas_laboratorio` | `id`, `programa_id`, `unidad_id`, `numero`, `nombre` | Prácticas de laboratorio |
| `practicas_taller` | `id`, `programa_id`, `unidad_id`, `numero`, `nombre` | Prácticas de taller |

### 2.3 Encuadres (núcleo)

| Tabla | Columnas clave | Propósito |
|---|---|---|
| `encuadres` | `id`, `programa_id`, `usuario_id`, `grupo`, `periodo`, `estado_encuadre` | Encuadre de un grupo, creado desde un PUA |
| `criterios_evaluacion` | `id`, `encuadre_id`, `criterio`, `valor` | Porcentajes de evaluación |
| `criterios_acreditacion` | `id`, `encuadre_id`, `criterio` | Criterios de acreditación |
| `plan_temas` | `id`, `encuadre_id`, `tema_id`, `semana` | Distribución de temas por semana |

### 2.4 Alumnos y participación

| Tabla | Columnas clave | Propósito |
|---|---|---|
| `encuadre_alumnos` | `id`, `encuadre_id`, `alumno_id`, `estado` | Relación alumno ↔ encuadre |
| `encuadre_checkin` | `id`, `encuadre_id`, `usuario_id`, `aceptado` | Aceptación del encuadre por el alumno |
| `encuadre_firmas` | `id`, `encuadre_id`, `alumno_id`, `firmado_at` | Firma digital del encuadre |
| `encuadre_evidencias` | `id`, `encuadre_id`, `profesor_id`, `foto_url` | Evidencias fotográficas (Supabase Storage) |

### 2.5 Avances de clase

| Tabla | Columnas clave | Propósito |
|---|---|---|
| `temas_checkin` | `id`, `tema_id`, `usuario_id`, `encuadre_id`, `grupo`, `tema_visto` | Registro de avance por tema |
| `checkins` | `id`, `usuario_id`, `materia_id`, `tipo`, `coincidencia` | Asistencia por QR/NFC (no usado en la UI actual) |

> `temas_checkin` rastrea contenido; `checkins` es un sistema de asistencia por coincidencia/geolocalización no expuesto hoy.

### 2.6 Usuarios y acceso

| Tabla | Columnas clave | Propósito |
|---|---|---|
| `usuarios` | `id`, `correo` (UNIQUE), `nombre`, `contraseña`, `rol_id` | Todos los usuarios del sistema |
| `permisos_operacion_encuadre` | `id`, `usuario_id`, `encuadre_id`, `programa_id`, `rol_objetivo`, `activo` | Permisos especiales temporales (los otorga admin) |

### 2.7 Comunicación

| Tabla | Columnas clave | Propósito |
|---|---|---|
| `anuncios` | `id`, `titulo`, `mensaje`, `destinatarios`, `metodo`, `estado` | Anuncios del administrador |
| `notificaciones` | `id`, `titulo`, `mensaje`, `tipo`, `activa` | Notificaciones in-app |
| `notificaciones_usuarios` | `id`, `notificacion_id`, `usuario_id`, `leida` | Relación notificación ↔ usuario |
| `email_outbox` | `id`, `ad_id`, `user_id`, `email`, `subject`, `body`, `status` | Cola de correos pendientes (patrón outbox — ver [decisiones §2](./decisiones.md#2-patrones-recurrentes)) |

### 2.8 Configuración y auditoría

| Tabla | Columnas clave | Propósito |
|---|---|---|
| `configuracion_fechas` | `id`, `fecha_inicio`, `fecha_fin`, `hora_inicio`, `hora_fin`, `habilita_*` | Ventanas de tiempo que habilitan operaciones |
| `configuraciones` | `id`, `horario_inicio`, `horario_fin`, `mantenimiento_*` | Configuración global legacy (probablemente sin uso) |
| `auditoria` | `id`, `accion`, `usuario_id`, `fecha` | Log de auditoría |

---

## 3. Tipos personalizados (ENUMs)

Los 4 ENUMs viven en Supabase y en `schema_completo.sql` PARTE 2.

| Tipo | Usado en | Valores confirmados (Supabase 2026-09-20) |
|---|---|---|
| `anuncio_estado` | `anuncios.estado` DEFAULT `'borrador'::anuncio_estado` | `borrador`, `programado`, `enviado` |
| `rol_destinatario` | `anuncios.destinatarios[]` y parámetro de `fn_fanout_anuncio` | `alumno`, `profesor`, `personal`, `todos` |
| `categoria_enum` | `materias.categoria` NOT NULL | `Basica`, `Disciplinaria`, `Terminal` |
| `requisito_enum` | `materias.requisito` NOT NULL | `optativa`, `obligatoria` |

> Los tipos usados en `materias` se llaman `categoria_enum` y `requisito_enum` (con sufijo `_enum`), no `categoria`/`requisito`.

---

## 4. Funciones vigentes

Las **8 funciones** presentes hoy en Supabase:

| # | Función | Tipo | Descripción |
|---|---|---|---|
| 1 | `eliminar_programa_periodo(p_programa_id uuid)` | RPC | Elimina en cascada un programa y todos sus hijos |
| 2 | `fn_fanout_anuncio()` | Trigger | Distribuye una nueva notificación a todos los usuarios |
| 3 | `fn_fanout_anuncio(anuncio_id uuid)` | RPC | Fanout de anuncio por destinatario (in-app y/o email) |
| 4 | `fn_usuarios_por_destinatario(d rol_destinatario)` | SQL estable | Retorna usuarios filtrados por rol |
| 5 | `insert_notificaciones_usuarios()` | Trigger | Al insertar notificación, la replica a todos los usuarios |
| 6 | `mark_all_notifications_read()` | RPC | Marca todas las notificaciones del usuario actual como leídas (usa `auth.uid()`) |
| 7 | `mark_notification_read(p_id uuid)` | RPC | Marca una notificación específica como leída (usa `auth.uid()`) |
| 8 | `tr_anuncios_fanout()` | Trigger | Al insertar anuncio, crea notificación y la distribuye |

> **RPC ausente en producción:** `clonar_estructura_periodo` es llamada por el frontend pero no existe en Supabase. Ver [`./riesgos.md §2`](./riesgos.md#2-rpc-clonar_estructura_periodo--no-existe).
> **Funciones muertas:** algunas de las 8 anteriores no se llaman desde ningún lado o dependen de tablas inexistentes. Ver [`./riesgos.md §3`](./riesgos.md#3-código-muerto-en-la-bd).

---

## 5. Triggers activos

| # | Trigger | Sobre | Evento | Función |
|---|---|---|---|---|
| 1 | `trg_anuncios_fanout` | `anuncios` | AFTER INSERT | `tr_anuncios_fanout()` |
| 2 | `trigger_insert_notificaciones_usuarios` | `notificaciones` | AFTER INSERT | `insert_notificaciones_usuarios()` |

---

## 6. Policies de RLS

Las 13 policies definidas en el schema:

| Tabla | Policies | Observación |
|---|---|---|
| `notificaciones` | 4 (SELECT×2, INSERT×2) | Política duplicada: "Admins pueden crear" + "Permitir inserción" |
| `notificaciones_usuarios` | 5 (SELECT×2, UPDATE×2, INSERT×1) | Política duplicada UPDATE: "Permitir actualización" + "Usuarios pueden actualizar sus notificaciones" |
| `storage.objects` | 4 (SELECT, INSERT, UPDATE, DELETE sobre bucket `evidencias-encuadre`) | Acceso abierto a anon + authenticated, sin restricción de propiedad |

> **RLS OFF en producción:** las 13 policies existen pero no se aplican porque `rowsecurity = false` en las 27 tablas. Ver [`./riesgos.md §4.1 Q3+Q9`](./riesgos.md#q3--q9--rls-off--anon-con-todos-los-privilegios-seguridad-crítica).
> **Bucket público:** el bucket `evidencias-encuadre` tiene `public = true` sin límites. Ver [`./riesgos.md §4.1 Q17`](./riesgos.md#q17--bucket-evidencias-encuadre-público-sin-restricciones-alto).

**Nota RLS local:** las policies usan `auth.uid()` (Supabase Auth). En Postgres puro no funcionan y deben omitirse o adaptarse.

---

## 7. Discrepancias resueltas frente al export original

El export histórico de Supabase no era ejecutable directo. `schema_completo.sql` los resuelve todos:

| # | Problema en el SQL original | Cómo se resolvió |
|---|---|---|
| 1 | FKs duplicadas (inline + ALTER TABLE) | Todas embebidas en `CREATE TABLE`, sin `ALTER TABLE` separado |
| 2 | ENUMs sin declarar | PARTE 2 declara los 4 ENUMs |
| 3 | `auth.uid()` sin Supabase | Documentado como limitación en PARTES 5 y 7 |
| 4 | Sin `CREATE EXTENSION` | PARTE 1 crea `pgcrypto` |
| 5 | Sin `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` | PARTE 7 incluye los `ENABLE`, comentados por defecto |
| 6 | Sin índices | PARTE 4 crea 53 índices (44 FK + 9 hot queries) |
| 7 | `clonar_estructura_periodo` ausente | Decisión: no incluir (feature rota); ver [`./riesgos.md §2`](./riesgos.md#2-rpc-clonar_estructura_periodo--no-existe) |

---

## 8. Columnas añadidas frente al snapshot histórico

Un snapshot antiguo de columnas (ya no vigente) no reflejaba varias columnas que sí existen en Supabase y en `schema_completo.sql`. Registro histórico:

| Tabla | Columnas solo en SQL |
|---|---|
| `encuadres` | `descripcion_evaluacion`, `derecho_ordinario`, `derecho_extraordinario`, `descripcion_producto`, `bibliografia_basica`, `normas_conducta`, `profesor_puede_modificar_criterios`, `ultimo_editor_id`, `ultima_edicion`, `seccion` |
| `programas` | `unidad_academica`, `programa_educativo`, `plan_estudios`, `hc`, `hl`, `ht`, `hpc`, `hcl`, `he`, `cr`, `etapa_formacion`, `caracter_ua`, `requisitos`, `metodo_encuadre`, `metodo_estrategia_docente`, `metodo_estrategia_alumno`, `referencias_basicas`, `referencias_complementarias`, `perfil_docente`, `ultimo_editor_id`, `ultima_edicion`, `activo`, `archivado`, `archivada_at`, `archivada_por` |
| `materias` | `licenciatura_id` (FK), `periodo`, `plan_estudios`, `archivada` |
| `usuarios` | `debe_cambiar_password`, `password_expira_at` |
| `practicas_laboratorio` | `programa_id`, `unidad` (int), `competencia`, `descripcion`, `material_apoyo` |
| `practicas_taller` | `programa_id`, `unidad` (int), `competencia`, `descripcion`, `material_apoyo` |

Tablas en el SQL pero **ausentes** en el snapshot: `licenciaturas`, `encuadre_alumnos`, `encuadre_firmas`, `configuracion_fechas`, `permisos_operacion_encuadre`, `encuadre_evidencias`.

---

## 9. Flujos de datos principales

### 9.1 Ciclo de vida del encuadre

```
materias → programas → encuadres
                          │
                  ┌───────┼───────────────────┐
                  │       │                   │
          criterios_  plan_temas       encuadre_alumnos
          evaluacion/                        │
          acreditacion                ┌──────┼──────┐
                                      │      │      │
                               encuadre_ encuadre_ temas_
                               checkin   firmas    checkin
```

### 9.2 Flujo de invitación de alumnos

```
POST /api/alumnos/registrar  →  crear usuario (rol=alumno)
                              →  insertar en encuadre_alumnos (estado='pendiente')
                              →  insertar en email_outbox

POST /api/alumnos/agregar    →  buscar usuario existente
                              →  validar rol=alumno
                              →  insertar en encuadre_alumnos (estado='pendiente')
```

Estados de `encuadre_alumnos.estado`: `pendiente` → `enviada` → `activa` → `revocada`.

### 9.3 Sistema de permisos temporales

`permisos_operacion_encuadre` implementa permisos granulares con ventana:

| Alcance | Campo FK | Aplicable a |
|---|---|---|
| Por encuadre | `encuadre_id` | profesor o alumno |
| Por programa | `programa_id` | capturista (PUA) |

**Herencia:** un permiso de profesor con `incluye_alumnos=true` se propaga a los alumnos del encuadre (calculado en `lib/permisoOperacion.ts`, no en triggers SQL).

### 9.4 Sistema de ventanas de tiempo

`configuracion_fechas` define ventanas con fecha/hora de inicio y fin. Cada ventana activa habilita o deshabilita independientemente:

| Flag | Habilita a |
|---|---|
| `habilita_encuadre` | profesor: editar/publicar el encuadre |
| `habilita_firma` | alumno: firmar |
| `habilita_avances` | profesor: registrar avances de temas |
| `habilita_pua` | capturista: editar el PUA |

### 9.5 Fanout de anuncios

```
INSERT anuncio
    → trigger trg_anuncios_fanout
        → tr_anuncios_fanout()
            → INSERT notificaciones
                → trigger trigger_insert_notificaciones_usuarios
                    → insert_notificaciones_usuarios()
                        → INSERT notificaciones_usuarios (para todos)
```

---

## 10. Migración a Postgres local

> **Objetivo:** levantar una copia funcional de la BD sobre **Postgres local** sin depender de Supabase, para desarrollar/ejecutar la app contra una BD propia.
>
> **Alcance:** solo replicación de la BD. La app en modo local pierde algunas features Supabase-específicas (RLS, Storage, `auth.uid()`). Ver 10.6.

**TL;DR**

| Quiero… | Hacer |
|---|---|
| Solo la estructura | `psql -d encuadres_local -f docs/database/schema_completo.sql` |
| Estructura + datos actuales | Aplicar el schema → `pg_dump --data-only` desde Supabase → cargar dump. Ver 10.4 |
| Que la app funcione contra la BD local | Usar **Supabase self-hosted** en Docker + aplicar el schema. Ver 10.5 |

**Deuda preexistente que NO se resuelve aquí:**

| # | Deuda | Ver |
|---|---|---|
| 1 | RPC `clonar_estructura_periodo` no existe; feature "Clonar periodo" rota en local igual que en producción | [`./riesgos.md §2`](./riesgos.md#2-rpc-clonar_estructura_periodo--no-existe) |
| 2 | 3 funciones son código muerto y pueden fallar al crearse en local: `fn_fanout_anuncio(uuid)`, `mark_notification_read(uuid)`, `mark_all_notifications_read()`. Si `CREATE FUNCTION` falla, coméntalas | [`./riesgos.md §3`](./riesgos.md#3-código-muerto-en-la-bd) |
| 3 | `notification-bell.tsx` UPDATE-a columnas `leido`/`updated_at` que **no existen** en `notificaciones_usuarios` (reales: `leida`, `fecha_lectura`). Bug preexistente | [`./riesgos.md §1`](./riesgos.md#1-advertencias-importantes) (adv. 3) |

### 10.1 Requisitos

| Herramienta | Versión mínima | Notas |
|---|---|---|
| PostgreSQL | 15+ | O Docker con `postgres:15` |
| Node.js | 20+ | Alineado con Next.js 15 |
| pnpm | 9+ | El repo usa `pnpm-lock.yaml` |
| `psql` | cualquiera | Cliente CLI |
| Cliente Supabase | opcional | Si se exportan datos reales |

### 10.2 Crear la BD local

**Opción A — PostgreSQL instalado:**

```bash
createdb encuadres_local
psql -d encuadres_local -f docs/database/schema_completo.sql
```

**Opción B — Docker:**

```bash
docker run --name encuadres-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=encuadres_local \
  -p 5432:5432 \
  -d postgres:15

# esperar 2-3s, luego:
docker cp docs/database/schema_completo.sql encuadres-pg:/tmp/schema.sql
docker exec -it encuadres-pg psql -U postgres -d encuadres_local -f /tmp/schema.sql
```

### 10.3 Errores esperables al ejecutar el schema

| Error | Causa | Acción |
|---|---|---|
| `relation "user_notifications" does not exist` | `mark_notification_read` y `fn_fanout_anuncio(uuid)` la referencian | Comentar esas 2 funciones y re-ejecutar. Son código muerto. |
| `function auth.uid() does not exist` | 3 funciones y todas las policies dependen de esta función Supabase | El bloque RLS ya viene comentado. Para funciones ver 10.5. |
| `type "categoria_enum" does not exist` | Se ejecutó la PARTE 3 (tablas) sin la PARTE 2 (ENUMs) | Correr el archivo completo, no fragmentado. |
| `schema "storage" does not exist` | Las 4 policies `anon_*_evidencias` operan sobre `storage.objects` | Vienen comentadas en PARTE 7. No aplican sin MinIO. |

### 10.4 Exportar datos reales desde Supabase (opcional)

**Desde el Dashboard:** `Database → Backups → Download backup` produce un `.sql` completo.

**Desde CLI con `pg_dump`:**

```bash
# Connection string en: Project Settings → Database → Connection string
pg_dump \
  --data-only \
  --column-inserts \
  --no-owner \
  --no-privileges \
  --schema=public \
  "postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres" \
  > dump-datos.sql
```

`--data-only` evita traer estructura. `--column-inserts` produce INSERTs explícitos, más portables.

**Cargar el dump en local:**

```bash
psql -d encuadres_local -f dump-datos.sql
```

Notas: si algún INSERT falla por FK, revisa orden de carga; los IDs de `roles` reemplazarán a los sembrados en PARTE 8; los passwords quedan como hashes bcrypt válidos.

### 10.5 Correr la app contra la BD local

`.env.example` está pensado para Supabase. En modo local:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<cualquier valor no vacío>
SUPABASE_SERVICE_ROLE_KEY=<cualquier valor no vacío>
NEXTAUTH_SECRET=<openssl rand -base64 32>
```

> **Realidad:** `lib/supabase.ts` **exige** las 2 primeras vars — si están vacías el proceso arranca con `throw new Error(...)`. La app está fuertemente acoplada al SDK de Supabase.

Para correr contra Postgres puro habría que elegir uno de estos caminos, ambos fuera del alcance:

| Camino | Trade-off |
|---|---|
| Levantar **Supabase self-hosted** en Docker | Recomendado — mantiene `auth.uid()`, RLS, Storage, y el SDK sigue funcionando 1:1 |
| Reemplazar `lib/supabase.ts` por un cliente `pg` directo y reescribir todos los `.from().select().eq()...` | Trabajo enorme |

**Recomendación:** usar **Supabase self-hosted** (<https://supabase.com/docs/guides/self-hosting/docker>) y aplicar `schema_completo.sql` sobre esa instancia. Paridad con producción sin tocar código de la app.

### 10.6 Features que NO funcionan sin Supabase real

| Feature | Depende de | Alternativa local |
|---|---|---|
| Row Level Security | `auth.uid()` + `auth.users` | Omitir bloque RLS (viene comentado) |
| Almacenamiento de evidencias | `storage.objects`, bucket `evidencias-encuadre` | MinIO local o filesystem (requiere código) |
| Fanout con `admin_id` real | `auth.uid()` en `tr_anuncios_fanout()` | `admin_id` queda NULL en anuncios locales |
| Password reset por correo | Resend en producción | SMTP local o mock |

### 10.7 Bootstrap: crear un admin en local

Después de aplicar el schema no hay usuarios. Para poder loguearse:

```sql
-- 1. Generar el hash bcrypt fuera de SQL (Node one-liner):
--    node -e "console.log(require('bcryptjs').hashSync('admin123', 12))"
-- 2. Reemplazar <HASH> abajo

INSERT INTO public.usuarios (correo, contrasena, nombre_completo, rol_id, activo)
VALUES (
    'admin@local',
    '<HASH>',
    'Administrador Local',
    (SELECT id FROM public.roles WHERE nombre = 'admin'),
    true
);
```

`bcryptjs` con salt 12 es lo que usa `app/api/usuarios/crear/route.ts`.

### 10.8 Checklist de verificación local

- [ ] `SELECT count(*) FROM public.roles;` devuelve **6** en local (`schema_completo.sql` siembra 6). En Supabase actual son **5** (falta `personal`).
- [ ] `\dT+ public.*_enum` muestra los 4 ENUMs.
- [ ] `SELECT count(*) FROM information_schema.tables WHERE table_schema='public';` devuelve **27**.
- [ ] `\di public.*` lista los índices creados por PARTE 4 (unos 40 en total contando PKs). Nota: Supabase actual tiene menos índices "custom" que los definidos en `schema_completo.sql`; ver [`./riesgos.md §4.2 Q14`](./riesgos.md#42-hallazgos-menores-informativos).
- [ ] `\df public.*` lista las funciones que no fallaron (5-8 según si se comentó dead code).
- [ ] Login con el admin creado en 10.7 funciona (si se corre la app).

---

> Para bugs y hallazgos críticos ver [`./riesgos.md`](./riesgos.md).
> Para decisiones de diseño ver [`./decisiones.md`](./decisiones.md).
> Para el script SQL fuente, ver [`./schema_completo.sql`](./schema_completo.sql).
