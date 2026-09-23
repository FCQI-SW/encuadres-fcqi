# Decisiones y patrones — Código

Bitácora del **porqué** de decisiones de diseño y patrones que se repiten en el código.

> Para la referencia normal ver [`./codigo.md`](./codigo.md).
> Para bugs y ⚠️ ver [`./riesgos.md`](./riesgos.md).

## Índice

- [1. Decisiones globales](#1-decisiones-globales)
- [2. Bloque 5A — Layout y navegación](#2-bloque-5a--layout-y-navegación)
- [3. Bloque 5B — Editores de PUA](#3-bloque-5b--editores-de-pua)
- [4. Bloque 5C — Encuadre y alumnos](#4-bloque-5c--encuadre-y-alumnos)
- [5. Bloque 5D — Modales y utilidades](#5-bloque-5d--modales-y-utilidades)
- [6. Hooks — Decisiones no obvias](#6-hooks--decisiones-no-obvias)
- [7. Endpoints REST — Riesgos comunes y decisiones](#7-endpoints-rest--riesgos-comunes-y-decisiones)

---

## 1. Decisiones globales

| Decisión | Motivo | Consecuencia si se cambia |
|---|---|---|
| Cliente Supabase **anon** en componentes/hooks; `service role` solo en endpoints `app/api/*` | Anon key debe poder embeberse en el bundle sin filtrar poderes. RLS debía ser la defensa real. | Aceptable **si** RLS estuviera activa. Hoy está OFF (ver [`../database/riesgos.md §4.1`](../database/riesgos.md#41-hallazgos-críticos)). |
| Sesión NextAuth **no** se traduce a JWT Supabase | Simplificar autenticación con `credentials`. Evita mantener dos identidades. | RLS no recibe el rol automáticamente — cualquier policy basada en `auth.uid()` no aplica en llamadas desde la app. |
| Sidebar tiene **dos fuentes de verdad** (`menuItemsByRole` en `app-sidebar.tsx` + `lib/sidebar-items.ts`) | Deuda histórica; se dejó el `lib/sidebar-items.ts` por si otro consumidor lo usa | La sidebar real usa el mapa local. Añadir ruta requiere tocar ambos si no se decide una. |
| Rol `personal` **no** mapeado en `middleware.ts` ni sidebar | Se decidió aplazar hasta definir su destino | Usuario con `role=personal` queda atrapado en `/` sin redirect. |

---

## 2. Bloque 5A — Layout y navegación

| Decisión / Hallazgo | Ubicación | Notas |
|---|---|---|
| `menuItemsByRole` local vs `lib/sidebar-items.ts` | `app-sidebar.tsx:33-62` | Dos fuentes de verdad; la sidebar real usa el mapa local |
| Rol `personal` sin entrada en sidebar | `app-sidebar.tsx:33-62` | Consistente con `middleware.ts` |
| `dynamic-header.tsx` duplica títulos `routeNames` ↔ `translations` | `dynamic-header.tsx` | Fricción al añadir rutas. Se documentó pero no se refactoriza. |
| `logout-button.tsx` importa `useRouter` sin usarlo | `logout-button.tsx:3` | Ruido histórico. `signOut` navega con `callbackUrl`. |

---

## 3. Bloque 5B — Editores de PUA

| Decisión / Hallazgo | Ubicación | Notas |
|---|---|---|
| **Patrón anti-eco** (firma + `ultimoEmitido` + `onChangeRef`) repetido en 3 componentes | `unidad.tsx`, `practica-laboratorio.tsx`, `practica-taller.tsx` | Verboso pero necesario para romper el loop value/onChange. Podría extraerse a un hook `useControlledSignature<T>()`. |
| `practica-taller.tsx` es copia casi literal de `practica-laboratorio.tsx` | `components/practica-taller.tsx` vs `components/practica-laboratorio.tsx` | Deuda de duplicación. Refactor a `PracticaEditor` genérico cuando se confirme que no van a divergir. |
| `TablaCriterios` no aplica patrón anti-eco (a diferencia de unidad/practica) | `components/criterios.tsx` | El componente se hidrata una sola vez con `initialRows`; el padre no reemplaza en caliente. Contrato distinto. |

**Detalle del patrón anti-eco:**

Los tres componentes se enfrentan al mismo problema: el padre reenvía el `value` en cada render, lo que dispararía `onChange` → padre setea de nuevo → loop infinito. La solución es la misma en los tres archivos:

1. **`firma(...)`** — helper local que hace `JSON.stringify` de todos los campos editables. Sirve como identidad estable del contenido.
2. **`ultimoEmitido` (`useRef<string>`)** — guarda la firma del último objeto emitido hacia el padre.
3. **`onChangeRef` (`useRef`)** — guarda la referencia actual del callback `onChange` sin meterlo en dependencias de `useEffect`.
4. **`useEffect` de emisión** — calcula la firma actual; si difiere de `ultimoEmitido.current`, guarda la nueva y llama `onChangeRef.current(nuevoValor)`.
5. **`useEffect` de recepción** — si el padre manda un `value` cuya firma ya coincide con `ultimoEmitido.current`, se ignora (no se rehidrata el estado local).

Un `useMemo` sobre la firma no bastaría porque hay que comparar contra la última **emitida**, no la última **recibida**.

---

## 4. Bloque 5C — Encuadre y alumnos

| Decisión / Hallazgo | Ubicación | Notas |
|---|---|---|
| `<Materia>` decide comportamiento por comparación de strings de `btnText` | `components/materia.tsx:28` | Añadir un tercer comportamiento requiere otro `if`. Preferible una prop `action` o `renderFooter`. |
| `EvidenciaEncuadre` usa `<img>` (no `next/image`) | `EvidenciaEncuadre.tsx` | URLs externas de Supabase Storage. `next/image` requiere allowlist de dominios. |
| `EvidenciaEncuadre` usa `upsert:true` con path único → flag inútil | `EvidenciaEncuadre.tsx:110-112` | Como el path lleva `Date.now()`, nunca hay colisión. Se puede quitar `{ upsert: true }` sin cambiar comportamiento. |

---

## 5. Bloque 5D — Modales y utilidades

| Decisión / Hallazgo | Ubicación | Notas |
|---|---|---|
| `global-confirm-modal.tsx` renderizado a nivel raíz | `app/layout.tsx` | Un solo modal reutilizable por toda la app vía `useConfirm()`. Alternativa era una prop drilling extenso. |
| `verificar-periodo.tsx` es fail-open ante error | `verificar-periodo.tsx` | Si Supabase falla al leer `configuracion_fechas`, permite acceso. Preferir "producto disponible" a "producto bloqueado" ante error de red. |
| `Printencuadrebutton` / `Printpuabutton` generan PDF vía iframe + `window.print()` | Sin librería PDF pesada; usa `@react-pdf/renderer` o similar sería ~500KB extra. | Fricción: encabezado institucional se codifica dos veces (JSX y CSS de impresión). |

---

## 6. Hooks — Decisiones no obvias

| Decisión | Motivo | Consecuencia si se cambia |
|---|---|---|
| `use*Form` guardan con **delete-all + insert** en lugar de `upsert` | Los sets son pequeños (criterios ≤ 10, prácticas ≤ 20) y la UI reemplaza el total. Es más fácil de razonar. | Un fallo a mitad de operación deja el set vacío o parcial. Aceptable dada la escala; mover a RPC transaccional si crece. |
| Sin transacciones SQL en operaciones multi-tabla (`guardarEncuadre`, `reactivarAcceso`, `useUnidadesForm`) | Supabase-JS no expone transacciones; requeriría `rpc()` a una función PL/pgSQL. | Riesgo de estados inconsistentes ante fallos parciales. Baja probabilidad porque los pasos son rápidos. |
| `useEncuadreForm.ts` bloquea eliminar asignaciones con movimientos | Proteger a alumnos ya invitados y a checkins ya realizados. | Si se quisiera "reasignar profesor", habría que hacerlo desde la BD directamente. |
| `useRegistroAvances.guardarCheckins` **NO** valida permiso | El chequeo previo era fuente de bugs (rol fijo `profesor` rompía guardado para alumnos). Se delega a RLS. | En local sin RLS no hay defensa (ver [`../database/bd.md §10.6`](../database/bd.md#106-features-que-no-funcionan-sin-supabase-real)). |
| `usePermisoPua` es fail-closed (`puedeEditar = false` ante error) | Preferir bloquear una edición legítima que permitir una ilegítima. | Si el capturista ve "solo lectura" tras un error transitorio, un reload arregla. |
| `usePuaForm` recibe `programaId`, no `materiaId` | Corrección del bug donde varias periodos → siempre se editaba el primer programa. | El componente padre debe pasar el `programaId` correcto según el periodo seleccionado. |
| `useEncuadreAlumnos.regenerarClave` importa `bcryptjs` dinámicamente | Evitar meter la dependencia en el bundle inicial. | Primera regeneración tarda unos ms extras por el import. |

---

## 7. Endpoints REST — Riesgos comunes y decisiones

| Tema | Estado | Nota |
|---|---|---|
| **Todos los endpoints usan `SUPABASE_SERVICE_ROLE_KEY`** | Aceptado | Necesario para operar como admin sin RLS. La clave NO debe filtrarse al cliente. |
| **Ningún endpoint valida `getSession()`** | Documentado (pendiente) | Cualquier cliente puede llamar directo y suplantar `profesorId`/crear cuentas. **Antes de producción real** hay que agregar `const session = await getServerSession(authOptions)` y validar `session.user.role`. Ver [`./riesgos.md`](./riesgos.md). |
| **Sin transacciones SQL en flujos multi-INSERT** | Aceptado por escala | Igual que en hooks. `crear-masivo` es el más expuesto. |
| **`email_outbox` es best-effort** | Aceptado | Si el encolado falla, el usuario ya está creado. Se decide continuar por no bloquear el flujo. Ver [`../database/decisiones.md §2`](../database/decisiones.md#2-patrones-recurrentes). |
| **Login reactiva TODOS los encuadres del alumno** | Documentado | Contradice el flujo `revocarAcceso`. Ver [`./riesgos.md`](./riesgos.md) sección endpoints. |
| **Placeholder `[URL del sistema]` en correo de registro** | Pendiente | Sustituir por `NEXT_PUBLIC_APP_URL` o similar. |
