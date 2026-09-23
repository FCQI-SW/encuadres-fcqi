# Decisiones y observaciones de diseño — Base de datos

Bitácora del **porqué** de decisiones de modelado, patrones observados y notas de mantenimiento.

> Para la referencia normal de la BD ver [`./bd.md`](./bd.md).
> Para bugs, ⚠️ y hallazgos críticos ver [`./riesgos.md`](./riesgos.md).

## Índice

- [1. Observaciones de diseño](#1-observaciones-de-diseño)
- [2. Patrones recurrentes](#2-patrones-recurrentes)
- [3. Precedencia de fuentes](#3-precedencia-de-fuentes)

---

## 1. Observaciones de diseño

| # | Observación | Criticidad |
|---|---|---|
| 1 | `configuraciones` parece legacy — `configuracion_fechas` es la tabla activa. Verificar si `configuraciones` sigue siendo leída en alguna parte del código. | Media |
| 2 | `checkins` (por materia + coincidencia numérica) sugiere un sistema de asistencia por QR/NFC no expuesto en la UI visible. Puede ser una funcionalidad suspendida. | Baja |
| 3 | `mark_all_notifications_read()` actualiza `fecha_lectura` pero **no cambia `leida = true`** (verificado 2026-09-21 en Q6). Si la lógica de "leída" depende de `fecha_lectura IS NOT NULL`, está bien; si no, es un bug. | Media |
| 4 | Las policies de `notificaciones` y `notificaciones_usuarios` tienen duplicados (dos INSERT, dos UPDATE). Postgres aplica ambas con OR para PERMISSIVE, pero genera confusión. | Baja |
| 5 | `encuadre_evidencias.foto_url` apunta al bucket `evidencias-encuadre` de Supabase Storage. En local no es replicable sin MinIO u otro storage compatible. | Alta para migración local |
| 6 | Passwords en `usuarios.contraseña` van con bcrypt (salt 12). La columna se llama `contraseña` en español — verificar collation/encoding en Postgres local (Windows). | Media |
| 7 | `fn_fanout_anuncio(anuncio_id uuid)` referencia `user_notifications` que no existe. Si se ejecuta, falla en tiempo de ejecución. | Alta (ver [riesgos §3](./riesgos.md#3-código-muerto-en-la-bd)) |

---

## 2. Patrones recurrentes

### Patrón outbox para correo (`email_outbox`)

Los endpoints REST **no envían correo directo**: encolan en `email_outbox` con `status = "pending"`. Un worker externo (no incluido en el repo) toma los pendientes y envía.

**Por qué:** desacoplar la creación del usuario del envío de correo. Si el proveedor SMTP está caído, el usuario ya está creado en BD; el correo se reintenta después. Aceptable para "creación de usuarios" pero pobre para "restablecer contraseña" (feedback inmediato).

**Consecuencia si se elimina:** habría que meter el envío inline en cada endpoint y hacerse cargo de reintentos + fallos parciales dentro de la misma transacción.

### Estampas de auditoría (`ultimo_editor_id`, `ultima_edicion`, `creado_por`, etc.)

Varias tablas (`programas`, `encuadres`, `permisos_operacion_encuadre`) llevan quién modificó por última vez y cuándo. Las escrituras suceden **desde la app** (no en triggers), por eso cada hook las setea manualmente.

**Por qué en app y no en trigger:** los triggers en Supabase pueden usar `auth.uid()` pero requieren que el JWT esté firmado por Supabase Auth (aquí se usa NextAuth). Setear desde app permite reutilizar `session.user.id`.

**Consecuencia:** cualquier query que salte la app (RPC directa desde el cliente con anon key, ver [riesgos §4.1 Q3+Q9](./riesgos.md#q3--q9--rls-off--anon-con-todos-los-privilegios-seguridad-crítica)) deja auditoría inconsistente.

### Estados como ENUMs (`anuncio_estado`, `categoria_enum`, `requisito_enum`)

Elegido sobre `CHECK constraint` con strings porque ENUM da error de tipo al escribir un valor inválido, en lugar de un `check violation` genérico. Trade-off conocido: añadir un valor requiere `ALTER TYPE ... ADD VALUE`, no puede quitarse fácilmente.

### Delete-all + insert desde la app (sin transacción)

Ver [`../codigo/decisiones.md`](../codigo/decisiones.md) — decisión que vive en los hooks pero afecta a estas tablas: `criterios_evaluacion`, `unidades`, `temas`, `practicas_taller`, `practicas_laboratorio`.

Consecuencia sobre la BD: no hay FK de integridad temporal que garantice que un `guardar` termina completo. Riesgo mitigado por escala pequeña; migrar a RPC transaccional si crece.

---

## 3. Precedencia de fuentes

**Regla:** si el PDF de entrega y este doc discrepan, gana [`./schema_completo.sql`](./schema_completo.sql). Si el SQL y Supabase discrepan, gana Supabase y hay que actualizar el SQL.

**Snapshots congelados no reeditables:**

- `docs/database/Documentacion_Base_Datos_ENCUADRES_FCQI_ENTREGA.pdf` — dashboard de Supabase al momento de la entrega.
- `docs/Documentacion_Tecnica_ENCUADRES_FCQI_ENTREGA.pdf` — documentación técnica al momento de la entrega.

Ambos son evidencia histórica; discrepancias posteriores viven en [`./bd.md`](./bd.md), [`./riesgos.md`](./riesgos.md) y este archivo.
