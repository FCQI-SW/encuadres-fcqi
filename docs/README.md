# Documentacion del proyecto

Esta carpeta contiene la documentacion del estado actual de ENCUADRES-FCQI.

## Archivos

### Documentacion_Tecnica_ENCUADRES_FCQI.pdf

Contiene una vista general del proyecto: arquitectura, tecnologias, roles, rutas principales, organizacion del codigo, seguridad, estado actual y pendientes.

### Documentacion_Base_Datos_ENCUADRES_FCQI.pdf

Contiene el detalle de la base de datos revisada directamente en Supabase: tablas, relaciones, funciones, triggers, policies, RLS, Storage y puntos pendientes de revisar.

### database/estructura-bd-referencia.sql

Archivo de referencia con la estructura SQL recopilada de la base actual.

Incluye:

- definicion de tablas
- 44 foreign keys
- 8 funciones/RPC
- 2 triggers activos
- 13 policies

## Importante

El archivo SQL representa el estado observado de la base de datos y se incluye como apoyo para mantenimiento.

No debe tomarse como una migracion lista para ejecutar sin revisar antes dependencias, enums, constraints, indices, grants y configuracion de Storage.
