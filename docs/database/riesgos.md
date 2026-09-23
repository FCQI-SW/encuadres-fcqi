# Riesgos y hallazgos — Base de datos

Catálogo de bugs, discrepancias y hallazgos críticos verificados contra Supabase el **2026-09-21**.

> Para la referencia normal de la BD ver [`./bd.md`](./bd.md).
> Para el porqué de decisiones de diseño ver [`./decisiones.md`](./decisiones.md).
> Consultas de verificación en [`../verificar_bd.sql`](../verificar_bd.sql).

## Índice

- [1. Advertencias importantes](#1-advertencias-importantes)
- [2. RPC `clonar_estructura_periodo` — no existe](#2-rpc-clonar_estructura_periodo--no-existe)
- [3. Código muerto en la BD](#3-código-muerto-en-la-bd)
- [4. Verificación exhaustiva contra Supabase](#4-verificación-exhaustiva-contra-supabase)
  - [4.1 Hallazgos críticos](#41-hallazgos-críticos)
  - [4.2 Hallazgos menores](#42-hallazgos-menores-informativos)
  - [4.3 Cómo re-verificar](#43-cómo-re-verificar)

---

## 1. Advertencias importantes

| # | Hallazgo | Estado |
|---|---|---|
| 1 | La función RPC `clonar_estructura_periodo` **NO existe en Supabase**, pero el frontend la llama en `app/(main)/admin/herramientas/clonar-periodo/page.tsx:147`. La feature "Clonar estructura de periodo" está **rota en producción**. | Documentado — sin acción de código |
| 2 | La tabla `user_notifications` **NO existe en Supabase** (verificado 2026-09-21). Es referenciada por 2 funciones que quedaron como **código muerto**: `fn_fanout_anuncio(uuid)` y `mark_notification_read(uuid)`. Ver sección 3. | Documentado — sin acción de código |
| 3 | El componente `components/notification-bell.tsx` hace UPDATE sobre `notificaciones_usuarios` con las columnas `leido` y `updated_at`, que **no existen**. Las columnas reales son `leida` (boolean) y `fecha_lectura` (timestamptz). **Confirmado como bug del componente** (verificado 2026-09-21). | Documentado — bug preexistente sin arreglar |
| 4 | **Riesgo de seguridad crítico:** RLS está **OFF** en las 27 tablas de `public` y las claves `anon`/`authenticated` tienen `DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE` sobre TODAS las tablas. La única defensa real hoy son los endpoints `app/api/*` que usan `SUPABASE_SERVICE_ROLE_KEY`, pero cualquier cliente con la anon key puede saltárselos y escribir directo. Verificado 2026-09-21 (Q3 + Q9). | Documentado — pendiente decisión (activar RLS o revocar grants) |
| 5 | **Riesgo de seguridad:** todas las funciones (incluida `eliminar_programa_periodo` SECURITY DEFINER) tienen `EXECUTE` concedido a `anon`, `authenticated` y `PUBLIC`. Cualquier cliente con la anon key puede llamar `supabase.rpc('eliminar_programa_periodo', {...})` y borrar en cascada un programa completo. Verificado 2026-09-21 (Q10). | Documentado — pendiente REVOKE en producción |
| 6 | **Bucket `evidencias-encuadre` es público** sin `file_size_limit` ni `allowed_mime_types`, con 4 policies abiertas a `anon`+`authenticated`. Cualquiera puede subir/leer/borrar sin restricción. Verificado 2026-09-21 (Q17). | Documentado — pendiente cerrar el bucket |

---

## 2. RPC `clonar_estructura_periodo` — no existe

> ⚠️ **Estado: rota en producción.** Al hacer click en "Crear copia", `supabase.rpc(...)` falla con error de función inexistente.

| Campo | Detalle |
|---|---|
| **Función** | `clonar_estructura_periodo(p_periodo_origen, p_periodo_destino, p_editor_id, p_clave_materia)` |
| **Usada en** | `app/(main)/admin/herramientas/clonar-periodo/page.tsx` vía `supabase.rpc(...)` |
| **Estado** | **NO EXISTE** (verificado 2026-09-20 en Dashboard) |
| **Posibles causas** | Fue planeada y no se creó · se eliminó accidentalmente · el clonado se hacía antes con scripts manuales fuera del sistema |

**Firma esperada según el frontend:**

```sql
CREATE OR REPLACE FUNCTION public.clonar_estructura_periodo(
    p_periodo_origen text,
    p_periodo_destino text,
    p_editor_id uuid,
    p_clave_materia text DEFAULT NULL
)
RETURNS jsonb  -- { ok, periodo_origen, periodo_destino, clave_materia,
               --   programas_copiados, unidades_copiadas, temas_copiados,
               --   practicas_taller_copiadas, practicas_laboratorio_copiadas,
               --   encuadres_copiados, criterios_evaluacion_copiados,
               --   criterios_acreditacion_copiados }
```

---

## 3. Código muerto en la BD

Después de un grep exhaustivo, **solo 3 llamadas a `supabase.rpc()`** existen en la app:

| Ubicación | RPC | Estado |
|---|---|---|
| `app/(main)/admin/materias/page.tsx:580` | `eliminar_programa_periodo` | Funciona |
| `app/(main)/admin/materias/page.tsx:609` | `eliminar_programa_periodo` | Funciona |
| `app/(main)/admin/herramientas/clonar-periodo/page.tsx:147` | `clonar_estructura_periodo` | Función no existe |

**Funciones que existen en Supabase pero nadie llama:**

| Función | Referencia problemática | Estado |
|---|---|---|
| `fn_fanout_anuncio(anuncio_id uuid)` | `INSERT INTO user_notifications` (tabla inexistente) | Código muerto. Fallaría en ejecución. |
| `fn_fanout_anuncio()` (trigger sin args) | Sin trigger asociado | Código muerto pero técnicamente correcto |
| `fn_usuarios_por_destinatario(rol_destinatario)` | Solo la llama `fn_fanout_anuncio(uuid)` (también muerta) | Código muerto indirecto |
| `mark_notification_read(p_id uuid)` | `UPDATE user_notifications` | Código muerto. Fallaría en ejecución. |
| `mark_all_notifications_read()` | Usa `auth.uid()` — solo funciona en Supabase | Código muerto (nadie la llama) |

**Por qué "rotas":** PostgreSQL crea funciones **sin validar** que las tablas existan (*late binding*). Por eso Supabase permitió crearlas. Si alguien las ejecutara, Postgres lanza:

```
ERROR: relation "public.user_notifications" does not exist
```

**Por qué no importa hoy:** el sistema real usa triggers sobre las tablas, no estas RPCs:

```
INSERT INTO anuncios
    ↓ trigger trg_anuncios_fanout
tr_anuncios_fanout()                        ← existe y funciona
    ↓
INSERT INTO notificaciones
    ↓ trigger trigger_insert_notificaciones_usuarios
insert_notificaciones_usuarios()            ← existe y funciona
    ↓
INSERT INTO notificaciones_usuarios
```

Para marcar como leídas, `notification-bell.tsx` hace UPDATE directo sobre `notificaciones_usuarios` sin usar las RPCs `mark_*`.

**Conclusión:** son residuos de una versión anterior que usaba una tabla `user_notifications` que ya no existe. No afectan al sistema actual pero deben quedar documentados.

**Sobre la tabla fantasma `user_notifications`:** verificada 2026-09-21 y **NO existe**. Sus únicas referencias vivas están en las funciones muertas. `schema_completo.sql` no la define. Si `CREATE FUNCTION` falla en local por esta dependencia, coméntalas.

---

## 4. Verificación exhaustiva contra Supabase

Ejecución de [`../verificar_bd.sql`](../verificar_bd.sql) (17 consultas, solo lectura) contra la BD real el **2026-09-21**.

### 4.1 Hallazgos críticos

#### Q3 + Q9 — RLS OFF + `anon` con todos los privilegios (SEGURIDAD CRÍTICA)

- Las 27 tablas de `public` tienen `rowsecurity = false` y `forcerowsecurity = false`.
- `anon` y `authenticated` tienen concedidos `DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE` sobre **todas** las tablas.
- Las 13 policies definidas existen pero **no se aplican** porque RLS está desactivado.
- **Consecuencia:** con `NEXT_PUBLIC_SUPABASE_ANON_KEY` cualquier cliente puede saltarse los endpoints `app/api/*` (que usan `SERVICE_ROLE_KEY`) y escribir o incluso `TRUNCATE public.usuarios` desde el navegador.
- Cruza con advertencia 4 (sección 1) y [bd.md sección 6](./bd.md#6-policies-de-rls).

#### Q10 — `EXECUTE` público sobre todas las funciones (SEGURIDAD CRÍTICA)

- Las 8 funciones tienen `EXECUTE` concedido a `PUBLIC`, `anon` y `authenticated`.
- Incluye `eliminar_programa_periodo` (SECURITY DEFINER): cualquier cliente puede invocar `supabase.rpc('eliminar_programa_periodo', {...})` y borrar en cascada un programa completo.
- Cruza con advertencia 5 (sección 1).

#### Q17 — Bucket `evidencias-encuadre` público sin restricciones (ALTO)

- `public = true`, `file_size_limit = null`, `allowed_mime_types = null`, 4 policies abiertas a `anon` + `authenticated`.
- Cualquier URL del bucket es legible sin autenticación; se puede subir/leer/borrar sin límite de tamaño ni de tipo.
- Cruza con advertencia 6 (sección 1) y [bd.md sección 6](./bd.md#6-policies-de-rls).

#### Q4 + Q6 — Código muerto sobre tabla inexistente `user_notifications`

- La tabla `user_notifications` no existe.
- `fn_fanout_anuncio(uuid)` y `mark_notification_read(uuid)` la referencian: fallarían en ejecución (`relation ... does not exist`).
- Nadie las llama desde la app; el sistema real usa los triggers documentados en la sección 3.

#### Q12 — Bug confirmado en `notification-bell.tsx`

- `notificaciones_usuarios` tiene `leida (boolean)` y `fecha_lectura (timestamptz)`.
- El componente hace UPDATE sobre `leido` y `updated_at` (**no existen**).
- Es bug del componente, no de la BD. Cruza con advertencia 3 (sección 1) y con [`../codigo/riesgos.md`](../codigo/riesgos.md).

### 4.2 Hallazgos menores (informativos)

| # | Verificación | Resultado |
|---|---|---|
| Q1 | 27 tablas en `public` | Coincide |
| Q2 | 44 foreign keys | Coincide |
| Q5 | 8 funciones vigentes; `clonar_estructura_periodo` ausente | Coincide (ver sección 2) |
| Q7 | 2 triggers activos | Coincide |
| Q8 | 13 policies totales — `notificaciones_usuarios` son 5 (2 SELECT + 2 UPDATE + 1 INSERT), no 4 | Ajuste menor ya reflejado en [bd.md §6](./bd.md#6-policies-de-rls) |
| Q11 | **5** roles en Supabase (falta `personal`); `schema_completo.sql` sigue sembrando 6 por compatibilidad local | Ajuste ya reflejado en [bd.md §2.1](./bd.md#21-catálogos-base) |
| Q13 | PKs y UNIQUEs: `temas_checkin` sin UNIQUE, `notificaciones_usuarios` UNIQUE `(usuario_id, notificacion_id)`, `usuarios.correo`/`materias.clave`/`licenciaturas.nombre` UNIQUE | Coincide |
| Q14 | ~40 índices custom (menos que los 53 declarados en PARTE 4). Nombres reales: `permisos_op_lookup_idx` (no `idx_permisos_lookup_encuadre`), `permisos_op_programa_idx`, `permisos_op_encuadre_alumnos_idx`. **NO existe** índice sobre `configuracion_fechas(activo)` | Divergencia menor; corregir cita en `codigo.md` |
| Q15 | 4 ENUMs con los valores documentados en [bd.md §3](./bd.md#3-tipos-personalizados-enums) | Coincide |
| Q16 | `n_live_tup = 0` en todas las tablas | Falso positivo (requiere `ANALYZE`) |

### 4.3 Cómo re-verificar

Ejecuta [`../verificar_bd.sql`](../verificar_bd.sql) en el SQL Editor de Supabase (una consulta a la vez, sin guardar los snippets) y compara contra este documento. Si algo diverge, actualiza la sección correspondiente y anota aquí la fecha de la nueva verificación.
