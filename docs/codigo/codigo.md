# Referencia técnica del código

Documentación consolidada de páginas, componentes, hooks, utilidades y endpoints.
Cada sección se corresponde con una carpeta del código fuente.

> Para bugs, ⚠️ y "candidatos a borrar" ver [`./riesgos.md`](./riesgos.md).
> Para decisiones de diseño y patrones ver [`./decisiones.md`](./decisiones.md).
> Para riesgos de BD ver [`../database/riesgos.md`](../database/riesgos.md).

## Índice

- [Páginas y layouts](#páginas-y-layouts)
- [Componentes](#componentes)
- [Hooks](#hooks)
- [Utilidades, middleware y auth](#utilidades-middleware-y-auth)
- [Endpoints REST](#endpoints-rest)

---

## Páginas y layouts

Los grupos `(auth)` y `(main)` organizan los archivos y no forman parte de las URLs.

### Layout raíz

Server Component asíncrono compartido por todas las rutas.

| Campo | Detalle |
|---|---|
| **Archivo** | `app/layout.tsx` |
| **Datos** | `getSession()` de `lib/auth.ts` |
| **Proveedores** | `RootLayout → SessionProvider(session) → ConfirmProvider → ToastProvider → children` |
| **Config** | `lang="es"`, fuentes Geist/Geist Mono, metadatos «Encuadres FCQI» |

### Login

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(auth)/page.tsx` |
| **URL** | `/` |
| **Acceso** | Público. Con JWT válido, middleware redirige al panel del rol |
| **Flujo** | `signIn("credentials", { email, password, redirect: false })` → si `ok` redirige a `/admin` (middleware corrige por rol) |

### Layout autenticado

Componente cliente compartido por todas las páginas autenticadas.

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/layout.tsx` |
| **Sesión** | `useSession()`. Sin sesión → `null` + efecto `router.push("/")` |
| **Estructura** | `SidebarProvider` → `AppSidebar(role)` + `SidebarInset` (header + `DynamicHeader` + main con `VerificarPeriodo → children`) |
| **Datos** | `session.user.{id,role,name}`. Iniciales: 2 letras máx, mayúsculas |

**Casos de `VerificarPeriodo`:**

| Caso | Comportamiento |
|---|---|
| Admin o capturista | Exentos; muestra páginas sin consultar ventana global |
| Profesor o alumno | Busca permiso activo propio en `permisos_operacion_encuadre` por usuario/rol/rango |
| Sin permiso (incluido lector) | Consulta `configuracion_fechas` activa más reciente; compara fecha/horario con hora local |
| Fuera de fechas u horario | Sustituye contenido por «Sistema no disponible»; sidebar/encabezado permanecen |

---

## Administrador

Componentes cliente bajo `/admin`, reservado por middleware al rol `admin`. Layout exige sesión y exime del bloqueo de periodo. Consultas directas con `lib/supabase.ts` (anon).

Los listados paginan 10 filas en memoria. Componentes shadcn/ui.

### Admin inicio

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/admin/page.tsx` |
| **URL** | `/admin` |
| **Datos** | `useSession()` → `session.user.name` |
| **Flujo** | Presenta descripciones de módulos y accesos rápidos a `/admin/usuarios` y `/admin/resultados` |

### Admin usuarios

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/admin/usuarios/page.tsx` |
| **URL** | `/admin/usuarios` |
| **Datos** | Paralelo: `usuarios(id, correo, nombre, rol_id)` + `roles(id, nombre)`. Filtros por rol/texto, conteos, tabla paginada |
| **Operaciones** | Cambiar rol · Eliminar · Crear (`AddUserModal` → `POST /api/usuarios/crear`) · Importar Excel (`xlsx`, columnas correo/nombre/contraseña/rol → `POST /api/usuarios/crear-masivo`) |

**`AddUserModal` (`components/add-user.tsx`):** overlay custom con correo · nombre ≥3 · contraseña ≥6 · rol. Botón `generarClaveSegura(12)`. No consulta BD; delega al padre.

### Admin materias

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/admin/materias/page.tsx` |
| **URL** | `/admin/materias` |
| **Unidad de tabla** | Un programa por materia y periodo |
| **Datos** | Catálogo `materias` + por materia `programas` + `encuadres` + últimos editores en `usuarios`. Paralelo: `licenciaturas` activas |
| **Filtros** | Texto, licenciatura, categoría, requisito, estado, archivo, periodo. Oculta archivados por defecto |
| **UI** | `ModalAgregarMateria`, `ModalEditarMateria`, `useConfirm()`, toasts. Botón de copia abre clonar periodo |

**Acciones sobre materias/programas:**

| Acción | Comportamiento |
|---|---|
| Alta | INSERT `materias` + INSERT `programas` (borrador, activo, no archivado) |
| Edición | UPDATE `materias` + UPDATE `programas` (periodo/plan). Clave no modificable. Bloqueada en periodos archivados |
| Activar/desactivar | UPDATE `programas.activo`; bloqueada si archivado |
| Archivar/desarchivar | Confirma + UPDATE `archivado`/`archivada_at`/`archivada_por` |
| Eliminar | RPC `eliminar_programa_periodo({ p_programa_id })`. Si quedan 0 programas, solicita borrar materia |
| Gestionar licenciaturas | INSERT/UPDATE/DELETE en `licenciaturas`. Rename actualiza `materias.licenciatura` |
| Importar Excel | Primera hoja sin cabecera. Exige licenciaturas existentes. `upsert materias` por `clave` |

### Admin anuncios

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/admin/anuncios/page.tsx` |
| **URL** | `/admin/anuncios` |
| **Datos** | `anuncios(id, titulo, estado, metodo, destinatarios, enviado_at, created_at)` desc por creación |
| **Filtros** | Título, estado, método; conteos globales; paginación |
| **Flujo** | Crear/editar → `ModalCrearAnuncio` (ID opcional); al guardar recarga. Borrar → confirma + DELETE |

### Admin anuncios crear

Editor alternativo al modal del listado.

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/admin/anuncios/crear/page.tsx` |
| **URL** | `/admin/anuncios/crear` (`?id=<anuncio>` opcional) |
| **Validación** | Título 5–200, mensaje 10–5000, exige destinatarios y método (`correo`/`notificacion`/`ambos`). Fecha programada: futura, ≤ 1 año |
| **Flujo** | INSERT o UPDATE directo en `anuncios`. Antes de editar re-consulta estado para bloquear enviados. Éxito → toast + navega tras 1.5s |

### Admin anuncios preview

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/admin/anuncios/preview/page.tsx` |
| **URL** | `/admin/anuncios/preview?titulo=...&mensaje=...` |
| **Flujo** | Lee params, valida longitudes. Inválidos → advertencias junto a maquetas correo/notificación |

### Admin configurar fecha

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/admin/configurar-fecha/page.tsx` |
| **URL** | `/admin/configurar-fecha` |
| **Datos** | `configuracion_fechas` orden desc por `fecha_inicio` |
| **Plantillas** | Captura PUA, captura encuadres (incluye firma), corte de avances, solo firmas |
| **Flujo** | Crear → INSERT con `activo:true`. Activar/desactivar → UPDATE. Eliminar → DELETE |

### Admin clonar periodo

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/admin/herramientas/clonar-periodo/page.tsx` |
| **URL** | `/admin/herramientas/clonar-periodo` |
| **Flujo** | Elegir periodo completo o materia → RPC `clonar_estructura_periodo({...})` → espera conteos de programas/unidades/temas/prácticas/encuadres/criterios |

### Admin permisos especiales

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/admin/herramientas/permisos-especiales/page.tsx` |
| **URL** | `/admin/herramientas/permisos-especiales` (no enlazada desde sidebar) |
| **Datos** | Paralelo: `roles`, `usuarios`, `encuadres`, `programas`, `materias`, permisos activos de `permisos_operacion_encuadre` |
| **Escenarios** | Materia asignada tarde (profesor, 15d) · Alumno tardío (15d) · Corregir encuadre (7d) · Solo consulta (30d) |
| **Flujo** | Guardar → INSERT con `creado_por`, `activo:true`. Retirar → UPDATE `activo:false` |

### Admin resultados

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/admin/resultados/page.tsx` |
| **URL** | `/admin/resultados` |
| **Datos** | 9 consultas: `encuadres`, `programas`, `materias`, profesores/alumnos, `encuadre_alumnos`, `unidades`, `temas`, `temas_checkin` |
| **Cálculo** | Coincidencia: solo compara temas donde profesor y alumno tienen registro. `% = round(100 × coincidencias / comparables)`. Clasifica: ≥80 Alta, ≥50 Moderada, <50 Baja |

### Admin resultados detalle

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/admin/resultados/[encuadre_id]/[alumno_id]/page.tsx` |
| **URL** | `/admin/resultados/<encuadre_id>/<alumno_id>` |
| **Datos** | Encuadre → programa → materia + nombres profesor/alumno + unidades/temas + 2 consultas `temas_checkin` filtradas |
| **UI** | Agrupa temas por unidad. Muestra Sí/No/Sin registrar + justificaciones + coincidencia. Solo lectura |

---

## Capturista

7 páginas cliente bajo `/capturista`, prefijo restringido por middleware. Layout exige sesión y exime del control general de periodo. Cliente Supabase anon.

**Flujo del PUA:**
```text
Materias → Datos generales → Unidades
                               ├─ HT > 0 → Taller → HL > 0 → Laboratorio → Materias
                               │                  └─ HL ≤ 0 → Materias
                               ├─ HT ≤ 0 y HL > 0 → Laboratorio → Materias
                               └─ HT ≤ 0 y HL ≤ 0 → Materias
```

`usePermisoPua` consulta `programas`, ventanas activas de `configuracion_fechas` y permisos por usuario/programa/rol capturista.

### Capturista inicio

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/capturista/page.tsx` |
| **URL** | `/capturista` |
| **Flujo** | Instrucciones + enlace a `/capturista/materias` |

### Capturista materias

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/capturista/materias/page.tsx` |
| **URL** | `/capturista/materias` |
| **Datos** | `materias` + por materia `programas(activo=true, archivado=false)` + `encuadres`/`criterios_evaluacion` + últimos editores + `unidades`/`practicas_taller` |
| **Filtros** | Texto, periodo, progreso |
| **UI** | Botones abren editores de encuadre/PUA con `programaId`. Monta `PrintPuaButton(programaId)` y `PrintEncuadreButton` |

**Indicadores de completo:**

| Indicador | Regla |
|---|---|
| Encuadre completo | ≥1 encuadre con profesor/grupo/periodo + criterios sumando exactamente 100 |
| PUA completo | Propósito + competencia + evidencias + `n_unidades > 0` + unidades completas + ≥1 práctica taller |

### Capturista encuadre

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/capturista/materias/[clave]/encuadre/page.tsx` |
| **URL** | `/capturista/materias/<clave>/encuadre?programaId=<id>` |
| **Datos** | Materia por clave + profesores (`useEncuadreForm`) |
| **Edición** | Pares profesor-grupo, criterios, textos evaluación/ordinario/extraordinario/producto/bibliografía/normas + flag `profesor_puede_modificar_criterios` |
| **Validación** | ≥1 asignación completa sin duplicar profesor+grupo. ≥1 criterio, valores >0/≤100, suma = 100 |

### Capturista PUA

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/capturista/materias/[clave]/pua/page.tsx` |
| **URL** | `/capturista/materias/<clave>/pua?programaId=<id>` |
| **Datos** | Materia + `usePuaForm` sobre `programas` |
| **Persistencia** | UPDATE por ID + auditoría del editor |
| **Flujo** | "Continuar" valida contenido base, guarda y abre unidades. "Guardar cambios" (PUA completo) verifica solo permiso |

### Capturista unidades

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/capturista/materias/[clave]/pua/unidades/page.tsx` |
| **URL** | `/capturista/materias/<clave>/pua/unidades?programaId=<id>` |
| **Datos** | `programas(id, materia_id, unidades, ht, hl)` + `unidades` |
| **Validación** | Textos obligatorios, duración positiva, semanas positivas con fin ≥ inicio |
| **Flujo** | `guardarUnidades` reemplaza unidades/temas + auditoría. Éxito → sigue el diagrama HT/HL |

### Capturista taller / laboratorio

Comparten estructura y validaciones.

| Campo | Detalle |
|---|---|
| **Archivos** | `pua/taller/page.tsx` y `pua/laboratorio/page.tsx` |
| **Datos** | Programa por ID + prácticas agrupadas por unidad |
| **Edición** | Agregar/eliminar (renumera)/plegar/editar prácticas |
| **Validación** | ≥1 práctica total; por práctica: competencia/descripción/duración positiva |
| **Flujo** | Hook reemplaza todo + auditoría. Taller: si HL>0 sigue laboratorio, si no listado. Laboratorio: vuelve al listado |

---

## Profesor

Sidebar expone Inicio (`/profesor`) y Mis Cursos (`/profesor/cursos`). Cliente Supabase anon.

`VerificarPeriodo` del layout restringe el acceso general; algunas subrutas repiten cheques con `usePermisoOperacion`.

### Profesor inicio

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/profesor/page.tsx` |
| **URL** | `/profesor` |
| **Flujo** | Componente cliente sin fetches. Bienvenida + guía 3 pasos + enlace `/profesor/cursos` |

### Profesor cursos

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/profesor/cursos/page.tsx` |
| **URL** | `/profesor/cursos` |
| **Datos** | Encuadres del profesor por `usuario_id` → `programas` → `materias`. 3 indicadores por curso: alumnos, firmas, alumnos distintos con ≥1 checkin |
| **Periodo actual** | Máximo periodo entre encuadres propios (parseo `yyyy-N`) |
| **Filtros** | Texto, Vista (actuales/archivados/todos), Periodo, Grupo |
| **UI** | Fila clickable a `/profesor/cursos/<encuadre_id>`. Botón por indicador abre `Dialog` con detalle. `PrintPuaButton` + `PrintEncuadreButton` + "Gestionar" |

### Profesor detalle de curso

Única pantalla del rol profesor que respeta ventana operativa y permisos especiales.

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/profesor/cursos/[id]/page.tsx` |
| **URL** | `/profesor/cursos/<encuadre_id>` |
| **Datos** | Encuadre por `id`, valida `usuario_id === sesión`. Materia vía `programas`/`materias`. `usePermisoOperacion.validarPermiso(encuadreId, "profesor")` |
| **UI** | 3 banners según permiso. `Tabs`: Encuadre, Registro de Avances, Alumnos |

**Tabs:**

| Tab | Comportamiento |
|---|---|
| `EncuadreTab.tsx` | `useEncuadreProfesor`. Habilita campos si `puede_editar_encuadre && !solo_lectura`; criterios editables solo si además `profesor_puede_modificar_criterios`. Suma = 100 |
| `AlumnosTab.tsx` | CRUD con `useEncuadreAlumnos`. Panel copiable de credenciales tras crear/regenerar |
| `AvancesTab.tsx` | `useRegistroAvances`, agrupa temas por unidad, justificación obligatoria si "No" |

---

## Alumno

Sidebar expone Inicio (`/alumno`) y Mis Cursos (`/alumno/cursos`). Cliente anon; seguridad final por RLS.

### Alumno inicio

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/alumno/page.tsx` |
| **URL** | `/alumno` |
| **Flujo** | 3 tarjetas guía + enlace a `/alumno/cursos` |

### Alumno cursos

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/alumno/cursos/page.tsx` |
| **URL** | `/alumno/cursos` |
| **Datos** | Inscripciones activas: `encuadre_alumnos.select("encuadre_id")...neq("estado","revocada")` → `encuadres` → `programas` → `materias` + docente + firma |
| **UI** | Tarjeta por curso. `PrintPuaButton` (siempre) · `PrintEncuadreButton` (solo si firmado) · "Ver detalle" |

### Alumno detalle de curso

Contenedor de 3 tabs (`EncuadreViewTab`, `PlanDeClasesTab`, `AvancesTab`) sobre el mismo `encuadreId`.

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/alumno/cursos/[id]/page.tsx` |
| **URL** | `/alumno/cursos/<encuadre_id>` |
| **Validación en cadena** | 1) Inscripción vigente → 2) encuadre → programa → materia → docente → 3) firma → 4) `validarPermiso("alumno")` |
| **UI** | Tab Avances deshabilitado si `!haFirmado \|\| !puede_registrar_avances` |

### Alumno tab encuadre

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/alumno/cursos/[id]/EncuadreViewTab.tsx` |
| **Modo** | Solo lectura |
| **Datos** | `encuadres` + `criterios_evaluacion` + `clave` de materia |
| **Firma** | Ya firmado → tarjeta verde. Sin firmar → input nombre + texto legal + Guardar (≥5 chars, confirma, INSERT en `encuadre_firmas`) |
| **Final** | Monta `<EvidenciaEncuadre puedeSubir={false} />` |

### Alumno tab plan de clases

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/alumno/cursos/[id]/PlanDeClasesTab.tsx` |
| **Modo** | Solo lectura |
| **Datos** | Encuadre → programa (competencia + id) → `unidades` orden por `numero` |
| **UI** | Tarjeta "Competencia del curso" + tabla con Unidad / Tema / Semana |

### Alumno tab avances

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/alumno/cursos/[id]/AvancesTab.tsx` |
| **Datos** | `useRegistroAvances(encuadreId).obtenerDatosCompletos` |
| **UI** | Por tema: 2 checkboxes exclusivos Sí/No + input observación (habilitado solo si "No") |
| **Flujo** | Guardar → confirma → `guardarCheckins` → toast + redirect `/alumno/cursos` tras 1s |

---

## Lector

Sidebar expone Dashboard (`/lector`) y Cursos (`/lector/cursos`). Rol estrictamente **solo lectura**. `VerificarPeriodo` **no** exime al lector.

### Lector inicio

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/lector/page.tsx` |
| **URL** | `/lector` |
| **Datos** | 6 consultas secuenciales: `encuadres`, `programas`/`materias`, profesores, `encuadre_alumnos`, `unidades`/`temas`, `temas_checkin` |
| **UI** | 6 KPIs (cursos activos, profesores, alumnos, coincidencia promedio, cursos ≥80%, cursos <50%) + Top 5 cursos + acciones rápidas |
| **Cálculo** | Coincidencia por encuadre con clave `${usuario_id}_${grupo}_${tema_id}` |

### Lector cursos

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/lector/cursos/page.tsx` |
| **URL** | `/lector/cursos` |
| **Datos** | Replica dashboard + `alumnosPorEncuadre` + `temas_profesor` |
| **Filtros** | Búsqueda + periodo + nivel (alta ≥80/moderada 50-79/baja <50/sin datos) |
| **UI** | Tabla + badge coincidencia por color. Paginación 10 por página |

### Lector detalle de curso

| Campo | Detalle |
|---|---|
| **Archivo** | `app/(main)/lector/cursos/[encuadre_id]/page.tsx` |
| **URL** | `/lector/cursos/<encuadre_id>` |
| **Datos** | Encuadre → programa → materia → profesor → alumnos → unidades → temas → `temas_checkin` filtrado por grupo |
| **UI** | Header + 4 KPIs + Panel "Alumnos Inscritos" + Panel "Avance por Tema" + leyenda |

---

**Stubs y páginas huérfanas** (ver [`./riesgos.md §6`](./riesgos.md#6-archivos-huérfanos-y-candidatos-a-borrar)): `admin/crear-usuario` (sin persistencia) · `profesor/encuadres/*` (vista paralela no enlazada) · `profesor/avances/*` (prototipos hardcoded) · `lector/reportes` (archivo vacío).

---

## Componentes

Componentes React del proyecto. `components/ui/` (shadcn) fuera de alcance.

> **Convención:** todos los interactivos empiezan con `"use client"`. Los que necesitan sesión usan `useSession()`. Los que consultan BD usan `supabase` de [`lib/supabase.ts`](#libsupabasets).

### 5A — Layout y navegación

#### `app-sidebar.tsx`

Sidebar principal (verde UABC `#00723F`) con logo, menú por rol y logout.

| Campo | Detalle |
|---|---|
| **Props** | `{ role: "admin" \| "capturista" \| "profesor" \| "alumno" \| "lector" }` |
| **Datos** | `menuItemsByRole` (mapa local); `usePathname()` |
| **Item activo** | `getMostSpecificActiveRoute()` toma la URL más larga entre los activos |
| **Consumido por** | `app/(main)/layout.tsx` |

#### `dynamic-header.tsx`

Header dinámico que resuelve el título desde `usePathname()`.

| Campo | Detalle |
|---|---|
| **Resolución** | 1) match exacto en `routeNames` → 2) prefijos por rol → 3) `uuidRegex` → 4) `translations` → 5) `"Página"` |

#### `session-provider.tsx`

Envoltorio `"use client"` del `SessionProvider` de `next-auth/react`.

| Campo | Detalle |
|---|---|
| **Props** | `{ children: ReactNode, session?: Session \| null }` |
| **Consumido por** | `app/layout.tsx` |

#### `logout-button.tsx`

Botón de cierre de sesión con 3 estilos visuales.

| Campo | Detalle |
|---|---|
| **Props** | `{ variant?: "sidebar" \| "header" \| "default" }` |
| **Flujo** | `useConfirm()` → si confirma: `signOut({ callbackUrl: "/" })` |
| **Consumido por** | `app-sidebar.tsx` (variante `sidebar`) |

**Componentes huérfanos:** `notification-bell.tsx` (no montado, ver [`./riesgos.md`](./riesgos.md#2-componentes)), `notificaciones-dropdown.tsx` (archivo vacío).

### 5B — Editores de PUA

Cinco componentes que juntos componen el editor de PUA por unidad. Todos son "cards controlados" — reciben `value` del padre, notifican vía `onChange`. Los tres primeros usan el **patrón anti-eco** para romper el loop value/onChange (ver [`./decisiones.md §3`](./decisiones.md#3-bloque-5b--editores-de-pua)).

#### `contenido-editor.tsx`

Editor jerárquico de temario. 3 niveles: **tema** (2) → **subtema** (3) → **inciso** (4).

| Campo | Detalle |
|---|---|
| **Props** | `{ numeroUnidad: number; value?: string; onChange?: (contenido: string) => void }` |
| **Modelo** | `type Tema = { id: string; texto: string; nivel: number; hijos?: Tema[] }` |
| **Serialización** | Línea `${numero} ${texto}\n` con `numero = numeroUnidad + índices concatenados` |
| **Consumido por** | `unidad.tsx` |

#### `unidad.tsx`

Card con los campos de una unidad del PUA.

| Campo | Detalle |
|---|---|
| **Props** | `{ nUnidad; value?; onChange?; collapsed?; onToggleCollapse? }` |
| **UnidadValue** | `{ nombre, competencia, contenido, duracion, semana_inicio, semana_fin }` |
| **Consumido por** | `capturista/materias/[clave]/pua/unidades/page.tsx` |

#### `practica-laboratorio.tsx` y `practica-taller.tsx`

Cards casi idénticas de prácticas de laboratorio y taller, numeradas `P{unidad}.{numero}`.

| Campo | Detalle |
|---|---|
| **Props** | `{ unidad, numero, value?, onChange?, onDelete?, collapsed?, onToggleCollapse?, errores?: ErroresCampos }` |
| **PracticaValue** | `{ competencia, descripcion, material_apoyo, duracion }` |
| **Errores visuales** | Si `errores.<campo> === true` → `border-red-500` + `AlertCircle` |
| **Consumido por** | `pua/laboratorio/page.tsx` y `pua/taller/page.tsx` |

**Huérfano:** `criterios.tsx` (`TablaCriterios`) — sin consumidores. El encuadre del capturista usa tabla propia.

### 5C — Encuadre y alumnos

Componentes de la vista del encuadre y la gestión de alumnos asociados.

#### `EvidenciaEncuadre.tsx`

Muestra/gestiona foto del encuadre firmado. Dos modos según `puedeSubir`.

| Campo | Detalle |
|---|---|
| **Props** | `{ encuadreId: string; puedeSubir: boolean }` |
| **Alumno (`puedeSubir=false`)** | Solo lectura. Con evidencia: imagen + fechas |
| **Profesor (`puedeSubir=true`)** | Fecha presentación + selector imagen (JPG/PNG/WEBP, ≤5MB) + "Guardar evidencia" |
| **Flujo subida** | Valida tipo/tamaño → Storage bucket `evidencias-encuadre` path `${encuadreId}/${Date.now()}.${ext}` → `getPublicUrl` → INSERT `encuadre_evidencias` |
| **Consumido por** | Vista de encuadre del profesor/alumno |

#### `alumnosEncuadreCard.tsx`

CRUD de alumnos asociados a un encuadre. Consume mutaciones de [`useEncuadreAlumnos`](#useencuadrealumnosts).

| Campo | Detalle |
|---|---|
| **Props** | `{ encuadreId: string; materiaNombre: string; grupo: string; periodo: string }` |
| **Acciones** | Agregar (form in-line con `generarClaveSegura(12)`) · Regenerar clave · Revocar · Reactivar |
| **Estados** | `pendiente`, `enviada`, `activa`, `revocada` (badge + icono) |
| **Consumido por** | Listados de cursos alumno, capturista y profesor |

**Huérfanos:** `materia.tsx` (usado solo por stub), `FullEncuadreTable.tsx`, `LearningPlanTable.tsx`, `invite.tsx` — todos sin consumidores reales o con contradicciones.

### 5D — Modales, utilidades y print

#### `modal-agregar-materia.tsx` y `modal-editar-materia.tsx`

Modales para crear/editar materia + gestor de licenciaturas in-line. Validación delegada al padre (`onSave` devuelve `errors: string[]`).

#### `modal-crear-anuncio.tsx`

Modal alternativo al editor de anuncios. Valida título/mensaje/destinatarios/método. Persistencia directa a `anuncios`.

#### `global-confirm-modal.tsx`

Modal de confirmación global expuesto vía `useConfirm()`. Registrado a nivel raíz por `ConfirmProvider`.

#### `error-modal.tsx`

Modal genérico de error con título/mensaje. Renderizado bajo demanda.

#### `date-picker.tsx`

Envoltorio del calendario de shadcn. `{ value, onChange, placeholder?, disabled? }`.

#### `verificar-periodo.tsx`

HOC que evalúa ventana operativa + permisos especiales. Ver casos en [Layout autenticado](#layout-autenticado). Fail-open ante error.

#### `Printencuadrebutton.tsx` y `Printpuabutton.tsx`

Generan PDF del encuadre/PUA vía iframe + `window.print()`. Sin librería PDF adicional.

| Campo | Detalle |
|---|---|
| **`PrintEncuadreButton`** | Props `{ encuadreId }`. Trae encuadre + programa + materia + criterios + firmas |
| **`PrintPuaButton`** | Props `{ programaId }`. Trae programa + materia + unidades + prácticas |

---

## Hooks

Hooks de React que encapsulan la lógica de datos entre las páginas y Supabase.

> **Convención:** todos usan `supabase` (rol anon). Los que necesitan usuario usan `useSession()`. Devuelven `{ loading, error, ...acciones }`. Los `use*Form` usan `useCallback`.

### `use-mobile.ts`

| Campo | Detalle |
|---|---|
| **Firma** | `useIsMobile(): boolean` |
| **Estado** | `window.matchMedia("(max-width: 767px)")` |
| **Consumido por** | Sidebar y componentes que cambian de layout en móvil |

### `usePermisoOperacion.ts` y `usePermisoPua.ts`

Wrappers sobre [`resolverPermisoOperacion`/`resolverPermisoPua`](#libpermisooperacionts) para consumir permisos desde componentes.

| Campo | Detalle |
|---|---|
| **`usePermisoOperacion`** | Retorna `{ validarPermiso, loadingPermiso }`. La página decide cuándo validar (`profesor` / `alumno`) |
| **`usePermisoPua`** | `usePermisoPua(programaId)` → `{ permiso, puedeEditar, soloLectura, motivoPermiso, loadingPermiso }`. Auto-ejecuta en `useEffect`. Bandera `cancelado` para anti-race |
| **Consumido por** | Páginas de edición y hooks de datos |

### `useLaboratorioForm.ts` y `useTallerForm.ts`

Firmas idénticas para prácticas de laboratorio y taller.

| Campo | Detalle |
|---|---|
| **Firma** | `useLaboratorioForm(programaId)` / `useTallerForm(programaId)` → `{ guardarPracticas, cargarPracticas, loading }` |
| **Estrategia** | Delete-all + insert dentro de `programa_id`. Actualiza `programas.ultimo_editor_id`/`ultima_edicion` |
| **Consumido por** | Páginas capturista taller/laboratorio |

### `usePuaForm.ts`

| Campo | Detalle |
|---|---|
| **Firma** | `usePuaForm(programaId)` → `{ guardarPua, cargarPua, loading, error }` |
| **Estrategia** | SELECT/UPDATE único por `id = programaId`. No crea programa (se crea al agregar materia) |
| **Consumido por** | `capturista/pua` |

### `useUnidadesForm.ts`

| Campo | Detalle |
|---|---|
| **Firma** | `useUnidadesForm(programaId)` → `{ guardarUnidades, cargarUnidades, loading, error }` |
| **Estrategia** | 4 pasos sin transacción: consulta unidades → elimina temas → elimina unidades → inserta nuevas unidades + temas |
| **Consumido por** | `capturista/unidades` |

**Extractor `extraerTemasDeContenido`:** lee `contenido` línea por línea; reconoce niveles 2 y 3 (`^N.N` y `^N.N.N`). Nivel 1 y 4+ se ignoran.

### `useEncuadreForm.ts`

Hook del capturista para asignar profesores × grupos a un programa/PUA.

| Campo | Detalle |
|---|---|
| **Firma** | `useEncuadreForm(programaId)` → `{ guardarEncuadre, cargarEncuadre, loading, error }` |
| **Consumido por** | `capturista/encuadre` |

**Flujo de `guardarEncuadre`:**

| Paso | Acción |
|---|---|
| 1 | Normaliza cada asignación (`trim`, uppercase de grupo) |
| 2 | Trae asignaciones existentes |
| 3 | Detecta sobrantes |
| 4 | Por cada sobrante verifica movimientos (alumnos/firmas/checkins). Si hay, aborta con error legible |
| 5 | UPDATE si existía, INSERT si es nueva |
| 6 | Reemplaza `criterios_evaluacion` por `encuadre_id` (delete-all + insert) |
| 7 | Elimina sobrantes (sus criterios y luego el encuadre) |

### `useEncuadreProfesor.ts`

Lectura y edición desde el rol profesor.

| Campo | Detalle |
|---|---|
| **Firma** | `useEncuadreProfesor()` → `{ obtenerMisEncuadres, obtenerEncuadre, actualizarEncuadre, loading, error }` |
| **`actualizarEncuadre`** | Valida permiso **antes** de tocar BD. UPDATE parcial de `encuadres`. Si `profesor_puede_modificar_criterios`, reemplaza criterios |
| **Consumido por** | `profesor/encuadres`, `profesor/cursos/[id]/EncuadreTab` |

### `useEncuadreAlumnos.ts`

Gestión de la lista de alumnos invitados a un encuadre.

| Campo | Detalle |
|---|---|
| **Firma** | `useEncuadreAlumnos(encuadreId)` → `{ obtenerAlumnos, agregarAlumno, registrarAlumno, regenerarClave, enviarCorreo, revocarAcceso, reactivarAcceso, loading, error }` |
| **Notas** | Importa `bcryptjs` dinámicamente en `regenerarClave` para no cargarlo en el bundle inicial |

**Acciones:**

| Acción | Tabla(s) tocadas |
|---|---|
| `obtenerAlumnos` | `encuadre_alumnos` join `usuarios` |
| `agregarAlumno` | `POST /api/alumnos/agregar` |
| `registrarAlumno` | `POST /api/alumnos/registrar` |
| `regenerarClave` | `usuarios`, `encuadre_alumnos` (hashea, `debe_cambiar_password`, expira 7d) |
| `enviarCorreo` | `encuadre_alumnos`, `email_outbox` (aborta si `reenvios >= 3`) |
| `revocarAcceso` | `encuadre_alumnos.estado = "revocada"` |
| `reactivarAcceso` | Borrado en cascada manual: firma + checkins + estado |

### `useRegistroAvances.ts`

Hook del avance de temas que ven profesor y alumno.

| Campo | Detalle |
|---|---|
| **Firma** | `useRegistroAvances(encuadreId)` → `{ obtenerDatosCompletos, guardarCheckins, loading, error }` |
| **`obtenerDatosCompletos`** | `header` (asignatura/clave/grupo/sección/docente/competencia/periodo) + `temas` con checkin del usuario para el grupo |
| **`guardarCheckins`** | UPSERT manual (SELECT `maybeSingle` → UPDATE o INSERT) |
| **Consumido por** | Páginas de avances del profesor y alumno |

---

## Utilidades, middleware y auth

### `lib/supabase.ts`

| Campo | Detalle |
|---|---|
| **Propósito** | Cliente Supabase único (rol anon) compartido por navegador y endpoints que no requieren service role |
| **Exporta** | `supabase` — `SupabaseClient` con URL pública + `anon key` |
| **Notas** | `throw` en carga si faltan vars (fail fast). Anon key se embebe en bundle (correcto — la protección real la da RLS). No exporta cliente service role |

**Variables de entorno:**

| Variable | Efecto si falta |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `throw` al importar módulo |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `throw` al importar módulo |

### `lib/auth.ts`

| Campo | Detalle |
|---|---|
| **Propósito** | Envoltura mínima sobre `getServerSession` de NextAuth |
| **Exporta** | `getSession()` — async, `Session \| null` |
| **Uso** | `const session = await getSession(); if (!session) return NextResponse.redirect("/");` |
| **Notas** | Importa `authOptions` desde `app/api/auth/[...nextauth]/route.ts`. Tipos vienen de `next-auth.d.ts` |

### `lib/permisoOperacion.ts`

Núcleo de la lógica de autorización. Dado un usuario y un encuadre (o programa), devuelve qué operaciones puede hacer + motivo legible.

**Exporta:**

| Symbol | Tipo |
|---|---|
| `RolOperacion` | `type = "profesor" \| "alumno"` |
| `PermisoOperacion` | `type` — resultado para encuadres |
| `PermisoPua` | `type` — resultado para capturista |
| `permisoDefault` / `permisoPuaDefault` | Con todo en `false` |
| `resolverPermisoOperacion()` | async, resuelve permiso profesor/alumno |
| `resolverPermisoPua()` | async, resuelve permiso capturista |

**Cómo se combinan las fuentes de permiso** (`lib/permisoOperacion.ts:371-400`). Un permiso se abre si se cumple **cualquiera**:

| # | Fuente |
|---|---|
| 1 | **Ventana global activa** en `configuracion_fechas` con flag `habilita_*` en `true` |
| 2 | **Permiso especial propio** en `permisos_operacion_encuadre` (con `solo_lectura=false`) |
| 3 | **Herencia desde el profesor** (solo alumnos): si el profesor tiene permiso con `incluye_alumnos=true` |

**Candado adicional** (`:396-400`): si el encuadre está `publicado`, `puede_editar_encuadre` se fuerza a `false` salvo permiso especial explícito.

**Flujo interno de `resolverPermisoOperacion`:**

| Paso | Línea | Qué hace |
|---|---|---|
| 1 | 249 | Lee el encuadre (id, usuario_id, estado_encuadre) |
| 2 | 267 | Valida pertenencia: profesor dueño, o alumno con relación activa |
| 3 | 304 | Obtiene ventanas globales activas |
| 4 | 309 | Busca permiso especial propio |
| 5 | 337 | Si es alumno sin permiso propio, busca permiso heredado del profesor |
| 6 | 371 | Combina ventanas + permiso propio + herencia |
| 7 | 396 | Aplica candado por encuadre publicado |
| 8 | 403 | Redacta el `motivo` para la UI |

**Cross-refs:** [`../database/bd.md §9.3`](../database/bd.md#93-sistema-de-permisos-temporales), [`../database/bd.md §9.4`](../database/bd.md#94-sistema-de-ventanas-de-tiempo).

### `lib/sidebar-items.ts`

| Campo | Detalle |
|---|---|
| **Propósito** | Registro estático de items del sidebar por rol |
| **Exporta** | `sidebarItemsByRole` — objeto con clave por rol (`admin`, `capturista`, `profesor`, `alumno`, `lector`) |
| **Consumido por** | `components/app-sidebar.tsx` (pero éste usa mapa local — dos fuentes de verdad, ver [`./decisiones.md §1`](./decisiones.md#1-decisiones-globales)) |

### `lib/password-generator.ts`

| Campo | Detalle |
|---|---|
| **Propósito** | Generar contraseñas seguras, validar fortaleza, validar dominio UABC |
| **Política** | Mínimo 12 caracteres, ≥2 mayúsculas, ≥2 minúsculas, ≥2 números, ≥2 símbolos `@#$%&*!?+-=` |
| **Notas** | Alfabeto excluye ambiguos (`0`, `O`, `l`, `1`, `I`). Usa `crypto.getRandomValues`. Correos válidos: `@uabc.edu.mx` o `@uabc.mx` |

**Exporta:**

| Función | Descripción |
|---|---|
| `generarClaveSegura(longitud=12)` | Genera clave que cumple política |
| `validarFortalezaClave(clave)` | Verifica política. Devuelve errores |
| `validarCorreoInstitucional()` | Formato + dominios UABC |

### `lib/utils.ts`

| Campo | Detalle |
|---|---|
| **Propósito** | `cn(...)` estándar de shadcn/ui |
| **Implementación** | `twMerge(clsx(inputs))` |

### `middleware.ts`

Middleware de Next.js ejecutado antes de cada request. Redirige a login si no hay sesión; redirige a ruta por defecto del rol si un autenticado entra a área ajena.

| Campo | Detalle |
|---|---|
| **Matcher** | Excluye `/api/*`, `_next/static`, `_next/image`, `favicon.ico`. Solo aplica a rutas UI |
| **Rutas por rol** | admin→`/admin`, profesor→`/profesor`, alumno→`/alumno`, lector→`/lector`, capturista→`/capturista` |

**Flujo:**

| Paso | Acción |
|---|---|
| 1 | Lee JWT con `getToken()` |
| 2 | Sin token + ruta protegida → redirect a `/` con `?callbackUrl=<original>` |
| 3 | Con token y en `/` → redirect a ruta por defecto del rol |
| 4 | Con token y ruta ajena → redirect a su ruta por defecto |
| 5 | Cualquier otro caso → `NextResponse.next()` |

### `next-auth.d.ts`

Declaraciones de módulo TypeScript que extienden las interfaces de `next-auth` para incluir `id` y `role` en `User`, `Session.user` y `JWT`.

**Campos agregados:**

| Campo | Tipo | Origen |
|---|---|---|
| `id` | `string` | UUID en `public.usuarios` |
| `name` | `string` | Nombre completo |
| `email` | `string` | Correo institucional |
| `role` | `string` | `admin \| capturista \| profesor \| alumno \| lector \| personal` |

---

## Endpoints REST

Endpoints en `app/api/**/route.ts`.

> **Convención:**
> - Se instancian con `createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)`. El service role bypassa RLS.
> - Éxito → `NextResponse.json({ success: true, ...datos })`. Error → `{ error }`, status 4xx/5xx.
> - Hashing: `bcryptjs` con `salt = 12`.
> - Correo: se **encola** en `email_outbox` con `status = "pending"`. Un worker externo (no incluido) los toma.

### `/api/auth/[...nextauth]`

Handler de NextAuth 4. Único `CredentialsProvider` con `email` + `password`.

**Flujo de `authorize()`:**

| Paso | Acción |
|---|---|
| 1 | Busca `usuarios` por `correo` (con `roles(nombre)`) |
| 2 | `bcrypt.compare` |
| 3 | Si rol es `"alumno"`, UPDATE en `encuadre_alumnos`: `ultimo_acceso = now()`, `estado = "activa"` (filtra solo por `alumno_id`) |
| 4 | Devuelve `{ id, name, email, role }` |

**Callbacks:**

| Callback | Efecto |
|---|---|
| `jwt({ token, user })` | Al primer login copia `id, name, email, role` al JWT |
| `session({ session, token })` | Refleja los campos del token en `session.user` |

**Configuración:**

| Clave | Valor |
|---|---|
| `session.strategy` | `"jwt"` (sin tabla de sesiones) |
| `pages.signIn` | `"/"` |
| `secret` | `process.env.NEXTAUTH_SECRET` |
| `debug` | `NODE_ENV === "development"` |

### `POST /api/usuarios/crear`

**Request:** `{ correo, nombre, contraseña, rol_id }`
**Response:** `200 { success, usuario: { id, correo, nombre } }` · `400/409/500`

| Paso | Acción |
|---|---|
| 1 | Valida presencia de los 4 campos |
| 2 | Normaliza correo (`trim`, `toLowerCase`) |
| 3 | Verifica no exista (SELECT `.single()`) |
| 4 | `bcrypt.hash(salt=12)` |
| 5 | INSERT en `usuarios` |

**Consumido por:** `admin/usuarios` via `AddUserModal`.

### `POST /api/usuarios/crear-masivo`

**Request:** `{ usuarios: [{correo, nombre, contraseña, rol_id}, ...] }`
**Response:** siempre 200 con `{ success, creados, errores, detalles }`.

**Flujo:** recorre secuencialmente aplicando la misma lógica de `/crear`. Fallos individuales se acumulan sin abortar el batch.

**Consumido por:** `admin/usuarios::handleImportFromExcel`.

### `POST /api/alumnos/agregar`

Asocia un alumno **existente** al encuadre. Si viene `clave`, además sobreescribe contraseña.

**Request:** `{ correo, encuadreId, profesorId, clave? }`

| Paso | Acción |
|---|---|
| 1 | Valida campos |
| 2 | Busca usuario por correo |
| 3 | Verifica rol = `"alumno"` |
| 4 | Verifica no exista en `encuadre_alumnos` para este `encuadreId` |
| 5 | Si viene `clave`: hashea + UPDATE `usuarios` (`debe_cambiar_password`, expira 7d) |
| 6 | INSERT en `encuadre_alumnos` con `estado = "pendiente"`, expira 7d |

**Consumido por:** `useEncuadreAlumnos.agregarAlumno`.

### `POST /api/alumnos/registrar`

Crea un usuario **nuevo** con rol alumno y lo asocia al encuadre. Encola correo de bienvenida.

**Request:** `{ correo, clave, encuadreId, profesorId, materiaNombre, grupo, periodo }`

| Paso | Acción |
|---|---|
| 1 | Valida campos y que el correo NO exista |
| 2 | Verifica `clave` no vacía |
| 3 | Busca `roles.id` donde `nombre = "alumno"` |
| 4 | `bcrypt.hash` |
| 5 | INSERT `usuarios` con `nombre = correoLimpio.split("@")[0]` |
| 6 | INSERT en `encuadre_alumnos`. Si falla → DELETE del usuario (rollback manual) |
| 7 | INSERT en `email_outbox` (best-effort — si falla, ignora) |

**Consumido por:** `useEncuadreAlumnos.registrarAlumno`.

---

## Referencias cruzadas

- Riesgos y bugs: [`./riesgos.md`](./riesgos.md)
- Decisiones y patrones: [`./decisiones.md`](./decisiones.md)
- Referencia BD: [`../database/bd.md`](../database/bd.md)
- Riesgos BD: [`../database/riesgos.md`](../database/riesgos.md)
- Schema SQL: [`../database/schema_completo.sql`](../database/schema_completo.sql)
