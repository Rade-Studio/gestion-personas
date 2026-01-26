# Funcionalidades del Sistema de Gestión de Personas

## Descripción General

El Sistema de Gestión de Personas es una aplicación web completa que permite organizar, registrar y hacer seguimiento a todas las personas que participan en actividades o programas. El sistema proporciona herramientas para gestionar información personal, confirmar actividades, generar estadísticas y mantener un control completo del proceso.

## Sistema de Roles y Permisos

El sistema cuenta con 6 roles diferentes, cada uno con permisos específicos:

### 1. Administrador (Admin)

**Permisos completos:**
- Acceso a TODA la información del sistema sin restricciones
- Puede ver todas las personas registradas por cualquier usuario
- Gestión completa de usuarios (crear, editar, eliminar):
  - Coordinadores
  - Líderes
  - Validadores
  - Confirmadores
  - Consultores
- Gestión de candidatos
- Acceso a gráficos y estadísticas avanzadas
- Gestión de barrios y puestos de votación
- Configuración del sistema

### 2. Coordinador

**Permisos:**
- Gestiona líderes asignados a su coordinación
- Ve todas las personas registradas por sus líderes
- Puede crear y gestionar validadores y confirmadores
- Asigna líderes a validadores/confirmadores
- Ve estadísticas de su coordinación
- Puede confirmar votos de personas de sus líderes
- Gestiona su propio perfil

### 3. Líder

**Permisos:**
- Registra y gestiona sus propias personas
- Solo ve las personas que él mismo ha registrado
- Puede crear, editar y eliminar sus registros
- Puede confirmar votos de sus personas (con imagen)
- Ve estadísticas de sus propios registros
- Gestiona su propio perfil
- Puede importar personas desde Excel
- **No puede** gestionar otros usuarios

### 4. Validador

**Permisos:**
- Solo ve personas de líderes asignados por su coordinador
- Puede validar personas (cambiar estado a VERIFICADO)
- Puede crear novedades en personas
- Puede ver información de personas asignadas
- **No puede** registrar nuevas personas
- **No puede** confirmar votos

### 5. Confirmador

**Permisos:**
- Solo ve personas de líderes asignados por su coordinador
- Puede confirmar estados de personas (cambiar a CONFIRMADO)
- Puede crear novedades en personas
- Puede ver información de personas asignadas
- **No puede** registrar nuevas personas
- **No puede** validar personas

### 6. Consultor

**Permisos:**
- Solo lectura de información
- Puede ver personas según su asignación (si tiene coordinador asignado)
- Puede ver estadísticas y reportes
- **No puede** modificar ningún dato
- **No puede** crear registros

## Gestión de Personas

### Operaciones Disponibles

#### Crear Persona
- Registro manual de personas una por una
- Formulario completo con validaciones
- Validación automática de duplicados por número de documento
- Asignación automática al usuario que registra

#### Editar Persona
- Modificación de todos los campos (excepto número de documento)
- Actualización de estados
- Corrección de información errónea

#### Eliminar Persona
- Eliminación de registros (con confirmación)
- Eliminación en cascada de confirmaciones relacionadas
- Sincronización con sistemas externos si está configurado

#### Ver Personas
- Listado completo con paginación
- Filtros avanzados
- Búsqueda por número de documento
- Visualización de detalles completos

### Campos de Registro

#### Campos Obligatorios
- **Nombres**: Nombre(s) de la persona
- **Apellidos**: Apellido(s) de la persona
- **Tipo de Documento**: 
  - CC (Cédula de Ciudadanía) - por defecto
  - CE (Cédula de Extranjería)
  - Pasaporte
  - TI (Tarjeta de Identidad)
  - Otro
- **Número de Documento**: 
  - Debe ser único en todo el sistema
  - No se permiten duplicados
  - Validación automática
- **Puesto de Votación**: Selección de puesto electoral
- **Mesa de Votación**: Número o código de mesa

#### Campos Opcionales
- **Fecha de Nacimiento**: 
  - La edad se calcula automáticamente
  - No es editable manualmente
- **Fecha de Expedición**: 
  - Opcional o requerida según configuración
  - Si es requerida y falta, la persona queda en estado DATOS_PENDIENTES
- **Profesión**: Ocupación o profesión
- **Número de Celular**: Teléfono de contacto
- **Dirección**: Dirección de residencia
- **Barrio**: Selección de barrio del catálogo
- **Departamento**: Departamento de residencia
- **Municipio**: Municipio de residencia

### Estados de las Personas

El sistema maneja 5 estados diferentes para las personas:

#### 1. DATOS_PENDIENTES
- Estado inicial al crear una persona
- Indica que faltan datos obligatorios
- Se requiere completar información para avanzar

#### 2. CON_NOVEDAD
- Indica que hay una observación o problema
- Tiene una novedad activa sin resolver
- No se puede avanzar hasta resolver la novedad

#### 3. VERIFICADO
- Persona validada por un validador
- Datos verificados y correctos
- Puede avanzar al siguiente estado

#### 4. CONFIRMADO
- Estado confirmado por un confirmador
- Lista para completar el proceso
- Puede avanzar a COMPLETADO

#### 5. COMPLETADO
- Confirmación de voto completada
- Tiene imagen de evidencia subida
- Proceso finalizado

### Transiciones de Estados

**Flujo normal:**
```
DATOS_PENDIENTES → VERIFICADO → CONFIRMADO → COMPLETADO
```

**Con novedad:**
```
Cualquier estado → CON_NOVEDAD → (resolver) → Estado anterior
```

**Reversión:**
- COMPLETADO → CONFIRMADO
- CONFIRMADO → VERIFICADO
- VERIFICADO → DATOS_PENDIENTES
- CON_NOVEDAD → DATOS_PENDIENTES (si se resuelve)

## Confirmación de Voto/Actividades

### Proceso de Confirmación

1. **Localizar la persona** en el listado
2. **Seleccionar "Confirmar Voto"**
3. **Subir imagen obligatoria**:
   - Tamaño máximo: 5 MB
   - Formatos permitidos: JPG, JPEG, PNG, GIF, WEBP
   - La imagen es obligatoria
4. **Sistema registra**:
   - Fecha y hora de confirmación
   - Usuario que realizó la confirmación
   - URL de la imagen almacenada
   - Cambia estado a COMPLETADO

### Reversión de Confirmación

- Permite corregir errores
- Revierte el estado de COMPLETADO a CONFIRMADO
- Mantiene historial de la reversión
- Registra quién y cuándo se reversó

### Historial de Confirmaciones

- Cada persona puede tener múltiples confirmaciones
- Solo la última no reversada es la activa
- Se mantiene historial completo de todas las confirmaciones

## Importación Masiva

### Proceso de Importación

1. **Descargar plantilla Excel**:
   - Plantilla con todos los campos
   - Encabezados predefinidos
   - Ejemplos de formato

2. **Completar plantilla**:
   - Llenar datos de múltiples personas
   - Respetar formatos de fechas
   - Completar campos obligatorios

3. **Subir archivo**:
   - Seleccionar archivo completado
   - Sistema valida formato
   - Procesa todas las filas

4. **Validaciones automáticas**:
   - Verifica duplicados por número de documento
   - Valida formatos de datos
   - Verifica campos obligatorios
   - Valida contra sistema externo (si está configurado)

5. **Reporte de resultados**:
   - Total de registros procesados
   - Registros exitosos
   - Registros fallidos con detalles
   - Errores por fila

### Características

- **Asignación automática**: Las personas importadas se asignan al usuario que importa
- **Marcado de importación**: Se identifica que fueron importadas
- **Validación de duplicados**: Previene registros duplicados
- **Procesamiento eficiente**: Maneja archivos grandes
- **Reporte detallado**: Muestra éxitos y errores

## Dashboard y Estadísticas

### Métricas Principales

#### Para Todos los Usuarios
- **Total de personas registradas**: Conteo según permisos
- **Personas confirmadas**: Con estado COMPLETADO
- **Personas pendientes**: Sin confirmar
- **Porcentajes de avance**: Visualización clara

#### Para Administradores (Opcional)
- **Gráficos por líder**: Confirmados vs pendientes
- **Estadísticas por departamento**: Distribución geográfica
- **Estadísticas por municipio**: Detalle municipal
- **Gráficos de confirmaciones**: Por región
- **Comparativas**: Entre coordinadores y líderes

### Filtrado Automático

- Los conteos se ajustan según el rol del usuario:
  - **Líder**: Solo sus propias personas
  - **Coordinador**: Personas de sus líderes
  - **Admin**: Todas las personas
  - **Validador/Confirmador**: Personas de líderes asignados

## Gestión de Usuarios

### Gestión de Líderes

**Por Administradores y Coordinadores:**
- Crear nuevos líderes
- Editar información de líderes
- Eliminar líderes (con consideraciones)
- Asignar contraseñas por defecto
- Asignar a coordinadores
- Asignar candidatos

**Información del Líder:**
- Nombres y apellidos
- Tipo y número de documento
- Fecha de nacimiento
- Teléfono
- Departamento, municipio, zona
- Barrio y puesto de votación
- Candidato asociado
- Coordinador asignado

### Gestión de Coordinadores

**Solo por Administradores:**
- Crear coordinadores
- Editar coordinadores
- Eliminar coordinadores
- Asignar líderes a coordinadores
- Gestionar estructura organizacional

### Gestión de Validadores y Confirmadores

**Por Coordinadores y Administradores:**
- Crear validadores/confirmadores
- Asignar líderes a validadores/confirmadores
- Gestionar permisos de acceso
- Editar información

**Sistema de Filtros:**
- Un validador/confirmador solo ve personas de líderes asignados
- Los coordinadores asignan qué líderes puede ver cada filtro
- Control granular de acceso

### Contraseñas

- **Por defecto**: Número de documento del usuario
- **No requieren cambio**: Las contraseñas asignadas permanecen activas
- **Gestión propia**: Los usuarios pueden cambiar su contraseña desde su perfil

## Gestión de Candidatos

### Funcionalidades

**Solo Administradores:**
- Crear candidatos
- Editar información
- Subir imágenes de candidatos
- Asignar número de tarjetón
- Marcar candidato por defecto
- Eliminar candidatos

**Información del Candidato:**
- Nombre completo
- Número de tarjetón (único)
- Imagen del candidato
- Partido o grupo
- Indicador de candidato por defecto

**Uso:**
- Asociación con líderes y coordinadores
- Publicidad en login (opcional)
- Filtrado y reportes

## Sistema de Filtros

### Concepto

Los "filtros" son usuarios con roles de Validador o Confirmador que tienen acceso limitado a personas de líderes específicos asignados por su coordinador.

### Asignación de Líderes

1. **Coordinador o Admin** crea un validador/confirmador
2. **Asigna líderes** que el filtro puede ver
3. **El filtro solo ve** personas de esos líderes asignados
4. **Puede validar/confirmar** según su rol

### Restricciones

- Un filtro no puede ver personas de líderes no asignados
- No puede registrar nuevas personas
- Solo puede trabajar con personas asignadas

## Sistema de Novedades

### Crear Novedad

- Cualquier usuario puede crear una novedad en una persona
- La novedad incluye:
  - Observación o descripción del problema
  - Fecha de creación
  - Usuario que creó la novedad
  - Estado (activa/resuelta)

### Resolver Novedad

- Los coordinadores y administradores pueden resolver novedades
- Al resolver:
  - Se marca como resuelta
  - Se registra quién la resolvió
  - Se registra fecha de resolución
  - La persona puede avanzar de estado

### Efectos

- Una persona con novedad activa queda en estado CON_NOVEDAD
- No se puede avanzar de estado hasta resolver
- Se puede reversar estado si es necesario

## Gestión de Barrios y Puestos de Votación

### Barrios

- Catálogo de barrios disponibles
- Cada barrio tiene:
  - Código único
  - Nombre
- Se pueden asociar a personas y usuarios

### Puestos de Votación

- Catálogo de puestos electorales
- Cada puesto tiene:
  - Código único
  - Nombre
  - Dirección (opcional)
- Se pueden asociar a personas y usuarios

## Búsqueda y Filtros

### Filtros Disponibles

#### Para Todos los Usuarios
- **Por Puesto de Votación**: Selección múltiple
- **Por Barrio**: Selección múltiple
- **Por Número de Documento**: Búsqueda parcial
- **Por Estado**: Filtro por estado de persona
- **Por Mesa de Votación**: Búsqueda por mesa

#### Solo para Administradores
- **Por Coordinador**: Filtrar por coordinador
- **Por Líder**: Filtrar por líder específico

### Características

- **Combinación de filtros**: Se pueden aplicar múltiples filtros simultáneamente
- **Búsqueda en tiempo real**: Los resultados se actualizan automáticamente
- **Paginación**: Manejo eficiente de grandes volúmenes
- **Ordenamiento**: Por diferentes columnas

## Perfil de Usuario

### Información Personal

- Ver información completa del perfil
- Editar datos personales
- Actualizar contraseña
- Ver información de contacto

### Restricciones

- Los usuarios solo pueden editar su propio perfil
- No pueden cambiar su rol
- Algunos campos pueden ser administrados por admin

## Integración con Sistemas Externos

### Validación de Documentos (Opcional)

Si está configurado PocketBase:
- **Validación de duplicados**: Verifica si el documento existe en sistema externo
- **Sincronización**: Crea registros en sistema externo al registrar personas
- **Eliminación**: Sincroniza eliminaciones
- **Información de representante**: Muestra dónde está registrado el documento

### Configuración

- Se puede habilitar/deshabilitar desde variables de entorno
- Si no está disponible, el sistema funciona normalmente
- No es obligatorio para el funcionamiento básico

## Exportación de Datos

### Limitación Actual

- **No hay exportación** de datos a Excel
- Solo se proporciona plantilla para importación
- Los datos se pueden consultar en la interfaz web

## Seguridad y Auditoría

### Trazabilidad

- Se registra quién creó cada registro
- Se registra quién modificó información
- Se registra quién confirmó votos
- Se registra quién validó/confirmó estados
- Historial de cambios de estado

### Control de Acceso

- Autenticación requerida para todas las operaciones
- Permisos basados en roles
- Separación de datos por rol
- Validación de permisos en cada operación

---

**Versión del Documento**: 2.0  
**Fecha de Actualización**: Enero 2026
