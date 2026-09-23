# Riesgos y hallazgos — Código

Catálogo de bugs, ⚠️, divergencias con schema, stubs, código muerto y "candidatos a borrar" en el código de la app.

> Para la referencia normal ver [`./codigo.md`](./codigo.md).
> Para el porqué de decisiones ver [`./decisiones.md`](./decisiones.md).
> Para riesgos de BD ver [`../database/riesgos.md`](../database/riesgos.md).

## Índice

- [1. Páginas y layouts](#1-páginas-y-layouts)
- [2. Componentes](#2-componentes)
- [3. Hooks](#3-hooks)
- [4. Utilidades, middleware y auth](#4-utilidades-middleware-y-auth)
- [5. Endpoints REST](#5-endpoints-rest)
- [6. Archivos huérfanos y candidatos a borrar](#6-archivos-huérfanos-y-candidatos-a-borrar)

---

## 1. Páginas y layouts

### Login y layout raíz

| Hallazgo | Ubicación | Consecuencia |
|---|---|---|
| Login navega siempre a `/admin`, no lee `callbackUrl` | `app/(auth)/page.tsx` | Middleware redirige por rol, pero se pierde el `callbackUrl` del intento original |
| Botón "¿Olvidaste tu contraseña?" sin handler ni enlace | `app/(auth)/page.tsx` | Recuperación de contraseña no existe |
| Login: si no llega `error` ni `ok`, termina sin navegación ni mensaje | `app/(auth)/page.tsx` | Silencio ante caso raro |
| `Bell` icon del layout autenticado es botón sin handler | `app/(main)/layout.tsx` | No monta `NotificationBell` — feature invisible |
| Rol `personal` sin destino en middleware | `middleware.ts:6-21` | Usuario con `role=personal` queda atrapado en `/` sin redirect |
| `VerificarPeriodo` es fail-open ante error o sin configuración | `verificar-periodo.tsx` | Preferir permitir contenido a bloquearlo; expone si Supabase falla en la consulta |

### Admin

| Hallazgo | Ubicación | Consecuencia |
|---|---|---|
| `admin/usuarios`: cambio de rol UPDATE sin renovar JWT afectado | `app/(main)/admin/usuarios/page.tsx` | Usuario logueado con rol viejo hasta re-login |
| `admin/usuarios`: en `fetchData`, error de consulta hace `return` antes de `setLoading(false)` | ídem | Spinner permanente ante error |
| `admin/usuarios`: no protege contra auto-eliminación | ídem | Admin puede borrarse a sí mismo |
| `admin/usuarios` (importar): no aplica todas las validaciones del alta manual | ídem | Importar puede meter usuarios que el alta manual habría rechazado |
| ⚠️ `admin/crear-usuario`: formulario alternativo **sin persistencia** — submit navega a `/admin/users` (ruta sin `page.tsx`) | `app/(main)/admin/crear-usuario/page.tsx` | El alta funcional vive en `AddUserModal`. Candidato a borrar |
| `admin/materias` (alta): segundo INSERT (programas) no se comprueba | `app/(main)/admin/materias/page.tsx` | Puede anunciar éxito con materia invisible |
| `admin/materias` (edición): si falla el 2º UPDATE informa parcial, no revierte el 1º | ídem | Estado inconsistente |
| `admin/materias` (`ModalEliminarPeriodo`): lote RPC una por una, sin transacción | ídem | Fallo a mitad deja estado parcial |
| `admin/materias` (importar Excel): reimportar puede modificar catálogo compartido entre periodos | ídem | Cambio no localizado |
| `admin/anuncios`: DELETE no añade filtro de estado | `app/(main)/admin/anuncios/page.tsx` | Sin garantía contra cambios concurrentes |
| `admin/anuncios/crear`: "Todos" = profesor + personal + alumno (no los 6 roles BD) | `app/(main)/admin/anuncios/crear/page.tsx` | Semántica ambigua |
| `admin/anuncios/crear`: marcar enviado es escritura de estado — no envía correos | ídem | Confusión de vocabulario |
| ⚠️ `admin/anuncios/preview`: `decodeURIComponent` extra puede lanzar `URIError` sin captura | `app/(main)/admin/anuncios/preview/page.tsx` | Con contenido tipo `"Avance del 50%"` truena |
| `admin/anuncios/preview`: `escapeHtml` declarado pero no usado | ídem | Ruido |
| `admin/anuncios/preview`: título/mensaje quedan en URL/historial | ídem | Fuga por history del navegador |
| `admin/configurar-fecha`: no desactiva existentes ni impide solapamientos | `app/(main)/admin/configurar-fecha/page.tsx` | Múltiples ventanas activas simultáneas |
| `admin/configurar-fecha`: `hoyISO()` toma día UTC pero hora es local | ídem | Discrepancia cerca del cambio de día |
| **Divergencia:** aquí se gestionan múltiples ventanas/banderas, pero `VerificarPeriodo` solo considera la creación más reciente activa | ídem | Config no refleja lo que el usuario ve |
| ⚠️ `admin/herramientas/clonar-periodo`: **RPC inexistente en BD** — la feature está rota | `app/(main)/admin/herramientas/clonar-periodo/page.tsx:147` | Ver [`../database/riesgos.md §2`](../database/riesgos.md#2-rpc-clonar_estructura_periodo--no-existe) |
| `admin/herramientas/clonar-periodo`: consultas iniciales ignoran `error` | ídem | Catálogos pueden salir vacíos |
| `admin/herramientas/permisos-especiales`: filtra usuarios por rol pero no restringe selector a relación real usuario↔encuadre | `app/(main)/admin/herramientas/permisos-especiales/page.tsx` | Puede dar permiso a alumno sin inscripción |
| `admin/herramientas/permisos-especiales`: no verifica inscripción/asignación ni evita duplicados | ídem | |
| `admin/herramientas/permisos-especiales`: `Math.ceil` en días → 24h post-vencimiento aún aparece no vencido | ídem | Vista engañosa |
| `admin/herramientas/permisos-especiales`: ignora `error` de las 6 consultas de carga | ídem | Estado parcial silencioso |
| `admin/resultados`: no filtra programas por activo/archivado | `app/(main)/admin/resultados/page.tsx` | Estadísticas mezclan periodos |
| `admin/resultados`: con registros pero sin temas comunes queda 0%/"Alta" | ídem | Aparenta discrepancia sin base |
| `admin/resultados`: checkins duplicados: último iterado gana sin orden explícito | ídem | No determinístico |

### Capturista

| Hallazgo | Ubicación | Consecuencia |
|---|---|---|
| `capturista/materias`: consultas secuenciales en bucles — peticiones crecen con catálogo | `app/(main)/capturista/materias/page.tsx` | Rendimiento pobre |
| `capturista/materias`: sin `try/finally` general — excepción puede dejar carga activa | ídem | Spinner colgado |
| **PUA completo** exige taller aun con HT=0 → difiere del recorrido real | ídem | Indicador engaña |
| `capturista/encuadre`: filtra profesores por UUID de rol fijo (`bc3ab654-...`) | `app/(main)/capturista/materias/[clave]/encuadre/page.tsx` | Cambio de UUID en BD rompe el listado |
| `capturista/encuadre`: no verifica ventana operativa ni activo/archivado al guardar | ídem | Ocultar del listado no impide abrir URL directa |
| `capturista/pua`: "Guardar cambios" (PUA completo) solo verifica permiso y programa — no repite validaciones de contenido | `app/(main)/capturista/materias/[clave]/pua/page.tsx` | Se puede guardar PUA vacío |
| `capturista/pua`: `puaCompleto` no exige campos básicos aquí ni `n_unidades > 0`. No comprueba laboratorio ni condiciona taller a HT | ídem | Difiere del cálculo en listado |
| `capturista/pua`: confirmación al salir sin guardar **solo** en botones de navegación (no sidebar/cierre pestaña/navegador) | ídem | Pérdida silenciosa de cambios |
| `capturista/pua`: protección de "confirmar al salir" no se aplica a las otras 3 pantallas | ídem | Solo cubre PUA principal |
| `capturista/pua`: permiso se lee del estado cargado, no de nueva consulta antes del UPDATE | ídem | Race si permiso expira |
| `capturista/unidades`: sin permiso oculta guardar pero **no pasa readonly** a `<Unidad>` | `app/(main)/capturista/materias/[clave]/pua/unidades/page.tsx` | Campos editables locales sin persistir |
| `capturista/unidades`: INSERT de temas puede fallar y hook aún devolver éxito si auditoría se guarda | ídem | Datos huérfanos |
| `capturista/taller` y `laboratorio`: componentes conservan campos editables locales sin permiso | | Igual patrón que unidades |
| `capturista/taller`/`laboratorio`: `practicasCargadas` evita recargas pero no se reinicia al cambiar `programaId` | | Puede conservar prácticas del programa anterior |

### Profesor

| Hallazgo | Ubicación | Consecuencia |
|---|---|---|
| ⚠️ `profesor/encuadres` y `profesor/encuadres/[clave]` son **vistas paralelas** a `/profesor/cursos` — no enlazadas desde sidebar | `app/(main)/profesor/encuadres/*` | Dos entradas al mismo dominio con capacidades no equivalentes |
| ⚠️ `profesor/encuadres/[clave]`: **reimplementación paralela** de `EncuadreTab` con reglas distintas (textareas siempre readonly, no consulta `usePermisoOperacion`) | `app/(main)/profesor/encuadres/[clave]/page.tsx` | Mismo encuadre editable con reglas distintas según la ruta |
| `profesor/encuadres`: conserva `console.log` de depuración | `app/(main)/profesor/encuadres/page.tsx` | Ruido |
| `profesor/page.tsx`: `text.sm` (con punto) en vez de `text-sm` | `app/(main)/profesor/page.tsx` | Clase Tailwind no aplica |
| `profesor/cursos`: "Avances" solo mide si alumno hizo ≥1 checkin — nombre engañoso | `app/(main)/profesor/cursos/page.tsx` | No mide cumplimiento del programa |
| `profesor/cursos`: fallo temprano de `encuadres` hace `setLoading(false)` sin limpiar tabla previa ni avisar | ídem | Datos rancios |
| `profesor/cursos/[id]/EncuadreTab`: monta `<EvidenciaEncuadre puedeSubir={true}>` sin gate por permiso operativo | `EncuadreTab.tsx` | Puede subir evidencia fuera de ventana |
| `AlumnosTab`: `enviarCorreo` no expuesto a UI | `AlumnosTab.tsx` | Capacidad invisible |
| `AlumnosTab`: asimetría revocar (confirm) / reactivar (sin confirm) | ídem | Reactivación accidental |
| ⚠️ `profesor/avances` y `profesor/avances/[clave]` son **prototipos con datos hardcodeados** | `app/(main)/profesor/avances/*` | Candidatos a borrar |

### Alumno

| Hallazgo | Ubicación | Consecuencia |
|---|---|---|
| `alumno/cursos`: errores a consola + toast simple; sin retry | `app/(main)/alumno/cursos/page.tsx` | UX pobre en fallo |
| `alumno/cursos/[id]/AvancesTab`: **sin control de salida sin guardar** | `AvancesTab.tsx` | Cambiar pestaña pierde el estado local |

### Lector

| Hallazgo | Ubicación | Consecuencia |
|---|---|---|
| ⚠️ `/lector/reportes` es archivo vacío (0 bytes) | `app/(main)/lector/reportes/page.tsx` | 404. Candidato a implementar o borrar |
| `lector` inicio: `totalCursos` cuenta **todos** los encuadres (sin filtro de periodo ni de datos) | `app/(main)/lector/page.tsx` | KPI engañoso |
| `lector` inicio: errores solo a consola; fallo → KPIs en 0 | ídem | Sin distinción entre "sin datos" y "error" |
| `lector/cursos` (paginación): siempre imprime `1..5` — sin windowing dinámico | `app/(main)/lector/cursos/page.tsx` | En páginas altas los botones apuntan mal |
| `lector/cursos/[encuadre_id]`: clave de checkin **no incluye grupo** aquí porque la consulta ya filtró por grupo | ídem | Difiere del listado (multi-encuadres) — intencional pero frágil |

---

## 2. Componentes

### Bloque 5A — Layout

| Hallazgo | Ubicación | Consecuencia |
|---|---|---|
| `menuItemsByRole` local en `app-sidebar.tsx` vs `lib/sidebar-items.ts` | `app-sidebar.tsx:33-62` | Dos fuentes de verdad |
| `dynamic-header.tsx` duplica títulos `routeNames` ↔ `translations` | `dynamic-header.tsx` | Fricción al añadir rutas; el fallback puede mostrar `"[encuadre_id]"` si el segmento no es UUID |
| `logout-button.tsx` importa `useRouter` sin usarlo | `logout-button.tsx:3` | Ruido |
| ⚠️ `notification-bell.tsx`: **no montado en la app** + 4 divergencias con schema | `notification-bell.tsx` | Ver "Divergencias con el schema" abajo |
| ⚠️ `notificaciones-dropdown.tsx`: archivo vacío (0 bytes) | `notificaciones-dropdown.tsx` | Candidato a borrar |

**`notification-bell.tsx` — divergencias con el schema real:**

| Línea(s) | Componente usa | Schema real | Consecuencia |
|---|---|---|---|
| 57-61, 141-145 | tabla `profiles`, col `email` | tabla `usuarios`, col `correo` | Query nunca devuelve datos |
| 95, 120 | UPDATE `leido` + `updated_at` | `leida` + `fecha_lectura` | UPDATE falla |
| 10-17 | `interface Notification.leido` | col `leida` | Estado local desincronizado |
| 149-164 | realtime filtro `user_id` | col `usuario_id` | Filtro no matchea |

**Para integrarlo:** reemplazar `profiles→usuarios`, `email→correo`, `leido→leida`, `updated_at→fecha_lectura`, `user_id→usuario_id`; montar en `app/(main)/layout.tsx`; verificar realtime habilitado en Supabase. Cruza con [`../database/riesgos.md §1 adv. 3`](../database/riesgos.md#1-advertencias-importantes).

### Bloque 5B — Editores PUA

| Hallazgo | Ubicación | Consecuencia |
|---|---|---|
| `ContenidoEditor` genera incisos (nivel 4) que `useUnidadesForm` **no re-parsea** | `contenido-editor.tsx` vs `useUnidadesForm.ts` | Incisos se pintan y se serializan, pero al volver del padre desaparecen. Bug de round-trip. |
| `ContenidoEditor` usa `Date.now() + Math.random()` como ID | `contenido-editor.tsx` | IDs no estables entre serializar → deserializar |
| `ContenidoEditor`: sin validación de máximo 3 niveles en "agregar hijo" | ídem | UI solo muestra "Agregar inciso" en subtemas pero no bloquea profundidades ulteriores |
| `unidad.tsx`: `duracion` string libre (no number) | `unidad.tsx` | Sin validación de tipo |
| `unidad.tsx`: no valida `semana_inicio ≤ semana_fin` | ídem | Responsabilidad del padre |
| ⚠️ `practica-taller.tsx` es copia casi literal de `practica-laboratorio.tsx` | | Duplicación. Refactor a `PracticaEditor` genérico. |
| `TablaCriterios` no valida suma = 100 ni rangos 0..100 | `criterios.tsx` | Confía en el padre |
| ⚠️ `TablaCriterios` **sin consumidores en el repo** | `criterios.tsx` | El encuadre del capturista usa tabla propia |

### Bloque 5C — Encuadre y alumnos

| Hallazgo | Ubicación | Consecuencia |
|---|---|---|
| `<Materia>` decide comportamiento por comparación de strings de `btnText` | `materia.tsx:28` | Patrón frágil |
| ⚠️ `FullEncuadreTable` **sin consumidores** — emite `acepto: true` sin interacción real | `FullEncuadreTable.tsx:63,65` | Consentimiento implícito engañoso |
| `FullEncuadreTable` no valida `nombre` no vacío antes de `onSave` | `FullEncuadreTable.tsx:65` | Se puede firmar sin nombre |
| `FullEncuadreTable` no valida que la suma real de `evaluacionRows` coincida con `totalValor` | ídem | Total inconsistente aceptado |
| ⚠️ `LearningPlanTable` **sin consumidores** — competencia del curso **hardcodeada** en JSX | `LearningPlanTable.tsx:148-151` | Usar con otra materia muestra el texto equivocado |
| `LearningPlanTable`: no valida todas las unidades tengan respuesta | `LearningPlanTable.tsx:66-71` | Submit vacío emite `{ vista: null }` |
| `LearningPlanTable`: checkboxes Sí/No independientes → permite marcar ambos | ídem | |
| `EvidenciaEncuadre`: fotos huérfanas — cada reemplazo hace path nuevo + INSERT, nunca borra anteriores | `EvidenciaEncuadre.tsx:107-131` | Bucket crece sin control |
| `EvidenciaEncuadre`: `upsert:true` con path único → flag inútil | `EvidenciaEncuadre.tsx:110-112` | |
| `EvidenciaEncuadre`: `profesor_id` viene del cliente (`session.user.id`) | ídem | RLS debe bloquear suplantación (hoy RLS OFF — ver [`../database/riesgos.md §4.1`](../database/riesgos.md#41-hallazgos-críticos)) |
| `EvidenciaEncuadre`: sin loader visible durante upload | ídem | UX pobre |
| `AlumnosEncuadreCard.handleEnviarCorreo` **no cableado** a ningún botón | `alumnosEncuadreCard.tsx:197` | Feature invisible |
| `AlumnosEncuadreCard`: asimetría revocar (confirm) / reactivar (sin confirm) | `alumnosEncuadreCard.tsx:244-281` | Reactivación accidental |
| `AlumnosEncuadreCard`: clave en claro en confirm | `alumnosEncuadreCard.tsx` | Puede leakear por capturas — esperado por diseño |
| ⚠️ `invite.tsx`: stub visual sin handler — submit solo cierra modal | `invite.tsx` | Candidato a borrar. Copy contradice el flujo real |

### Bloque 5D — Modales y utilidades

Sin hallazgos críticos individuales; ver [`./decisiones.md §5`](./decisiones.md#5-bloque-5d--modales-y-utilidades) para trade-offs.

---

## 3. Hooks

| Hallazgo | Ubicación | Consecuencia |
|---|---|---|
| `use*Form` no transaccionales: fallo a mitad deja set vacío/parcial | `useLaboratorioForm.ts`, `useTallerForm.ts`, `useUnidadesForm.ts`, `useEncuadreForm.ts` | Riesgo de estados inconsistentes; ver [`./decisiones.md §6`](./decisiones.md#6-hooks--decisiones-no-obvias) |
| `useUnidadesForm.guardarUnidades` = 4 pasos sin transacción; paso 4 puede dejar datos huérfanos | `useUnidadesForm.ts` | Temas sin unidad borrada |
| `useUnidadesForm` extractor solo re-parsea niveles 2-3 | ídem | Incisos (nivel 4) se pierden en round-trip |
| `useEncuadreAlumnos.reactivarAcceso`: borrado en cascada manual sin transacción | `useEncuadreAlumnos.ts` | Si falla a la mitad, alumno "medio limpio" |
| `useEncuadreAlumnos.enviarCorreo` aborta si `reenvios >= 3` | ídem | Límite no expuesto en UI |
| `useRegistroAvances.guardarCheckins` UPSERT manual (SELECT → UPDATE/INSERT) | `useRegistroAvances.ts` | No hay UNIQUE compuesto `(tema_id, usuario_id, grupo)` garantizado; race entre check y write |
| `useRegistroAvances.guardarCheckins` **NO** valida permiso (delega a RLS) | ídem | En local sin RLS no hay defensa |
| `usePermisoPua` fail-closed ante error | `usePermisoPua.ts` | Aceptado por diseño |
| `use-mobile.ts` retorna `false` en primer render SSR | `use-mobile.ts` | Flash de layout desktop en móvil |

---

## 4. Utilidades, middleware y auth

| Hallazgo | Ubicación | Consecuencia |
|---|---|---|
| `lib/permisoOperacion.ts`: errores de Supabase se loguean pero no interrumpen (líneas 96, 183, 291, 322, 351) | `lib/permisoOperacion.ts` | Prefiere permiso restrictivo por defecto (aceptado) |
| `lib/permisoOperacion.ts`: herencia profesor→alumno se calcula en JS, no en trigger BD | ídem | Consulta directa a BD no la resuelve |
| `lib/permisoOperacion.ts`: fechas se comparan como strings `yyyy-MM-dd` | líneas 100-107 | Funciona por orden lexicográfico ISO; frágil ante formatos alternativos |
| `lib/permisoOperacion.ts`: `format(ahora, ...)` usa zona horaria del **servidor** | ídem | En Vercel es UTC, en local puede diferir → discrepancia en frontera de día |
| Índices reales en Supabase divergen de los declarados en SQL | verificado 2026-09-21 | Nombres `permisos_op_lookup_idx` (no `idx_permisos_lookup_encuadre`). **No existe** índice sobre `configuracion_fechas(activo)`. Ver [`../database/riesgos.md §4.2 Q14`](../database/riesgos.md#42-hallazgos-menores-informativos) |
| `lib/sidebar-items.ts`: admin tiene entrada `"Alumnos invitados"` a `/admin/invitados` | `lib/sidebar-items.ts` | Verificar que exista `app/(main)/admin/invitados/`; si no, item huérfano |
| `middleware.ts`: rol `personal` **no** mapeado | `middleware.ts` | Usuario con `role=personal` queda en `/` |
| `next-auth.d.ts`: `role` es `string` genérico, no union type | `next-auth.d.ts` | No hay seguridad de tipos por rol |

---

## 5. Endpoints REST

### `/api/auth/[...nextauth]`

| Hallazgo | Consecuencia |
|---|---|
| **Login reactiva TODOS los encuadres del alumno**: `UPDATE encuadre_alumnos SET estado='activa'` filtra solo por `alumno_id` | Un `estado="revocada"` puesto a mano por profesor **se reactiva silenciosamente al siguiente login**. Contradice `revocarAcceso`. |
| El `role` viaja en JWT; cambio de rol en BD no se refleja hasta re-login o expiración | Ventana de tiempo con rol viejo |

### `POST /api/usuarios/crear`

| Hallazgo | Consecuencia |
|---|---|
| **No valida sesión** | Cualquier cliente puede crear cuentas con cualquier `rol_id` (incluido admin) |
| Usa `.single()` sin `.maybeSingle()` | Cuando el correo no existe, Supabase devuelve error que el código ignora silenciosamente. Funciona por accidente. |

### `POST /api/usuarios/crear-masivo`

| Hallazgo | Consecuencia |
|---|---|
| **Sin transacción** | Si el proceso muere a mitad, usuarios creados sin rollback |
| **N queries secuenciales**: para 500 usuarios son ~1000 round-trips | Puede superar timeout de Vercel (10s Hobby, 60s Pro) |
| **No valida sesión** (mismo problema que `crear`) | |

### `POST /api/alumnos/agregar`

| Hallazgo | Consecuencia |
|---|---|
| **No valida sesión**: acepta `profesorId` del cliente sin verificar que el llamador sea ese profesor | Suplantación |
| **Reset silencioso de contraseña**: si viene `clave`, la contraseña del alumno se sobreescribe sin autorización | Un atacante con el correo institucional puede secuestrar cuentas |

### `POST /api/alumnos/registrar`

| Hallazgo | Consecuencia |
|---|---|
| **No valida sesión** | Igual patrón |
| **Placeholder literal `[URL del sistema]`** en la plantilla del correo | Sustituir por variable de entorno antes de producción |
| El "nombre" del alumno es la parte local del correo | Hasta que el alumno lo edite — pero no hay UI para editarlo desde el rol alumno |
| **Rollback manual frágil**: el `DELETE` post-fallo depende de que la conexión siga viva | Si el DELETE también falla, usuario huérfano |

---

## 6. Archivos huérfanos y candidatos a borrar

Archivos que existen en el repo pero no están conectados al flujo real. Candidatos a limpieza:

| Archivo | Estado | Motivo |
|---|---|---|
| `app/(main)/admin/crear-usuario/page.tsx` | Formulario sin persistencia | Alta funcional vive en `AddUserModal` de `/admin/usuarios` |
| `app/(main)/profesor/encuadres/page.tsx` | Vista paralela a `/profesor/cursos` no enlazada | Duplica funcionalidad con reglas distintas |
| `app/(main)/profesor/encuadres/[clave]/page.tsx` | Reimplementación paralela de `EncuadreTab` | Divergencia peligrosa: mismo encuadre editable con reglas distintas |
| `app/(main)/profesor/avances/page.tsx` | Prototipo con datos hardcodeados | Flujo real vive en `AvancesTab` |
| `app/(main)/profesor/avances/[clave]/page.tsx` | Prototipo | Ídem |
| `app/(main)/lector/reportes/page.tsx` | **Archivo vacío (0 bytes)** | 404 real |
| `components/notification-bell.tsx` | No montado + 4 divergencias con schema | Candidato a arreglar y montar, o borrar |
| `components/notificaciones-dropdown.tsx` | **Archivo vacío (0 bytes)** | Stub abandonado |
| `components/criterios.tsx` (`TablaCriterios`) | Sin consumidores | El encuadre usa tabla propia |
| `components/FullEncuadreTable.tsx` | Sin consumidores + consentimiento implícito engañoso | |
| `components/LearningPlanTable.tsx` | Sin consumidores + hardcode | |
| `components/invite.tsx` | Stub visual sin handler | Copy contradice el flujo real |
