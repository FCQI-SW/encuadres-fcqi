-- verificar_bd.sql
-- Consultas de solo lectura para verificar en Supabase lo que dicen el PDF, bd.md y codigo.md.
-- Ejecutar en el SQL Editor de Supabase UNA CONSULTA A LA VEZ
-- (el editor solo muestra el resultado de la ultima). Ninguna modifica datos.
-- Exportar cada resultado (CSV o copiar) con el numero de consulta.


-- 1. Numero de tablas en public. PDF: 27.
select count(*) as tablas_public
from pg_tables
where schemaname = 'public';


-- 2. Numero de llaves foraneas en public. PDF: 44.
select count(*) as foreign_keys
from pg_constraint
where contype = 'f' and connamespace = 'public'::regnamespace;


-- 3. Estado de RLS por tabla. PDF: RLS desactivado en public.
--    codigo.md y bd.md asumen que RLS protege temas_checkin, anuncios, encuadre_firmas, etc.
select c.relname as tabla,
       c.relrowsecurity as rls_activo,
       c.relforcerowsecurity as rls_forzado
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;


-- 4. Existe user_notifications y que tipo de objeto es.
--    bd.md la llama tabla muerta; el PDF dice que no aparecio entre las tablas.
--    relkind: r = tabla, v = vista, m = vista materializada. Sin filas = no existe.
select n.nspname as esquema, c.relname, c.relkind
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relname = 'user_notifications';


-- 5. Funciones en public, argumentos y si son SECURITY DEFINER.
--    Confirmar: clonar_estructura_periodo no existe; eliminar_programa_periodo y
--    mark_notification_read son SECURITY DEFINER; cuales son las 3 funciones "muertas".
select p.proname as funcion,
       pg_get_function_identity_arguments(p.oid) as argumentos,
       p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;


-- 6. Definicion de las funciones de notificaciones.
--    PDF: fn_fanout_anuncio usa destinatarios/metodo/email_outbox; mark_all_notifications_read
--    actualiza fecha_lectura pero no leida.
select p.proname, pg_get_functiondef(p.oid) as definicion
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('fn_fanout_anuncio', 'mark_notification_read',
                    'mark_all_notifications_read', 'eliminar_programa_periodo');


-- 7. Triggers en public. PDF: la cadena de anuncios asigna a todos los usuarios
--    sin usar destinatarios ni metodo.
select event_object_table as tabla, trigger_name, action_timing,
       event_manipulation, action_statement
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;


-- 8. Policies en public y storage. PDF: policies abiertas en notificaciones y CRUD
--    para anon/authenticated en el bucket evidencias-encuadre sin validar propietario.
select schemaname, tablename, policyname, permissive, roles, cmd,
       qual as condicion_using, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;


-- 9. Permisos (grants) de anon y authenticated sobre tablas de public.
--    Con RLS apagado, esto define lo que realmente puede hacer la clave anon.
select table_name, grantee,
       string_agg(privilege_type, ', ' order by privilege_type) as privilegios
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated')
group by table_name, grantee
order by table_name, grantee;


-- 10. Quien puede ejecutar funciones de public.
select routine_name, grantee, privilege_type
from information_schema.role_routine_grants
where routine_schema = 'public' and grantee in ('anon', 'authenticated', 'PUBLIC')
order by routine_name, grantee;


-- 11. Roles existentes. Confirmar que bc3ab654-5fc8-401a-a6e2-97903b45cc93 es profesor
--     y que existe el rol personal (6 roles segun codigo.md).
select id, nombre from roles order by nombre;


-- 12. Columnas de las tablas que codigo.md menciona con nombres concretos.
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('unidades', 'temas_checkin', 'materias', 'usuarios',
                     'notificaciones', 'notificaciones_usuarios', 'anuncios',
                     'permisos_operacion_encuadre', 'configuracion_fechas',
                     'practicas_taller', 'practicas_laboratorio',
                     'encuadre_firmas', 'encuadre_alumnos', 'encuadre_evidencias')
order by table_name, ordinal_position;


-- 13. Restricciones unicas y llaves primarias.
--     codigo.md: temas_checkin no tiene UNIQUE (tema_id, usuario_id, grupo),
--     por eso guardarCheckins hace SELECT + UPDATE/INSERT manual.
select conrelid::regclass as tabla, conname, contype,
       pg_get_constraintdef(oid) as definicion
from pg_constraint
where connamespace = 'public'::regnamespace and contype in ('p', 'u')
order by 1, 2;


-- 14. Indices. codigo.md cita idx_permisos_lookup_encuadre e idx_configuracion_fechas_activo.
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;


-- 15. Tipos enum. PDF: falta el inventario completo de enums.
select t.typname as enum, string_agg(e.enumlabel, ', ' order by e.enumsortorder) as valores
from pg_type t
join pg_enum e on e.enumtypid = t.oid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
group by t.typname
order by t.typname;


-- 16. Filas aproximadas por tabla. Sirve para saber si plan_temas, criterios_acreditacion,
--     checkins, encuadre_checkin, configuraciones y auditoria se usan en la practica.
select relname as tabla, n_live_tup as filas_aprox
from pg_stat_user_tables
where schemaname = 'public'
order by relname;


-- 17. Buckets de storage y si son publicos.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets;
