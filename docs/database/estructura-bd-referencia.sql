-- ENCUADRES-FCQI
-- Esquema de referencia de la base de datos
--
-- Este archivo fue armado a partir del estado observado en la instancia activa de Supabase.
-- Incluye tablas, foreign keys, funciones/RPC, triggers y policies.
--
-- IMPORTANTE:
-- No usar este archivo directamente como migracion sin antes validar:
-- - orden de creacion de tablas y dependencias
-- - enums y tipos definidos por el usuario
-- - indices y constraints adicionales
-- - grants y permisos de ejecucion
-- - configuracion de Storage
-- - posibles constraints duplicados entre CREATE TABLE y ALTER TABLE
--
-- Su objetivo principal es servir como referencia tecnica para mantenimiento y continuidad.
--

-- ====================================================================================================
-- SECCION 1 - DEFINICION DE TABLAS
-- ====================================================================================================

-- TABLA: public.anuncios

CREATE TABLE public.anuncios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  mensaje text NOT NULL,
  destinatarios ARRAY NOT NULL,
  enviado_at timestamp with time zone DEFAULT now(),
  estado USER-DEFINED DEFAULT 'borrador'::anuncio_estado,
  metodo text NOT NULL DEFAULT 'correo'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT anuncios_pkey PRIMARY KEY (id)
);
-- TABLA: public.auditoria

CREATE TABLE public.auditoria (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  accion text NOT NULL,
  usuario_id uuid,
  fecha timestamp with time zone DEFAULT now(),
  CONSTRAINT auditoria_pkey PRIMARY KEY (id),
  CONSTRAINT auditoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);
-- TABLA: public.checkins

CREATE TABLE public.checkins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid,
  materia_id uuid,
  fecha timestamp with time zone DEFAULT now(),
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['Profesor'::text, 'Alumno'::text])),
  estado text DEFAULT 'pendiente'::text,
  coincidencia numeric,
  CONSTRAINT checkins_pkey PRIMARY KEY (id),
  CONSTRAINT checkins_materia_id_fkey FOREIGN KEY (materia_id) REFERENCES public.materias(id),
  CONSTRAINT checkins_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);
-- TABLA: public.configuraciones

CREATE TABLE public.configuraciones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  horario_inicio text NOT NULL,
  horario_fin text NOT NULL,
  mantenimiento_inicio timestamp with time zone,
  mantenimiento_fin timestamp with time zone,
  CONSTRAINT configuraciones_pkey PRIMARY KEY (id)
);
-- TABLA: public.criterios_acreditacion

CREATE TABLE public.criterios_acreditacion (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  criterio text NOT NULL,
  encuadre_id uuid NOT NULL,
  CONSTRAINT criterios_acreditacion_pkey PRIMARY KEY (id),
  CONSTRAINT criterios_acreditacion_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id)
);
-- TABLA: public.criterios_evaluacion

CREATE TABLE public.criterios_evaluacion (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  criterio text NOT NULL,
  valor bigint NOT NULL,
  encuadre_id uuid NOT NULL,
  descripcion text,
  CONSTRAINT criterios_evaluacion_pkey PRIMARY KEY (id),
  CONSTRAINT criterios_evaluacion_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id)
);
-- TABLA: public.email_outbox

CREATE TABLE public.email_outbox (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ad_id uuid,
  user_id uuid,
  email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  last_error text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  sent_at timestamp with time zone,
  CONSTRAINT email_outbox_pkey PRIMARY KEY (id),
  CONSTRAINT email_outbox_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.anuncios(id),
  CONSTRAINT email_outbox_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id)
);
-- TABLA: public.encuadre_checkin

CREATE TABLE public.encuadre_checkin (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  encuadre_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  aceptado boolean NOT NULL,
  justificacion text,
  CONSTRAINT encuadre_checkin_pkey PRIMARY KEY (id),
  CONSTRAINT encuadre_checkin_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id),
  CONSTRAINT encuadre_checkin_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);
-- TABLA: public.encuadres

CREATE TABLE public.encuadres (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  programa_id uuid NOT NULL,
  estado_encuadre text DEFAULT 'borrador'::text,
  creado_por uuid,
  publicado_at timestamp with time zone,
  usuario_id uuid NOT NULL,
  grupo text NOT NULL DEFAULT '381'::text,
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
  CONSTRAINT encuadres_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuarios(id),
  CONSTRAINT encuadres_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.programas(id),
  CONSTRAINT encuadres_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
  CONSTRAINT encuadres_ultimo_editor_id_fkey FOREIGN KEY (ultimo_editor_id) REFERENCES public.usuarios(id)
);
-- TABLA: public.materias

CREATE TABLE public.materias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clave text NOT NULL UNIQUE,
  nombre_materia text NOT NULL,
  licenciatura text NOT NULL,
  categoria USER-DEFINED NOT NULL,
  requisito USER-DEFINED NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  estado text,
  licenciatura_id uuid,
  periodo text,
  plan_estudios text,
  archivada boolean NOT NULL DEFAULT false,
  CONSTRAINT materias_pkey PRIMARY KEY (id),
  CONSTRAINT materias_licenciatura_id_fkey FOREIGN KEY (licenciatura_id) REFERENCES public.licenciaturas(id)
);
-- TABLA: public.notificaciones

CREATE TABLE public.notificaciones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  titulo character varying NOT NULL,
  mensaje text NOT NULL,
  tipo character varying DEFAULT 'info'::character varying,
  admin_id uuid,
  fecha_creacion timestamp with time zone DEFAULT now(),
  fecha_expiracion timestamp with time zone,
  activa boolean DEFAULT true,
  CONSTRAINT notificaciones_pkey PRIMARY KEY (id),
  CONSTRAINT notificaciones_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.usuarios(id)
);
-- TABLA: public.notificaciones_usuarios

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
-- TABLA: public.plan_temas

CREATE TABLE public.plan_temas (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  tema_id bigint NOT NULL,
  semana integer NOT NULL,
  encuadre_id uuid NOT NULL,
  CONSTRAINT plan_temas_pkey PRIMARY KEY (id),
  CONSTRAINT plan_temas_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id),
  CONSTRAINT plan_temas_tema_id_fkey FOREIGN KEY (tema_id) REFERENCES public.temas(id)
);
-- TABLA: public.practicas_laboratorio

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
  CONSTRAINT practicas_laboratorio_unidad_id_fkey FOREIGN KEY (unidad_id) REFERENCES public.unidades(id),
  CONSTRAINT practicas_laboratorio_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.programas(id)
);
-- TABLA: public.practicas_taller

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
  CONSTRAINT practicas_taller_unidad_id_fkey FOREIGN KEY (unidad_id) REFERENCES public.unidades(id),
  CONSTRAINT practicas_taller_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.programas(id)
);
-- TABLA: public.programas

CREATE TABLE public.programas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  materia_id uuid NOT NULL,
  unidades integer,
  estado_programa text DEFAULT 'borrador'::text,
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
  CONSTRAINT programas_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuarios(id),
  CONSTRAINT programas_materia_id_fkey FOREIGN KEY (materia_id) REFERENCES public.materias(id),
  CONSTRAINT programas_ultimo_editor_id_fkey FOREIGN KEY (ultimo_editor_id) REFERENCES public.usuarios(id),
  CONSTRAINT programas_archivada_por_fkey FOREIGN KEY (archivada_por) REFERENCES public.usuarios(id)
);
-- TABLA: public.roles

CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
-- TABLA: public.temas

CREATE TABLE public.temas (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  unidad_id bigint NOT NULL,
  numero character varying NOT NULL,
  nombre text NOT NULL,
  CONSTRAINT temas_pkey PRIMARY KEY (id),
  CONSTRAINT temas_unidad_id_fkey FOREIGN KEY (unidad_id) REFERENCES public.unidades(id)
);
-- TABLA: public.temas_checkin

CREATE TABLE public.temas_checkin (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  tema_id bigint NOT NULL,
  usuario_id uuid NOT NULL,
  grupo text NOT NULL,
  tema_visto boolean NOT NULL DEFAULT false,
  justificacion text DEFAULT ''::text,
  fecha_checkin timestamp without time zone NOT NULL DEFAULT now(),
  encuadre_id uuid,
  CONSTRAINT temas_checkin_pkey PRIMARY KEY (id),
  CONSTRAINT temas_checkin_tema_id_fkey FOREIGN KEY (tema_id) REFERENCES public.temas(id),
  CONSTRAINT temas_checkin_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
  CONSTRAINT temas_checkin_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id)
);
-- TABLA: public.unidades

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
  CONSTRAINT unidades_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.programas(id)
);
-- TABLA: public.usuarios

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
-- TABLA: public.licenciaturas

CREATE TABLE public.licenciaturas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  activa boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT licenciaturas_pkey PRIMARY KEY (id)
);
-- TABLA: public.encuadre_alumnos

CREATE TABLE public.encuadre_alumnos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  encuadre_id uuid NOT NULL,
  alumno_id uuid NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente'::text CHECK (estado = ANY (ARRAY['pendiente'::text, 'enviada'::text, 'activa'::text, 'revocada'::text])),
  invitado_at timestamp with time zone NOT NULL DEFAULT now(),
  correo_enviado_at timestamp with time zone,
  clave_expira_at timestamp with time zone,
  ultimo_acceso timestamp with time zone,
  reenvios integer NOT NULL DEFAULT 0,
  invitado_por uuid,
  CONSTRAINT encuadre_alumnos_pkey PRIMARY KEY (id),
  CONSTRAINT encuadre_alumnos_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id),
  CONSTRAINT encuadre_alumnos_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.usuarios(id),
  CONSTRAINT encuadre_alumnos_invitado_por_fkey FOREIGN KEY (invitado_por) REFERENCES public.usuarios(id)
);
-- TABLA: public.encuadre_firmas

CREATE TABLE public.encuadre_firmas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  encuadre_id uuid NOT NULL,
  alumno_id uuid NOT NULL,
  firmado_at timestamp with time zone NOT NULL DEFAULT now(),
  nombre_firma text,
  CONSTRAINT encuadre_firmas_pkey PRIMARY KEY (id),
  CONSTRAINT encuadre_firmas_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id),
  CONSTRAINT encuadre_firmas_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.usuarios(id)
);
-- TABLA: public.configuracion_fechas

CREATE TABLE public.configuracion_fechas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  fecha_inicio date NOT NULL,
  fecha_fin date NOT NULL,
  hora_inicio time without time zone NOT NULL DEFAULT '00:00:00'::time without time zone,
  hora_fin time without time zone NOT NULL DEFAULT '23:59:59'::time without time zone,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  nombre text,
  habilita_encuadre boolean NOT NULL DEFAULT false,
  habilita_firma boolean NOT NULL DEFAULT false,
  habilita_avances boolean NOT NULL DEFAULT false,
  habilita_pua boolean NOT NULL DEFAULT false,
  CONSTRAINT configuracion_fechas_pkey PRIMARY KEY (id)
);
-- TABLA: public.permisos_operacion_encuadre

CREATE TABLE public.permisos_operacion_encuadre (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  encuadre_id uuid,
  rol_objetivo text NOT NULL CHECK (rol_objetivo = ANY (ARRAY['profesor'::text, 'alumno'::text, 'capturista'::text])),
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
  CONSTRAINT permisos_operacion_encuadre_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
  CONSTRAINT permisos_operacion_encuadre_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id),
  CONSTRAINT permisos_operacion_encuadre_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuarios(id),
  CONSTRAINT permisos_operacion_encuadre_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.programas(id)
);
-- TABLA: public.encuadre_evidencias

CREATE TABLE public.encuadre_evidencias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  encuadre_id uuid NOT NULL,
  profesor_id uuid,
  foto_url text NOT NULL,
  fecha_presentacion date NOT NULL,
  fecha_subida timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT encuadre_evidencias_pkey PRIMARY KEY (id),
  CONSTRAINT encuadre_evidencias_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id),
  CONSTRAINT encuadre_evidencias_profesor_id_fkey FOREIGN KEY (profesor_id) REFERENCES public.usuarios(id)
);




-- ====================================================================================================
-- SECCION 2 - FOREIGN KEYS / RELACIONES ENTRE TABLAS
-- ====================================================================================================

-- FOREIGN KEY 01/44: public.auditoria.usuario_id -> public.usuarios.id

ALTER TABLE public.auditoria
    ADD CONSTRAINT auditoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);

-- FOREIGN KEY 02/44: public.checkins.materia_id -> public.materias.id

ALTER TABLE public.checkins
    ADD CONSTRAINT checkins_materia_id_fkey FOREIGN KEY (materia_id) REFERENCES public.materias(id);

-- FOREIGN KEY 03/44: public.checkins.usuario_id -> public.usuarios.id

ALTER TABLE public.checkins
    ADD CONSTRAINT checkins_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);

-- FOREIGN KEY 04/44: public.criterios_acreditacion.encuadre_id -> public.encuadres.id

ALTER TABLE public.criterios_acreditacion
    ADD CONSTRAINT criterios_acreditacion_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- FOREIGN KEY 05/44: public.criterios_evaluacion.encuadre_id -> public.encuadres.id

ALTER TABLE public.criterios_evaluacion
    ADD CONSTRAINT criterios_evaluacion_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- FOREIGN KEY 06/44: public.email_outbox.ad_id -> public.anuncios.id

ALTER TABLE public.email_outbox
    ADD CONSTRAINT email_outbox_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.anuncios(id) ON DELETE SET NULL;

-- FOREIGN KEY 07/44: public.email_outbox.user_id -> public.usuarios.id

ALTER TABLE public.email_outbox
    ADD CONSTRAINT email_outbox_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;

-- FOREIGN KEY 08/44: public.encuadre_alumnos.alumno_id -> public.usuarios.id

ALTER TABLE public.encuadre_alumnos
    ADD CONSTRAINT encuadre_alumnos_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;

-- FOREIGN KEY 09/44: public.encuadre_alumnos.encuadre_id -> public.encuadres.id

ALTER TABLE public.encuadre_alumnos
    ADD CONSTRAINT encuadre_alumnos_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id) ON DELETE CASCADE;

-- FOREIGN KEY 10/44: public.encuadre_alumnos.invitado_por -> public.usuarios.id

ALTER TABLE public.encuadre_alumnos
    ADD CONSTRAINT encuadre_alumnos_invitado_por_fkey FOREIGN KEY (invitado_por) REFERENCES public.usuarios(id);

-- FOREIGN KEY 11/44: public.encuadre_checkin.encuadre_id -> public.encuadres.id

ALTER TABLE public.encuadre_checkin
    ADD CONSTRAINT encuadre_checkin_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- FOREIGN KEY 12/44: public.encuadre_checkin.usuario_id -> public.usuarios.id

ALTER TABLE public.encuadre_checkin
    ADD CONSTRAINT encuadre_checkin_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- FOREIGN KEY 13/44: public.encuadre_evidencias.encuadre_id -> public.encuadres.id

ALTER TABLE public.encuadre_evidencias
    ADD CONSTRAINT encuadre_evidencias_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id) ON DELETE CASCADE;

-- FOREIGN KEY 14/44: public.encuadre_evidencias.profesor_id -> public.usuarios.id

ALTER TABLE public.encuadre_evidencias
    ADD CONSTRAINT encuadre_evidencias_profesor_id_fkey FOREIGN KEY (profesor_id) REFERENCES public.usuarios(id);

-- FOREIGN KEY 15/44: public.encuadre_firmas.alumno_id -> public.usuarios.id

ALTER TABLE public.encuadre_firmas
    ADD CONSTRAINT encuadre_firmas_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;

-- FOREIGN KEY 16/44: public.encuadre_firmas.encuadre_id -> public.encuadres.id

ALTER TABLE public.encuadre_firmas
    ADD CONSTRAINT encuadre_firmas_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id) ON DELETE CASCADE;

-- FOREIGN KEY 17/44: public.encuadres.creado_por -> public.usuarios.id

ALTER TABLE public.encuadres
    ADD CONSTRAINT encuadres_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuarios(id);

-- FOREIGN KEY 18/44: public.encuadres.programa_id -> public.programas.id

ALTER TABLE public.encuadres
    ADD CONSTRAINT encuadres_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.programas(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- FOREIGN KEY 19/44: public.encuadres.ultimo_editor_id -> public.usuarios.id

ALTER TABLE public.encuadres
    ADD CONSTRAINT encuadres_ultimo_editor_id_fkey FOREIGN KEY (ultimo_editor_id) REFERENCES public.usuarios(id);

-- FOREIGN KEY 20/44: public.encuadres.usuario_id -> public.usuarios.id

ALTER TABLE public.encuadres
    ADD CONSTRAINT encuadres_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);

-- FOREIGN KEY 21/44: public.materias.licenciatura_id -> public.licenciaturas.id

ALTER TABLE public.materias
    ADD CONSTRAINT materias_licenciatura_id_fkey FOREIGN KEY (licenciatura_id) REFERENCES public.licenciaturas(id);

-- FOREIGN KEY 22/44: public.notificaciones.admin_id -> public.usuarios.id

ALTER TABLE public.notificaciones
    ADD CONSTRAINT notificaciones_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.usuarios(id);

-- FOREIGN KEY 23/44: public.notificaciones_usuarios.notificacion_id -> public.notificaciones.id

ALTER TABLE public.notificaciones_usuarios
    ADD CONSTRAINT notificaciones_usuario_notificacion_id_fkey FOREIGN KEY (notificacion_id) REFERENCES public.notificaciones(id);

-- FOREIGN KEY 24/44: public.notificaciones_usuarios.usuario_id -> public.usuarios.id

ALTER TABLE public.notificaciones_usuarios
    ADD CONSTRAINT notificaciones_usuario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);

-- FOREIGN KEY 25/44: public.permisos_operacion_encuadre.creado_por -> public.usuarios.id

ALTER TABLE public.permisos_operacion_encuadre
    ADD CONSTRAINT permisos_operacion_encuadre_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuarios(id);

-- FOREIGN KEY 26/44: public.permisos_operacion_encuadre.encuadre_id -> public.encuadres.id

ALTER TABLE public.permisos_operacion_encuadre
    ADD CONSTRAINT permisos_operacion_encuadre_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id) ON DELETE CASCADE;

-- FOREIGN KEY 27/44: public.permisos_operacion_encuadre.programa_id -> public.programas.id

ALTER TABLE public.permisos_operacion_encuadre
    ADD CONSTRAINT permisos_operacion_encuadre_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.programas(id) ON DELETE CASCADE;

-- FOREIGN KEY 28/44: public.permisos_operacion_encuadre.usuario_id -> public.usuarios.id

ALTER TABLE public.permisos_operacion_encuadre
    ADD CONSTRAINT permisos_operacion_encuadre_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;

-- FOREIGN KEY 29/44: public.plan_temas.encuadre_id -> public.encuadres.id

ALTER TABLE public.plan_temas
    ADD CONSTRAINT plan_temas_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- FOREIGN KEY 30/44: public.plan_temas.tema_id -> public.temas.id

ALTER TABLE public.plan_temas
    ADD CONSTRAINT plan_temas_tema_id_fkey FOREIGN KEY (tema_id) REFERENCES public.temas(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- FOREIGN KEY 31/44: public.practicas_laboratorio.programa_id -> public.programas.id

ALTER TABLE public.practicas_laboratorio
    ADD CONSTRAINT practicas_laboratorio_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.programas(id) ON DELETE CASCADE;

-- FOREIGN KEY 32/44: public.practicas_laboratorio.unidad_id -> public.unidades.id

ALTER TABLE public.practicas_laboratorio
    ADD CONSTRAINT practicas_laboratorio_unidad_id_fkey FOREIGN KEY (unidad_id) REFERENCES public.unidades(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- FOREIGN KEY 33/44: public.practicas_taller.programa_id -> public.programas.id

ALTER TABLE public.practicas_taller
    ADD CONSTRAINT practicas_taller_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.programas(id) ON DELETE CASCADE;

-- FOREIGN KEY 34/44: public.practicas_taller.unidad_id -> public.unidades.id

ALTER TABLE public.practicas_taller
    ADD CONSTRAINT practicas_taller_unidad_id_fkey FOREIGN KEY (unidad_id) REFERENCES public.unidades(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- FOREIGN KEY 35/44: public.programas.archivada_por -> public.usuarios.id

ALTER TABLE public.programas
    ADD CONSTRAINT programas_archivada_por_fkey FOREIGN KEY (archivada_por) REFERENCES public.usuarios(id);

-- FOREIGN KEY 36/44: public.programas.creado_por -> public.usuarios.id

ALTER TABLE public.programas
    ADD CONSTRAINT programas_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuarios(id);

-- FOREIGN KEY 37/44: public.programas.materia_id -> public.materias.id

ALTER TABLE public.programas
    ADD CONSTRAINT programas_materia_id_fkey FOREIGN KEY (materia_id) REFERENCES public.materias(id) ON DELETE CASCADE;

-- FOREIGN KEY 38/44: public.programas.ultimo_editor_id -> public.usuarios.id

ALTER TABLE public.programas
    ADD CONSTRAINT programas_ultimo_editor_id_fkey FOREIGN KEY (ultimo_editor_id) REFERENCES public.usuarios(id);

-- FOREIGN KEY 39/44: public.temas.unidad_id -> public.unidades.id

ALTER TABLE public.temas
    ADD CONSTRAINT temas_unidad_id_fkey FOREIGN KEY (unidad_id) REFERENCES public.unidades(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- FOREIGN KEY 40/44: public.temas_checkin.encuadre_id -> public.encuadres.id

ALTER TABLE public.temas_checkin
    ADD CONSTRAINT temas_checkin_encuadre_id_fkey FOREIGN KEY (encuadre_id) REFERENCES public.encuadres(id) ON DELETE CASCADE;

-- FOREIGN KEY 41/44: public.temas_checkin.tema_id -> public.temas.id

ALTER TABLE public.temas_checkin
    ADD CONSTRAINT temas_checkin_tema_id_fkey FOREIGN KEY (tema_id) REFERENCES public.temas(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- FOREIGN KEY 42/44: public.temas_checkin.usuario_id -> public.usuarios.id

ALTER TABLE public.temas_checkin
    ADD CONSTRAINT temas_checkin_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- FOREIGN KEY 43/44: public.unidades.programa_id -> public.programas.id

ALTER TABLE public.unidades
    ADD CONSTRAINT unidades_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.programas(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- FOREIGN KEY 44/44: public.usuarios.rol_id -> public.roles.id

ALTER TABLE public.usuarios
    ADD CONSTRAINT usuarios_role_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id);


-- ====================================================================================================
-- SECCION 3 - FUNCIONES Y RPC DE POSTGRESQL
-- ====================================================================================================

-- FUNCION / RPC 01/8: public.eliminar_programa_periodo(p_programa_id uuid)

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

-- FUNCION / RPC 02/8: public.fn_fanout_anuncio()

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

-- FUNCION / RPC 03/8: public.fn_fanout_anuncio(anuncio_id uuid)

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

-- FUNCION / RPC 04/8: public.fn_usuarios_por_destinatario(d rol_destinatario)

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

-- FUNCION / RPC 05/8: public.insert_notificaciones_usuarios()

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

-- FUNCION / RPC 06/8: public.mark_all_notifications_read()

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

-- FUNCION / RPC 07/8: public.mark_notification_read(p_id uuid)

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

-- FUNCION / RPC 08/8: public.tr_anuncios_fanout()

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



-- ====================================================================================================
-- SECCION 4 - TRIGGERS ACTIVOS
-- ====================================================================================================

-- TRIGGER 01/2: trg_anuncios_fanout

CREATE TRIGGER trg_anuncios_fanout AFTER INSERT ON anuncios FOR EACH ROW EXECUTE FUNCTION tr_anuncios_fanout();

-- TRIGGER 02/2: trigger_insert_notificaciones_usuarios

CREATE TRIGGER trigger_insert_notificaciones_usuarios AFTER INSERT ON notificaciones FOR EACH ROW EXECUTE FUNCTION insert_notificaciones_usuarios();


-- ====================================================================================================
-- SECCION 5 - POLICIES / POLITICAS DE ACCESO
-- ====================================================================================================

-- POLICY 01/13: "Admins pueden crear notificaciones"

CREATE POLICY "Admins pueden crear notificaciones"
    ON public.notificaciones
    AS PERMISSIVE
    FOR INSERT
    TO public
    WITH CHECK (auth.uid() IN ( SELECT users.id FROM auth.users WHERE ((users.role)::text = 'admin'::text)));

-- POLICY 02/13: "Permitir insercion de notificaciones"

CREATE POLICY "Permitir inserción de notificaciones"
    ON public.notificaciones
    AS PERMISSIVE
    FOR INSERT
    TO public
    WITH CHECK (true);

-- POLICY 03/13: "Permitir lectura de notificaciones"

CREATE POLICY "Permitir lectura de notificaciones"
    ON public.notificaciones
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING (true);

-- POLICY 04/13: "Todos pueden ver notificaciones activas"

CREATE POLICY "Todos pueden ver notificaciones activas"
    ON public.notificaciones
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING ((activa = true));

-- POLICY 05/13: "Permitir actualizacion de notificaciones_usuario"

CREATE POLICY "Permitir actualización de notificaciones_usuario"
    ON public.notificaciones_usuarios
    AS PERMISSIVE
    FOR UPDATE
    TO public
    USING (true);

-- POLICY 06/13: "Permitir insercion de notificaciones_usuario"

CREATE POLICY "Permitir inserción de notificaciones_usuario"
    ON public.notificaciones_usuarios
    AS PERMISSIVE
    FOR INSERT
    TO public
    WITH CHECK (true);

-- POLICY 07/13: "Permitir lectura de notificaciones_usuario"

CREATE POLICY "Permitir lectura de notificaciones_usuario"
    ON public.notificaciones_usuarios
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING (true);

-- POLICY 08/13: "Usuarios pueden actualizar sus notificaciones"

CREATE POLICY "Usuarios pueden actualizar sus notificaciones"
    ON public.notificaciones_usuarios
    AS PERMISSIVE
    FOR UPDATE
    TO public
    USING ((auth.uid() = usuario_id));

-- POLICY 09/13: "Usuarios pueden ver sus notificaciones"

CREATE POLICY "Usuarios pueden ver sus notificaciones"
    ON public.notificaciones_usuarios
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING ((auth.uid() = usuario_id));

-- POLICY 10/13: "anon_delete_evidencias"

CREATE POLICY "anon_delete_evidencias"
    ON storage.objects
    AS PERMISSIVE
    FOR DELETE
    TO anon, authenticated
    USING ((bucket_id = 'evidencias-encuadre'::text));

-- POLICY 11/13: "anon_insert_evidencias"

CREATE POLICY "anon_insert_evidencias"
    ON storage.objects
    AS PERMISSIVE
    FOR INSERT
    TO anon, authenticated
    WITH CHECK ((bucket_id = 'evidencias-encuadre'::text));

-- POLICY 12/13: "anon_select_evidencias"

CREATE POLICY "anon_select_evidencias"
    ON storage.objects
    AS PERMISSIVE
    FOR SELECT
    TO anon, authenticated
    USING ((bucket_id = 'evidencias-encuadre'::text));

-- POLICY 13/13: "anon_update_evidencias"

CREATE POLICY "anon_update_evidencias"
    ON storage.objects
    AS PERMISSIVE
    FOR UPDATE
    TO anon, authenticated
    USING ((bucket_id = 'evidencias-encuadre'::text));

-- ====================================================================================================
-- RESUMEN DEL ARCHIVO - 44 FOREIGN KEYS | 8 FUNCIONES/RPC | 2 TRIGGERS | 13 POLICIES
-- ====================================================================================================
