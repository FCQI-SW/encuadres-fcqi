-- =====================================================================================
-- ENCUADRES-FCQI — Schema completo para PostgreSQL local
-- =====================================================================================
--
-- Script único de creación de la BD. Pensado para PostgreSQL >= 13.
-- Sirve tanto para un PostgreSQL puro como para Supabase self-hosted.
--
-- Estructura del archivo:
--
--   PARTE 1 — Extensiones (pgcrypto)
--   PARTE 2 — Tipos personalizados / ENUMs (4)
--   PARTE 3 — Tablas (27, en orden de dependencia)
--   PARTE 4 — Índices (53: FKs + hot queries)
--   PARTE 5 — Funciones y RPC (8)
--   PARTE 6 — Triggers (2)
--   PARTE 7 — Row Level Security (13 policies + ENABLE, COMENTADO por defecto)
--   PARTE 8 — Datos semilla (6 roles)
--
-- Cómo usarlo:
--   psql -d encuadres_local -f docs/database/schema_completo.sql
--
-- Ver guía completa y análisis: docs/database/bd.md
--
-- Advertencias que aplican a este script (detalle en cada PARTE):
--   • La RPC `clonar_estructura_periodo` NO se incluye porque no existe en
--     Supabase (feature rota en producción).
--   • Tres funciones (`fn_fanout_anuncio(uuid)`, `mark_notification_read`,
--     `mark_all_notifications_read`) son código muerto: referencian tablas
--     inexistentes o `auth.uid()`. Si su CREATE falla en local, coméntalas.
--   • El bloque RLS (PARTE 7) se entrega COMENTADO porque depende de
--     `auth.uid()` y `auth.users` de Supabase.
-- =====================================================================================


-- =====================================================================================
-- PARTE 1 — Extensiones
-- =====================================================================================

-- Necesaria para gen_random_uuid() en versiones antiguas de PostgreSQL.
-- En PostgreSQL >= 13 la función viene incluida en pgcrypto.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =====================================================================================
-- PARTE 2 — Tipos personalizados (ENUMs)
-- =====================================================================================
--
-- Fuente: Supabase Dashboard → Database → Enumerated Types (capturado 2026-09-20)

-- Estado de un anuncio dentro de su ciclo de vida
CREATE TYPE public.anuncio_estado AS ENUM (
    'borrador',
    'programado',
    'enviado'
);

-- Categoría académica de una materia dentro del plan de estudios
CREATE TYPE public.categoria_enum AS ENUM (
    'Basica',
    'Disciplinaria',
    'Terminal'
);

-- Tipo de requisito de una materia dentro del plan de estudios
CREATE TYPE public.requisito_enum AS ENUM (
    'optativa',
    'obligatoria'
);

-- Destinatarios permitidos para un anuncio o notificación
CREATE TYPE public.rol_destinatario AS ENUM (
    'alumno',
    'profesor',
    'personal',
    'todos'
);


-- =====================================================================================
-- PARTE 3 — Tablas
-- =====================================================================================
-- Las tablas se declaran en orden de dependencia (padres antes que hijos) para que
-- las FOREIGN KEYs inline no fallen. NO hay ALTER TABLE ADD CONSTRAINT en este archivo
-- (las 44 FKs están todas embebidas en su CREATE TABLE correspondiente).
--
-- Fuente: export histórico de Supabase, corregido con:
--   - USER-DEFINED → nombres reales de ENUM (categoria_enum, requisito_enum, etc.)
--   - anuncios.destinatarios → rol_destinatario[] (era ARRAY genérico)
--
-- Advertencia conocida: la tabla notificaciones_usuarios se declara con las columnas
-- del SQL de referencia (leida boolean, fecha_lectura timestamp). El componente
-- components/notification-bell.tsx hace UPDATE con nombres distintos (leido, updated_at),
-- lo que indica posible desalineación con Supabase real. Se documenta y se resuelve más
-- tarde cuando se pueda validar contra la BD sin ejecutar queries.


-- ─────────────────────────────────────────────────────────────
-- 3.1 Catálogos base (sin dependencias)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE public.roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nombre text NOT NULL,
    CONSTRAINT roles_pkey PRIMARY KEY (id)
);

CREATE TABLE public.licenciaturas (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nombre text NOT NULL UNIQUE,
    activa boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT licenciaturas_pkey PRIMARY KEY (id)
);

CREATE TABLE public.configuraciones (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    horario_inicio text NOT NULL,
    horario_fin text NOT NULL,
    mantenimiento_inicio timestamp with time zone,
    mantenimiento_fin timestamp with time zone,
    CONSTRAINT configuraciones_pkey PRIMARY KEY (id)
);

CREATE TABLE public.configuracion_fechas (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    hora_inicio time without time zone NOT NULL DEFAULT '00:00:00',
    hora_fin time without time zone NOT NULL DEFAULT '23:59:59',
    activo boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    nombre text,
    habilita_encuadre boolean NOT NULL DEFAULT false,
    habilita_firma boolean NOT NULL DEFAULT false,
    habilita_avances boolean NOT NULL DEFAULT false,
    habilita_pua boolean NOT NULL DEFAULT false,
    CONSTRAINT configuracion_fechas_pkey PRIMARY KEY (id)
);


-- ─────────────────────────────────────────────────────────────
-- 3.2 Usuarios (depende de roles)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE public.usuarios (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nombre text NOT NULL,
    contraseña text NOT NULL,
    rol_id uuid NOT NULL,
    correo text NOT NULL UNIQUE,
    debe_cambiar_password boolean DEFAULT false,
    password_expira_at timestamp with time zone,
    CONSTRAINT usuarios_pkey PRIMARY KEY (id),
    CONSTRAINT usuarios_role_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id)
);


-- ─────────────────────────────────────────────────────────────
-- 3.3 Materias (depende de licenciaturas)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE public.materias (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    clave text NOT NULL UNIQUE,
    nombre_materia text NOT NULL,
    licenciatura text NOT NULL,
    categoria public.categoria_enum NOT NULL,
    requisito public.requisito_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    estado text,
    licenciatura_id uuid,
    periodo text,
    plan_estudios text,
    archivada boolean NOT NULL DEFAULT false,
    CONSTRAINT materias_pkey PRIMARY KEY (id),
    CONSTRAINT materias_licenciatura_id_fkey FOREIGN KEY (licenciatura_id) REFERENCES public.licenciaturas(id)
);


-- ─────────────────────────────────────────────────────────────
-- 3.4 Programas / PUA (depende de materias, usuarios)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE public.programas (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    materia_id uuid NOT NULL,
    unidades integer,
    estado_programa text DEFAULT 'borrador',
    creado_por uuid,
    publicado_at timestamp with time zone,
    proposito text,
    competencia text,
    evidencias text,
    periodo text,
    unidad_academica text,
    programa_educativo text,
    plan_estudios text,
    hc integer,
    hl integer,
    ht integer,
    hpc integer,
    hcl integer,
    he integer,
    cr integer,
    etapa_formacion text,
    caracter_ua text,
    requisitos text,
    metodo_encuadre text,
    metodo_estrategia_docente text,
    metodo_estrategia_alumno text,
    referencias_basicas text,
    referencias_complementarias text,
    perfil_docente text,
    ultimo_editor_id uuid,
    ultima_edicion timestamp with time zone,
    activo boolean NOT NULL DEFAULT true,
    archivado boolean NOT NULL DEFAULT false,
    archivada_at timestamp with time zone,
    archivada_por uuid,
    CONSTRAINT programas_pkey PRIMARY KEY (id),
    CONSTRAINT programas_materia_id_fkey FOREIGN KEY (materia_id) REFERENCES public.materias(id) ON DELETE CASCADE,
    CONSTRAINT programas_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuarios(id),
    CONSTRAINT programas_ultimo_editor_id_fkey FOREIGN KEY (ultimo_editor_id) REFERENCES public.usuarios(id),
    CONSTRAINT programas_archivada_por_fkey FOREIGN KEY (archivada_por) REFERENCES public.usuarios(id)
);


-- ─────────────────────────────────────────────────────────────
-- 3.5 Estructura académica del PUA (depende de programas)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE public.unidades (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    programa_id uuid NOT NULL,
    numero bigint NOT NULL,
    titulo text,
    competencia text NOT NULL,
    duracion bigint,
    nombre text,
    contenido text,
    semana_inicio integer,
    semana_fin integer,
    CONSTRAINT unidades_pkey PRIMARY KEY (id),
    CONSTRAINT unidades_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.programas(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE public.temas (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    unidad_id bigint NOT NULL,
    numero character varying NOT NULL,
    nombre text NOT NULL,
    CONSTRAINT temas_pkey PRIMARY KEY (id),
    CONSTRAINT temas_unidad_id_fkey FOREIGN KEY (unidad_id) REFERENCES public.unidades(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE public.practicas_laboratorio (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    unidad_id bigint,
    numero bigint,
    nombre character varying,
    duracion bigint,
    programa_id uuid,
    unidad integer,
    competencia text,
    descripcion text,
    material_apoyo text,
    CONSTRAINT practicas_laboratorio_pkey PRIMARY KEY (id),
    CONSTRAINT practicas_laboratorio_unidad_id_fkey FOREIGN KEY (unidad_id) REFERENCES public.unidades(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT practicas_laboratorio_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.programas(id) ON DELETE CASCADE
);

CREATE TABLE public.practicas_taller (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    unidad_id bigint,
    numero bigint,
    nombre character varying,
    duracion bigint,
    programa_id uuid,
    unidad integer,
    competencia text,
    descripcion text,
    material_apoyo text,
    CONSTRAINT practicas_taller_pkey PRIMARY KEY (id),
    CONSTRAINT practicas_taller_unidad_id_fkey FOREIGN KEY (unidad_id) REFERENCES public.unidades(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT practicas_taller_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.programas(id) ON DELETE CASCADE
);


-- ─────────────────────────────────────────────────────────────
-- 3.6 Encuadres y su contenido (depende de programas, usuarios)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE public.encuadres (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    programa_id uuid NOT NULL,
    estado_encuadre text DEFAULT 'borrador',
    creado_por uuid,
    publicado_at timestamp with time zone,
    usuario_id uuid NOT NULL,
    grupo text NOT NULL DEFAULT '381',
    periodo text,
    descripcion_evaluacion text,
    derecho_ordinario text,
    derecho_extraordinario text,
    descripcion_producto text,
    bibliografia_basica text,
    normas_conducta text,
    profesor_puede_modificar_criterios boolean DEFAULT true,
    ultimo_editor_id uuid,
    ultima_edicion timestamp with time zone,
    seccion text,
    CONSTRAINT encuadres_pkey PRIMARY KEY (id),
    CONSTRAINT encuadres_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.programas(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT encuadres_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuarios(id),
    CONSTRAINT encuadres_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
    CONSTRAINT encuadres_ultimo_editor_id_fkey FOREIGN KEY (ultimo_editor_id) REFERENCES public.usuarios(id)
);

CREATE TABLE public.criterios_evaluacion (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    criterio text NOT NULL,
    valor bigint NOT NULL,
    encuadre_id uuid NOT NULL,
    descripcion text,
    CONSTRAINT criterios_evaluacion_pkey PRIMARY KEY (id),
    CONSTRAINT criterios_evaluacion_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE public.criterios_acreditacion (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    criterio text NOT NULL,
    encuadre_id uuid NOT NULL,
    CONSTRAINT criterios_acreditacion_pkey PRIMARY KEY (id),
    CONSTRAINT criterios_acreditacion_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE public.plan_temas (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    tema_id bigint NOT NULL,
    semana integer NOT NULL,
    encuadre_id uuid NOT NULL,
    CONSTRAINT plan_temas_pkey PRIMARY KEY (id),
    CONSTRAINT plan_temas_tema_id_fkey FOREIGN KEY (tema_id) REFERENCES public.temas(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT plan_temas_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id) ON UPDATE CASCADE ON DELETE CASCADE
);


-- ─────────────────────────────────────────────────────────────
-- 3.7 Participación de alumnos (depende de encuadres, usuarios)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE public.encuadre_alumnos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    encuadre_id uuid NOT NULL,
    alumno_id uuid NOT NULL,
    estado text NOT NULL DEFAULT 'pendiente' CHECK (estado = ANY (ARRAY['pendiente','enviada','activa','revocada'])),
    invitado_at timestamp with time zone NOT NULL DEFAULT now(),
    correo_enviado_at timestamp with time zone,
    clave_expira_at timestamp with time zone,
    ultimo_acceso timestamp with time zone,
    reenvios integer NOT NULL DEFAULT 0,
    invitado_por uuid,
    CONSTRAINT encuadre_alumnos_pkey PRIMARY KEY (id),
    CONSTRAINT encuadre_alumnos_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id) ON DELETE CASCADE,
    CONSTRAINT encuadre_alumnos_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.usuarios(id) ON DELETE CASCADE,
    CONSTRAINT encuadre_alumnos_invitado_por_fkey FOREIGN KEY (invitado_por) REFERENCES public.usuarios(id)
);

CREATE TABLE public.encuadre_checkin (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    encuadre_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    aceptado boolean NOT NULL,
    justificacion text,
    CONSTRAINT encuadre_checkin_pkey PRIMARY KEY (id),
    CONSTRAINT encuadre_checkin_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT encuadre_checkin_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE public.encuadre_firmas (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    encuadre_id uuid NOT NULL,
    alumno_id uuid NOT NULL,
    firmado_at timestamp with time zone NOT NULL DEFAULT now(),
    nombre_firma text,
    CONSTRAINT encuadre_firmas_pkey PRIMARY KEY (id),
    CONSTRAINT encuadre_firmas_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id) ON DELETE CASCADE,
    CONSTRAINT encuadre_firmas_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.usuarios(id) ON DELETE CASCADE
);

CREATE TABLE public.encuadre_evidencias (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    encuadre_id uuid NOT NULL,
    profesor_id uuid,
    foto_url text NOT NULL,
    fecha_presentacion date NOT NULL,
    fecha_subida timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT encuadre_evidencias_pkey PRIMARY KEY (id),
    CONSTRAINT encuadre_evidencias_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id) ON DELETE CASCADE,
    CONSTRAINT encuadre_evidencias_profesor_id_fkey FOREIGN KEY (profesor_id) REFERENCES public.usuarios(id)
);


-- ─────────────────────────────────────────────────────────────
-- 3.8 Avances y checkins (depende de encuadres, usuarios, temas)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE public.temas_checkin (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    tema_id bigint NOT NULL,
    usuario_id uuid NOT NULL,
    grupo text NOT NULL,
    tema_visto boolean NOT NULL DEFAULT false,
    justificacion text DEFAULT '',
    fecha_checkin timestamp without time zone NOT NULL DEFAULT now(),
    encuadre_id uuid,
    CONSTRAINT temas_checkin_pkey PRIMARY KEY (id),
    CONSTRAINT temas_checkin_tema_id_fkey FOREIGN KEY (tema_id) REFERENCES public.temas(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT temas_checkin_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT temas_checkin_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id) ON DELETE CASCADE
);

-- Nota: la tabla checkins parece un mecanismo legacy/experimental de asistencia por
-- QR/NFC (columna coincidencia numeric). Actualmente no la usa ninguna UI visible,
-- pero se preserva para compatibilidad de datos históricos.
CREATE TABLE public.checkins (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    usuario_id uuid,
    materia_id uuid,
    fecha timestamp with time zone DEFAULT now(),
    tipo text NOT NULL CHECK (tipo = ANY (ARRAY['Profesor','Alumno'])),
    estado text DEFAULT 'pendiente',
    coincidencia numeric,
    CONSTRAINT checkins_pkey PRIMARY KEY (id),
    CONSTRAINT checkins_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
    CONSTRAINT checkins_materia_id_fkey FOREIGN KEY (materia_id) REFERENCES public.materias(id)
);


-- ─────────────────────────────────────────────────────────────
-- 3.9 Permisos especiales (depende de usuarios, encuadres, programas)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE public.permisos_operacion_encuadre (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    usuario_id uuid NOT NULL,
    encuadre_id uuid,
    rol_objetivo text NOT NULL CHECK (rol_objetivo = ANY (ARRAY['profesor','alumno','capturista'])),
    motivo text,
    solo_lectura boolean NOT NULL DEFAULT false,
    puede_editar_encuadre boolean NOT NULL DEFAULT false,
    puede_gestionar_alumnos boolean NOT NULL DEFAULT false,
    puede_firmar boolean NOT NULL DEFAULT false,
    puede_registrar_avances boolean NOT NULL DEFAULT false,
    activo boolean NOT NULL DEFAULT true,
    acceso_desde timestamp with time zone NOT NULL DEFAULT now(),
    acceso_hasta timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    creado_por uuid,
    incluye_alumnos boolean NOT NULL DEFAULT false,
    programa_id uuid,
    puede_editar_pua boolean NOT NULL DEFAULT false,
    CONSTRAINT permisos_operacion_encuadre_pkey PRIMARY KEY (id),
    CONSTRAINT permisos_operacion_encuadre_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE,
    CONSTRAINT permisos_operacion_encuadre_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id) ON DELETE CASCADE,
    CONSTRAINT permisos_operacion_encuadre_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.programas(id) ON DELETE CASCADE,
    CONSTRAINT permisos_operacion_encuadre_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuarios(id)
);


-- ─────────────────────────────────────────────────────────────
-- 3.10 Anuncios y notificaciones (depende de usuarios)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE public.anuncios (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    titulo text NOT NULL,
    mensaje text NOT NULL,
    destinatarios public.rol_destinatario[] NOT NULL,
    enviado_at timestamp with time zone DEFAULT now(),
    estado public.anuncio_estado DEFAULT 'borrador',
    metodo text NOT NULL DEFAULT 'correo',
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT anuncios_pkey PRIMARY KEY (id)
);

CREATE TABLE public.notificaciones (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    titulo character varying NOT NULL,
    mensaje text NOT NULL,
    tipo character varying DEFAULT 'info',
    admin_id uuid,
    fecha_creacion timestamp with time zone DEFAULT now(),
    fecha_expiracion timestamp with time zone,
    activa boolean DEFAULT true,
    CONSTRAINT notificaciones_pkey PRIMARY KEY (id),
    CONSTRAINT notificaciones_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.usuarios(id)
);

-- Advertencia conocida: components/notification-bell.tsx hace UPDATE con
-- las columnas `leido` y `updated_at` que no existen aquí. Pendiente validar
-- si Supabase real tiene columnas distintas (ver docs/database/bd.md sección2).
CREATE TABLE public.notificaciones_usuarios (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    usuario_id uuid,
    notificacion_id uuid,
    leida boolean DEFAULT false,
    fecha_lectura timestamp with time zone,
    fecha_creacion timestamp with time zone DEFAULT now(),
    CONSTRAINT notificaciones_usuarios_pkey PRIMARY KEY (id),
    CONSTRAINT notificaciones_usuario_notificacion_id_fkey FOREIGN KEY (notificacion_id) REFERENCES public.notificaciones(id),
    CONSTRAINT notificaciones_usuario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);

CREATE TABLE public.email_outbox (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ad_id uuid,
    user_id uuid,
    email text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    last_error text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    sent_at timestamp with time zone,
    CONSTRAINT email_outbox_pkey PRIMARY KEY (id),
    CONSTRAINT email_outbox_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.anuncios(id) ON DELETE SET NULL,
    CONSTRAINT email_outbox_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE
);


-- ─────────────────────────────────────────────────────────────
-- 3.11 Auditoría (depende de usuarios)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE public.auditoria (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    accion text NOT NULL,
    usuario_id uuid,
    fecha timestamp with time zone DEFAULT now(),
    CONSTRAINT auditoria_pkey PRIMARY KEY (id),
    CONSTRAINT auditoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);


-- =====================================================================================
-- PARTE 4 — Índices
-- =====================================================================================
--
-- PostgreSQL crea índices automáticos SOLO para PRIMARY KEY y UNIQUE constraints.
-- Los índices sobre columnas de FOREIGN KEY se declaran manualmente aquí para
-- acelerar JOINs, ON DELETE CASCADE y filtros por columnas foráneas.
--
-- Criterio de selección:
--   4.1 — Índices sobre TODAS las columnas FK (buena práctica general en PostgreSQL)
--   4.2 — Índices compuestos sobre patrones de consulta calientes observados en el código
--         (principalmente lib/permisoOperacion.ts y componentes de notificaciones)


-- ─────────────────────────────────────────────────────────────
-- 4.1 Índices sobre columnas FK
-- ─────────────────────────────────────────────────────────────

-- usuarios
CREATE INDEX idx_usuarios_rol_id ON public.usuarios(rol_id);

-- materias
CREATE INDEX idx_materias_licenciatura_id ON public.materias(licenciatura_id);

-- programas
CREATE INDEX idx_programas_materia_id ON public.programas(materia_id);
CREATE INDEX idx_programas_creado_por ON public.programas(creado_por);
CREATE INDEX idx_programas_ultimo_editor_id ON public.programas(ultimo_editor_id);
CREATE INDEX idx_programas_archivada_por ON public.programas(archivada_por);

-- unidades
CREATE INDEX idx_unidades_programa_id ON public.unidades(programa_id);

-- temas
CREATE INDEX idx_temas_unidad_id ON public.temas(unidad_id);

-- practicas_laboratorio
CREATE INDEX idx_practicas_laboratorio_unidad_id ON public.practicas_laboratorio(unidad_id);
CREATE INDEX idx_practicas_laboratorio_programa_id ON public.practicas_laboratorio(programa_id);

-- practicas_taller
CREATE INDEX idx_practicas_taller_unidad_id ON public.practicas_taller(unidad_id);
CREATE INDEX idx_practicas_taller_programa_id ON public.practicas_taller(programa_id);

-- encuadres
CREATE INDEX idx_encuadres_programa_id ON public.encuadres(programa_id);
CREATE INDEX idx_encuadres_usuario_id ON public.encuadres(usuario_id);
CREATE INDEX idx_encuadres_creado_por ON public.encuadres(creado_por);
CREATE INDEX idx_encuadres_ultimo_editor_id ON public.encuadres(ultimo_editor_id);

-- criterios_evaluacion / criterios_acreditacion
CREATE INDEX idx_criterios_evaluacion_encuadre_id ON public.criterios_evaluacion(encuadre_id);
CREATE INDEX idx_criterios_acreditacion_encuadre_id ON public.criterios_acreditacion(encuadre_id);

-- plan_temas
CREATE INDEX idx_plan_temas_tema_id ON public.plan_temas(tema_id);
CREATE INDEX idx_plan_temas_encuadre_id ON public.plan_temas(encuadre_id);

-- encuadre_alumnos
CREATE INDEX idx_encuadre_alumnos_encuadre_id ON public.encuadre_alumnos(encuadre_id);
CREATE INDEX idx_encuadre_alumnos_alumno_id ON public.encuadre_alumnos(alumno_id);
CREATE INDEX idx_encuadre_alumnos_invitado_por ON public.encuadre_alumnos(invitado_por);

-- encuadre_checkin
CREATE INDEX idx_encuadre_checkin_encuadre_id ON public.encuadre_checkin(encuadre_id);
CREATE INDEX idx_encuadre_checkin_usuario_id ON public.encuadre_checkin(usuario_id);

-- encuadre_firmas
CREATE INDEX idx_encuadre_firmas_encuadre_id ON public.encuadre_firmas(encuadre_id);
CREATE INDEX idx_encuadre_firmas_alumno_id ON public.encuadre_firmas(alumno_id);

-- encuadre_evidencias
CREATE INDEX idx_encuadre_evidencias_encuadre_id ON public.encuadre_evidencias(encuadre_id);
CREATE INDEX idx_encuadre_evidencias_profesor_id ON public.encuadre_evidencias(profesor_id);

-- temas_checkin
CREATE INDEX idx_temas_checkin_tema_id ON public.temas_checkin(tema_id);
CREATE INDEX idx_temas_checkin_usuario_id ON public.temas_checkin(usuario_id);
CREATE INDEX idx_temas_checkin_encuadre_id ON public.temas_checkin(encuadre_id);

-- checkins (tabla legacy)
CREATE INDEX idx_checkins_usuario_id ON public.checkins(usuario_id);
CREATE INDEX idx_checkins_materia_id ON public.checkins(materia_id);

-- permisos_operacion_encuadre
CREATE INDEX idx_permisos_usuario_id ON public.permisos_operacion_encuadre(usuario_id);
CREATE INDEX idx_permisos_encuadre_id ON public.permisos_operacion_encuadre(encuadre_id);
CREATE INDEX idx_permisos_programa_id ON public.permisos_operacion_encuadre(programa_id);
CREATE INDEX idx_permisos_creado_por ON public.permisos_operacion_encuadre(creado_por);

-- notificaciones
CREATE INDEX idx_notificaciones_admin_id ON public.notificaciones(admin_id);

-- notificaciones_usuarios
CREATE INDEX idx_notif_usuarios_usuario_id ON public.notificaciones_usuarios(usuario_id);
CREATE INDEX idx_notif_usuarios_notificacion_id ON public.notificaciones_usuarios(notificacion_id);

-- email_outbox
CREATE INDEX idx_email_outbox_ad_id ON public.email_outbox(ad_id);
CREATE INDEX idx_email_outbox_user_id ON public.email_outbox(user_id);

-- auditoria
CREATE INDEX idx_auditoria_usuario_id ON public.auditoria(usuario_id);


-- ─────────────────────────────────────────────────────────────
-- 4.2 Índices compuestos sobre patrones de consulta calientes
-- ─────────────────────────────────────────────────────────────

-- lib/permisoOperacion.ts consulta permisos filtrando por (usuario_id, encuadre_id,
-- rol_objetivo, activo) y por (usuario_id, programa_id, rol_objetivo, activo).
-- Un índice compuesto sirve para ambos patrones si empieza por usuario_id.
CREATE INDEX idx_permisos_lookup_encuadre
    ON public.permisos_operacion_encuadre(usuario_id, encuadre_id, rol_objetivo)
    WHERE activo = true;

CREATE INDEX idx_permisos_lookup_programa
    ON public.permisos_operacion_encuadre(usuario_id, programa_id, rol_objetivo)
    WHERE activo = true;

-- Permiso heredado del profesor a los alumnos (lib/permisoOperacion.ts sección5)
CREATE INDEX idx_permisos_herencia_profesor
    ON public.permisos_operacion_encuadre(encuadre_id, rol_objetivo)
    WHERE activo = true AND incluye_alumnos = true;

-- lib/permisoOperacion.ts consulta configuracion_fechas WHERE activo = true.
-- Filtro parcial reduce el índice a solo las ventanas vigentes.
CREATE INDEX idx_configuracion_fechas_activo
    ON public.configuracion_fechas(fecha_inicio, fecha_fin)
    WHERE activo = true;

-- encuadre_alumnos: lookup frecuente por (encuadre_id, alumno_id) desde
-- lib/permisoOperacion.ts sección2 y app/api/alumnos/agregar/route.ts
CREATE INDEX idx_encuadre_alumnos_encuadre_alumno
    ON public.encuadre_alumnos(encuadre_id, alumno_id);

-- notificaciones_usuarios: el dropdown del bell filtra por usuario_id
-- y ordena por fecha_creacion desc. Índice ordenado ayuda al ORDER BY.
CREATE INDEX idx_notif_usuarios_usuario_fecha
    ON public.notificaciones_usuarios(usuario_id, fecha_creacion DESC);

-- email_outbox: el worker de envío filtra por status = 'pending'
-- ordenado por created_at asc. Filtro parcial y ordenado.
CREATE INDEX idx_email_outbox_pendientes
    ON public.email_outbox(created_at)
    WHERE status = 'pending';

-- encuadres: consultas por periodo son comunes (dashboards, clonado, reportes)
CREATE INDEX idx_encuadres_periodo ON public.encuadres(periodo);
CREATE INDEX idx_programas_periodo ON public.programas(periodo);


-- =====================================================================================
-- PARTE 5 — Funciones y RPC
-- =====================================================================================
--
-- ADVERTENCIAS IMPORTANTES ANTES DE EJECUTAR ESTA SECCIÓN EN UNA BD LOCAL:
--
-- 1) Función faltante: `clonar_estructura_periodo`
--    La página `app/(main)/admin/herramientas/clonar-periodo/page.tsx` invoca
--    `supabase.rpc("clonar_estructura_periodo", ...)`. Esta función NO existe
--    en la instancia actual de Supabase (verificado en el Dashboard) y por lo
--    tanto tampoco se puede exportar. La funcionalidad "Clonar periodo" está
--    rota en producción. Ver: docs/database/bd.md sección5.2.
--
-- 2) Dependencia de `auth.uid()` (específico de Supabase)
--    Las funciones marcadas más abajo usan `auth.uid()`, una función provista
--    por la extensión de autenticación de Supabase que devuelve el UUID del
--    usuario autenticado desde el JWT. En una BD PostgreSQL local NO existe
--    este esquema `auth` ni la función, por lo que la creación fallará o su
--    ejecución arrojará error. El operador de la migración deberá decidir:
--       a) crear un shim `auth.uid()` propio (fuera del alcance de este doc),
--       b) reescribir las funciones para recibir el usuario como parámetro, o
--       c) omitir las funciones que dependen de `auth.uid()`.
--    Ver detalle en: docs/database/bd.md sección5.3 y sección12.
--
-- 3) Código muerto (documentado tal como está en Supabase)
--    Tres funciones no son invocadas por ningún path del código actual:
--       - `fn_fanout_anuncio(uuid)` — referencia tablas inexistentes
--         (`user_notifications`, `email_outbox` con columnas antiguas).
--       - `mark_notification_read(uuid)` — referencia `user_notifications`
--         (tabla que no existe en esta BD).
--       - `mark_all_notifications_read()` — usa `fecha_lectura`, columna que
--         puede no existir en `notificaciones_usuarios` (ver sección3.3).
--    Se incluyen tal cual porque el requerimiento es "replicar Supabase 1:1".
--    Si CREATE FUNCTION falla en local por tipos/tablas faltantes, ese fallo
--    refleja un problema preexistente en la BD original.
--
-- =====================================================================================


-- FUNCIÓN 1/8 — eliminar_programa_periodo(uuid)
-- Uso real: llamada como RPC desde admin para eliminar en cascada un programa
-- y todos sus artefactos (unidades, temas, encuadres, criterios, etc).
CREATE OR REPLACE FUNCTION public.eliminar_programa_periodo(p_programa_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_unidad_ids bigint[];
  v_tema_ids   bigint[];
  v_encuadre_ids uuid[];
BEGIN
  SELECT array_agg(id) INTO v_unidad_ids
  FROM unidades WHERE programa_id = p_programa_id;

  IF v_unidad_ids IS NOT NULL THEN
    SELECT array_agg(id) INTO v_tema_ids
    FROM temas WHERE unidad_id = ANY(v_unidad_ids);
  END IF;

  SELECT array_agg(id) INTO v_encuadre_ids
  FROM encuadres WHERE programa_id = p_programa_id;

  IF v_tema_ids IS NOT NULL THEN
    DELETE FROM temas_checkin WHERE tema_id = ANY(v_tema_ids);
    DELETE FROM plan_temas    WHERE tema_id = ANY(v_tema_ids);
    DELETE FROM temas         WHERE id      = ANY(v_tema_ids);
  END IF;

  IF v_encuadre_ids IS NOT NULL THEN
    DELETE FROM criterios_evaluacion   WHERE encuadre_id = ANY(v_encuadre_ids);
    DELETE FROM criterios_acreditacion WHERE encuadre_id = ANY(v_encuadre_ids);
    DELETE FROM encuadre_checkin       WHERE encuadre_id = ANY(v_encuadre_ids);
    DELETE FROM plan_temas             WHERE encuadre_id = ANY(v_encuadre_ids);
    DELETE FROM encuadre_alumnos       WHERE encuadre_id = ANY(v_encuadre_ids);
    DELETE FROM encuadre_firmas        WHERE encuadre_id = ANY(v_encuadre_ids);
    DELETE FROM permisos_operacion_encuadre WHERE encuadre_id = ANY(v_encuadre_ids);
    DELETE FROM encuadres              WHERE id = ANY(v_encuadre_ids);
  END IF;

  DELETE FROM practicas_laboratorio WHERE programa_id = p_programa_id;
  DELETE FROM practicas_taller      WHERE programa_id = p_programa_id;
  DELETE FROM unidades              WHERE programa_id = p_programa_id;

  DELETE FROM programas WHERE id = p_programa_id;
END;
$function$;


-- FUNCIÓN 2/8 — fn_fanout_anuncio() (versión trigger, SIN parámetros)
-- Uso real: NO está enganchada a ningún trigger vigente en la BD (el trigger
-- activo es `tr_anuncios_fanout`, función 8/8). Se conserva por fidelidad al
-- estado de Supabase.
CREATE OR REPLACE FUNCTION public.fn_fanout_anuncio()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO public.notificaciones_usuarios(
        usuario_id,
        notificacion_id,
        leida,
        fecha_creacion
    )
    SELECT
        u.id as usuario_id,
        NEW.id as notificacion_id,
        false as leida,
        NOW() as fecha_creacion
    FROM usuarios u
    ON CONFLICT(usuario_id, notificacion_id) DO NOTHING;

    RETURN NEW;
END;
$function$;


-- FUNCIÓN 3/8 — fn_fanout_anuncio(uuid)  [CÓDIGO MUERTO]
-- Uso real: ningún path del código actual la invoca. Depende de las tablas
-- `user_notifications` y `email_outbox` con columnas antiguas. Su CREATE
-- puede fallar en local por dependencias inexistentes; si es así, coméntala
-- (representa deuda técnica preexistente, no un error de la migración).
CREATE OR REPLACE FUNCTION public.fn_fanout_anuncio(anuncio_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare
  a record;
  d rol_destinatario;
  u record;
begin
  select * into a from public.anuncios where id = anuncio_id;
  if not found then
    raise exception 'Anuncio % no existe', anuncio_id;
  end if;

  foreach d in array a.destinatarios loop
    for u in select * from public.fn_usuarios_por_destinatario(d) loop
      if a.metodo in ('notificacion','ambos') then
        insert into public.user_notifications(user_id, ad_id, kind, title, body, created_at)
        values (u.id, a.id, 'in-app', a.titulo, a.mensaje, coalesce(a.enviado_at, now()))
        on conflict (user_id, ad_id, kind) do nothing;
      end if;

      if a.metodo in ('correo','ambos') then
        insert into public.user_notifications(user_id, ad_id, kind, title, body, created_at)
        values (u.id, a.id, 'email-info', a.titulo, null, coalesce(a.enviado_at, now()))
        on conflict (user_id, ad_id, kind) do nothing;

        insert into public.email_outbox(ad_id, user_id, email, subject, body)
        values (a.id, u.id, u.correo, a.titulo, a.mensaje)
        on conflict (ad_id, user_id) do nothing;
      end if;
    end loop;
  end loop;
end;
$function$;


-- FUNCIÓN 4/8 — fn_usuarios_por_destinatario(rol_destinatario)
-- Uso real: consultada por fn_fanout_anuncio(uuid). Como esa función está
-- muerta, esta también termina siendo código muerto en la práctica. Se
-- conserva porque puede ejecutarse standalone sin errores.
CREATE OR REPLACE FUNCTION public.fn_usuarios_por_destinatario(d rol_destinatario)
 RETURNS TABLE(id uuid, correo text)
 LANGUAGE sql
 STABLE
AS $function$
  select u.id, u.correo
  from public.usuarios u
  join public.roles r on r.id = u.rol_id
  where
    (d = 'todos')
    or (d = 'alumno'   and lower(r.nombre) = 'alumno')
    or (d = 'profesor' and lower(r.nombre) = 'profesor')
    or (d = 'personal' and lower(r.nombre) = 'personal');
$function$;


-- FUNCIÓN 5/8 — insert_notificaciones_usuarios()
-- Uso real: enganchada al trigger `trigger_insert_notificaciones_usuarios`
-- sobre INSERT en `notificaciones`. Es el path vivo del fan-out clásico.
CREATE OR REPLACE FUNCTION public.insert_notificaciones_usuarios()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO notificaciones_usuarios (usuario_id, notificacion_id, leida, fecha_creacion)
    SELECT
        u.id as usuario_id,
        NEW.id as notificacion_id,
        false as leida,
        NOW() as fecha_creacion
    FROM usuarios u;

    RETURN NEW;
END;
$function$;


-- FUNCIÓN 6/8 — mark_all_notifications_read()  [CÓDIGO MUERTO + auth.uid()]
-- Uso real: no invocada por el código. Usa `fecha_lectura`, columna que puede
-- no existir en `notificaciones_usuarios` (ver sección3.3). Depende de `auth.uid()`.
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE public.notificaciones_usuarios
    SET fecha_lectura = NOW()
    WHERE usuario_id = auth.uid();
END;
$function$;


-- FUNCIÓN 7/8 — mark_notification_read(uuid)  [CÓDIGO MUERTO + auth.uid()]
-- Uso real: no invocada. Referencia la tabla `user_notifications` que NO
-- existe en esta BD. Depende de `auth.uid()`. En local su CREATE fallará
-- salvo que primero se cree la tabla o se comente esta función.
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  update public.user_notifications
     set read_at = now()
   where id = p_id
     and user_id = auth.uid();
$function$;


-- FUNCIÓN 8/8 — tr_anuncios_fanout()  [ACTIVA + auth.uid()]
-- Uso real: enganchada al trigger `trg_anuncios_fanout` sobre INSERT en
-- `anuncios`. Cuando un admin crea un anuncio, esta función inserta una fila
-- en `notificaciones` y luego una fila por cada usuario en
-- `notificaciones_usuarios`. USA `auth.uid()` en el campo `admin_id`. En
-- local, sin auth.uid(), el trigger fallará al insertar (admin_id quedará
-- NULL o dará error si es NOT NULL). Ver sección3.3 para alternativas.
CREATE OR REPLACE FUNCTION public.tr_anuncios_fanout()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    nueva_notificacion_id uuid;
BEGIN
    INSERT INTO public.notificaciones(
        titulo,
        mensaje,
        tipo,
        activa,
        admin_id,
        fecha_creacion
    ) VALUES (
        NEW.titulo,
        NEW.mensaje,
        'info',
        true,
        auth.uid(),
        NOW()
    ) RETURNING id INTO nueva_notificacion_id;

    INSERT INTO public.notificaciones_usuarios(
        usuario_id,
        notificacion_id,
        leida,
        fecha_creacion
    )
    SELECT
        u.id,
        nueva_notificacion_id,
        false,
        NOW()
    FROM usuarios u
    WHERE NOT EXISTS (
        SELECT 1 FROM notificaciones_usuarios nu
        WHERE nu.usuario_id = u.id
        AND nu.notificacion_id = nueva_notificacion_id
    );

    RETURN NEW;
END;
$function$;


-- =====================================================================================
-- PARTE 6 — Triggers
-- =====================================================================================
-- Solo hay dos triggers vigentes en la BD. Ambos son AFTER INSERT y realizan
-- fan-out de notificaciones. Depende de las funciones definidas en PARTE 5.

-- TRIGGER 1/2 — trg_anuncios_fanout
-- Al insertar un `anuncios`, replica el contenido a `notificaciones` y a
-- `notificaciones_usuarios` (una fila por usuario). Usa `tr_anuncios_fanout()`.
CREATE TRIGGER trg_anuncios_fanout
    AFTER INSERT ON public.anuncios
    FOR EACH ROW
    EXECUTE FUNCTION public.tr_anuncios_fanout();

-- TRIGGER 2/2 — trigger_insert_notificaciones_usuarios
-- Al insertar en `notificaciones`, crea una fila por usuario en
-- `notificaciones_usuarios`. Usa `insert_notificaciones_usuarios()`.
-- OJO: combinado con el trigger anterior puede producir duplicados si un
-- INSERT en `anuncios` termina cascadeando también aquí. En Supabase esto
-- se controla por el WHERE NOT EXISTS de la función anterior.
CREATE TRIGGER trigger_insert_notificaciones_usuarios
    AFTER INSERT ON public.notificaciones
    FOR EACH ROW
    EXECUTE FUNCTION public.insert_notificaciones_usuarios();


-- =====================================================================================
-- PARTE 7 — Row Level Security (RLS)
-- =====================================================================================
--
-- NOTAS DE PORTABILIDAD:
--
-- - Todas las políticas dependen de `auth.uid()` y/o del esquema `auth.users`,
--   ambos provistos por Supabase. En una BD local PostgreSQL puro fallarán.
--
-- - Las políticas 10-13 (`anon_*_evidencias`) están definidas sobre
--   `storage.objects`, tabla del subsistema de Storage de Supabase. En local
--   NO existe `storage.objects` a menos que se emule con MinIO+extensiones.
--
-- - Recomendación para migración local: OMITIR esta sección completa (RLS es
--   opcional). La aplicación funciona sin RLS mientras el backend haga las
--   validaciones de permisos (que ya hace vía `lib/permisoOperacion.ts`).
--
-- - Si se desea replicar RLS, primero hay que crear un shim `auth.uid()` y
--   una vista `auth.users` que devuelvan datos consistentes con la sesión.
--
-- Para replicar 1:1 con Supabase, descomente el bloque completo.
-- =====================================================================================

/*  --- INICIO BLOQUE RLS (COMENTADO POR DEFECTO EN LOCAL) ---

ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones_usuarios ENABLE ROW LEVEL SECURITY;

-- POLICY 1/13
CREATE POLICY "Admins pueden crear notificaciones"
    ON public.notificaciones
    AS PERMISSIVE
    FOR INSERT
    TO public
    WITH CHECK (auth.uid() IN ( SELECT users.id FROM auth.users WHERE ((users.role)::text = 'admin'::text)));

-- POLICY 2/13
CREATE POLICY "Permitir inserción de notificaciones"
    ON public.notificaciones
    AS PERMISSIVE
    FOR INSERT
    TO public
    WITH CHECK (true);

-- POLICY 3/13
CREATE POLICY "Permitir lectura de notificaciones"
    ON public.notificaciones
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING (true);

-- POLICY 4/13
CREATE POLICY "Todos pueden ver notificaciones activas"
    ON public.notificaciones
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING ((activa = true));

-- POLICY 5/13
CREATE POLICY "Permitir actualización de notificaciones_usuario"
    ON public.notificaciones_usuarios
    AS PERMISSIVE
    FOR UPDATE
    TO public
    USING (true);

-- POLICY 6/13
CREATE POLICY "Permitir inserción de notificaciones_usuario"
    ON public.notificaciones_usuarios
    AS PERMISSIVE
    FOR INSERT
    TO public
    WITH CHECK (true);

-- POLICY 7/13
CREATE POLICY "Permitir lectura de notificaciones_usuario"
    ON public.notificaciones_usuarios
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING (true);

-- POLICY 8/13
CREATE POLICY "Usuarios pueden actualizar sus notificaciones"
    ON public.notificaciones_usuarios
    AS PERMISSIVE
    FOR UPDATE
    TO public
    USING ((auth.uid() = usuario_id));

-- POLICY 9/13
CREATE POLICY "Usuarios pueden ver sus notificaciones"
    ON public.notificaciones_usuarios
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING ((auth.uid() = usuario_id));

-- POLICIES 10-13: storage.objects (SOLO SUPABASE STORAGE — omitir en local puro)
CREATE POLICY "anon_delete_evidencias"
    ON storage.objects
    AS PERMISSIVE
    FOR DELETE
    TO anon, authenticated
    USING ((bucket_id = 'evidencias-encuadre'::text));

CREATE POLICY "anon_insert_evidencias"
    ON storage.objects
    AS PERMISSIVE
    FOR INSERT
    TO anon, authenticated
    WITH CHECK ((bucket_id = 'evidencias-encuadre'::text));

CREATE POLICY "anon_select_evidencias"
    ON storage.objects
    AS PERMISSIVE
    FOR SELECT
    TO anon, authenticated
    USING ((bucket_id = 'evidencias-encuadre'::text));

CREATE POLICY "anon_update_evidencias"
    ON storage.objects
    AS PERMISSIVE
    FOR UPDATE
    TO anon, authenticated
    USING ((bucket_id = 'evidencias-encuadre'::text));

    --- FIN BLOQUE RLS ---
*/


-- =====================================================================================
-- PARTE 8 — Datos semilla
-- =====================================================================================
-- Roles reconocidos por el sistema. La aplicación referencia estos nombres
-- exactos (case-sensitive en lower en varias comparaciones). No modificar.
--
-- Los IDs se generan aquí; si se necesita conservar los mismos UUIDs que en
-- producción, exportar `SELECT id, nombre FROM public.roles;` desde Supabase
-- y reemplazar este INSERT con los valores literales.
--
-- Divergencia conocida (verificada 2026-09-21): Supabase actual tiene 5 roles
-- (falta 'personal'). El código de la app (fn_usuarios_por_destinatario, el
-- rol_destinatario enum y lib/auth.ts) sí lo referencia. Aquí se siembra el 6.º
-- para compatibilidad con el código y para local; si se replican datos desde
-- Supabase con pg_dump, quedarán solo 5. Ver docs/database/bd.md sección 13.

INSERT INTO public.roles (nombre) VALUES
    ('admin'),
    ('capturista'),
    ('profesor'),
    ('alumno'),
    ('lector'),
    ('personal')
ON CONFLICT (nombre) DO NOTHING;

-- Nota: no se incluyen datos semilla de usuarios. La app tiene endpoints de
-- alta (`app/api/usuarios/crear`) que aplican bcrypt salt 12 al password.
-- Para crear el primer admin en local, ejecutar manualmente:
--
--   INSERT INTO public.usuarios (correo, contrasena, nombre_completo, rol_id)
--   VALUES (
--       'admin@local',
--       '<hash bcrypt salt 12 de la contraseña deseada>',
--       'Administrador Local',
--       (SELECT id FROM public.roles WHERE nombre = 'admin')
--   );
--
-- Ver: docs/database/bd.md sección12.7 para el procedimiento completo.
