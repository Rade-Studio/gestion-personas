# Especificaciones Funcionales - Sistema de Gestión de Votantes

## 1. Información General del Sistema

### 1.1. Stack Tecnológico
- **Frontend**: React.js con Next.js
- **Backend**: Supabase
- **Base de Datos**: Supabase (PostgreSQL)
- **Almacenamiento de Archivos**: Supabase Storage
- **Autenticación**: Supabase Auth (JWT)
- **Arquitectura**: Modular basada en features

### 1.2. Tipos de Usuarios/Roles

El sistema contempla dos tipos de usuarios con diferentes niveles de acceso:

#### 1.2.1. Usuario Estándar (Líder)
- Puede gestionar todo el aplicativo web
- Visualiza únicamente los datos registrados por él mismo
- Acceso limitado a sus propios registros

#### 1.2.2. Usuario Administrador (Admin)
- Puede visualizar todos los datos registrados sin filtro de usuario
- Tiene acceso completo a todos los registros del sistema
- Acceso adicional a un CRUD de usuarios para:
  - Crear perfiles de usuarios
  - Asignar contraseñas por defecto
  - Gestionar usuarios del sistema

## 2. Gestión de Personas/Votantes

### 2.1. Operaciones CRUD

El sistema permite realizar las siguientes operaciones sobre las personas (votantes electorales):

- **Crear**: Registrar nuevas personas en el sistema
- **Ver/Leer**: Visualizar el listado y detalles de personas registradas
- **Actualizar**: Modificar datos de personas existentes
- **Eliminar**: Remover personas del sistema

### 2.2. Campos de Registro de Personas

#### 2.2.1. Campos Obligatorios
- **Nombres**: Nombre(s) de la persona
- **Apellidos**: Apellido(s) de la persona
- **Tipo de Documento**: Tipo de identificación
  - Valor por defecto: CC (Cédula de Ciudadanía)
  - Otros valores disponibles: CE (Cédula de Extranjería), Pasaporte, TI (Tarjeta de Identidad), etc.
- **Número de Documento**: Número único de identificación
  - **Regla de negocio**: Debe ser único globalmente (no pueden existir duplicados)
- **Puesto de Votación**: Puesto electoral asignado
- **Mesa de Votación**: Mesa electoral asignada

#### 2.2.2. Campos Opcionales
- **Fecha de Nacimiento**: Fecha de nacimiento de la persona
- **Número de Celular**: Teléfono móvil de contacto
- **Dirección**: Dirección de residencia
- **Barrio**: Barrio de residencia
- **Edad**: Campo calculado automáticamente a partir de la fecha de nacimiento
  - **Regla de negocio**: Se calcula automáticamente, no es editable por el usuario

### 2.3. Confirmación de Voto

#### 2.3.1. Confirmar Voto
- El sistema debe permitir confirmar que una persona ya votó
- Al confirmar el voto, se debe:
  - Registrar el estado de confirmación
  - **Obligatorio**: Subir una imagen como evidencia
  - Almacenar la imagen en Supabase Storage
  - Registrar la fecha y hora de confirmación
  - Registrar el usuario que realizó la confirmación

#### 2.3.2. Especificaciones de la Imagen
- **Formato**: Únicamente archivos de imagen
- **Tamaño máximo**: 5 MB
- **Almacenamiento**: Supabase Storage
- **Validación**: La imagen es obligatoria para confirmar el voto

#### 2.3.3. Reversar Confirmación
- El sistema debe permitir revertir la confirmación de voto en caso de equivocación
- Al reversar:
  - Se debe eliminar o marcar como inactiva la confirmación
  - Se debe mantener un registro de auditoría de la reversión
  - Se debe registrar el usuario que realizó la reversión
  - Se debe registrar la fecha y hora de la reversión

### 2.4. Plantilla de Excel

#### 2.4.1. Descarga de Plantilla
- El sistema debe proporcionar un botón para descargar una plantilla de Excel
- La plantilla debe contener los encabezados de todas las columnas correspondientes a los campos de registro de personas
- La plantilla debe incluir:
  - Encabezados de columnas obligatorias
  - Encabezados de columnas opcionales
  - Ejemplos o instrucciones (opcional en celdas de ejemplo)

## 3. Importación y Exportación de Datos

### 3.1. Importación Masiva de Datos

#### 3.1.1. Proceso de Importación
- El sistema debe permitir importar un archivo Excel con datos de personas
- **Flujo de trabajo**:
  1. El usuario estándar descarga la plantilla (punto 2.4)
  2. Llena los datos en la plantilla
  3. Importa el archivo completado en el sistema
- **Registro masivo**: Todas las personas del archivo se registran de manera masiva
- **Asignación de usuario**: Las personas importadas se asignan automáticamente al usuario que realiza la importación

#### 3.1.2. Registro de Importación
- El sistema debe mantener un registro que identifique que el registro fue realizado por medio de importación
- Este registro debe incluir:
  - Fecha y hora de importación
  - Usuario que realizó la importación
  - Cantidad de registros importados
  - Archivo original (opcional)

#### 3.1.3. Validaciones en Importación
- Validar que no existan duplicados por número de documento (global)
- Validar formato de datos según tipo de campo
- Validar campos obligatorios
- Manejar errores y reportar filas con problemas

### 3.2. Exportación

- **No se implementará funcionalidad de exportación** de datos registrados a Excel
- Solo se proporciona la plantilla para importación

## 4. Filtros y Búsqueda

### 4.1. Filtros Disponibles en la Tabla

La tabla de personas debe incluir los siguientes filtros:

#### 4.1.1. Filtros para Todos los Usuarios
- **Por Puesto de Votación**: Filtrar personas por puesto electoral
- **Por Mesa de Votación**: Filtrar personas por mesa electoral
- **Por Número de Documento**: Búsqueda por número de documento (búsqueda exacta o parcial)

#### 4.1.2. Filtros Exclusivos para Administrador
- **Por Usuario Estándar (Líder)**: Filtrar personas registradas por un líder específico
  - Solo visible y funcional para usuarios con rol de administrador

### 4.2. Comportamiento de Filtros
- Los filtros deben poder combinarse entre sí
- Los filtros deben aplicarse en tiempo real o mediante botón de búsqueda
- La tabla debe actualizarse dinámicamente según los filtros aplicados

## 5. Gestión de Usuarios Líderes

### 5.1. Datos del Usuario Líder

Los usuarios estándar (líderes) deben tener los siguientes datos en su perfil:

- **Nombres**: Nombre(s) del líder
- **Apellidos**: Apellido(s) del líder
- **Tipo de Documento**: Tipo de identificación del líder
- **Número de Documento**: Número de identificación del líder
- **Fecha de Nacimiento**: Fecha de nacimiento del líder
- **Teléfono**: Número de teléfono de contacto del líder

### 5.2. Gestión de Líderes

#### 5.2.1. Para Administradores
- Crear nuevos perfiles de líderes
- Asignar contraseñas por defecto al crear usuarios
- Las contraseñas asignadas permanecen activas (no se requiere cambio en primer login)
- Editar datos de líderes existentes
- Eliminar líderes (con consideraciones de integridad de datos)

#### 5.2.2. Para Líderes
- Ver y editar su propio perfil
- No pueden gestionar otros usuarios

## 6. Página de Resumen/Información General

### 6.1. Métricas y Conteos

La página de resumen debe mostrar las siguientes estadísticas:

#### 6.1.1. Conteo de Personas Registradas
- Total de personas registradas en el sistema
- **Filtro por rol**:
  - **Usuario Estándar (Líder)**: Solo cuenta las personas registradas por él mismo
  - **Usuario Administrador**: Cuenta todas las personas sin filtros

#### 6.1.2. Conteo de Personas Confirmadas
- Total de personas que han confirmado su voto
- **Filtro por rol**:
  - **Usuario Estándar (Líder)**: Solo cuenta las confirmaciones de sus registros
  - **Usuario Administrador**: Cuenta todas las confirmaciones sin filtros

#### 6.1.3. Conteo de Personas No Confirmadas
- Total de personas que aún no han confirmado su voto
- **Filtro por rol**:
  - **Usuario Estándar (Líder)**: Solo cuenta las no confirmadas de sus registros
  - **Usuario Administrador**: Cuenta todas las no confirmadas sin filtros

### 6.2. Visualización de Resumen
- Los conteos deben actualizarse en tiempo real o mediante actualización manual
- Puede incluir gráficos o visualizaciones adicionales (opcional)
- Debe reflejar los filtros aplicados en otras secciones del sistema

## 7. Reglas de Negocio Adicionales

### 7.1. Validaciones
- **Número de Documento**: Debe ser único globalmente en todo el sistema
- **Confirmación de Voto**: Requiere imagen obligatoria (máx. 5MB, solo formatos de imagen)
- **Edad**: Se calcula automáticamente desde la fecha de nacimiento, no es editable

### 7.2. Permisos y Accesos
- Los usuarios estándar solo pueden ver y gestionar sus propios registros
- Los administradores tienen acceso completo a todos los registros
- Los administradores pueden gestionar usuarios (CRUD de líderes)
- Los líderes no pueden gestionar otros usuarios


## 8. Consideraciones Técnicas

### 8.1. Autenticación
- Implementar autenticación mediante Supabase Auth
- Utilizar JWT para sesiones
- Las contraseñas por defecto asignadas por administradores permanecen activas

### 8.2. Almacenamiento de Imágenes
- Utilizar Supabase Storage para almacenar imágenes de confirmación de voto
- Implementar validación de tamaño (máx. 5MB)
- Implementar validación de formato (solo imágenes)
- Asociar imágenes a registros de confirmación de voto

### 8.3. Base de Datos
- Diseñar esquema de base de datos considerando:
  - Tabla de usuarios/roles
  - Tabla de personas/votantes
  - Tabla de confirmaciones de voto
  - Relaciones entre tablas
  - Índices para optimización de búsquedas

## 9. Casos de Uso Principales

### 9.1. Caso de Uso: Registro Manual de Persona
1. Usuario (líder o admin) accede a la sección de gestión de personas
2. Hace clic en "Crear Nueva Persona"
3. Completa el formulario con datos obligatorios y opcionales
4. Sistema valida que el número de documento no esté duplicado
5. Sistema guarda el registro
6. Sistema muestra confirmación de registro exitoso

### 9.2. Caso de Uso: Confirmación de Voto
1. Usuario localiza la persona en la tabla
2. Hace clic en "Confirmar Voto"
3. Sistema solicita subir imagen
4. Usuario selecciona y sube imagen (máx. 5MB, solo imágenes)
5. Sistema valida formato y tamaño
6. Sistema almacena imagen en Supabase Storage
7. Sistema registra confirmación con fecha, hora y usuario
8. Sistema actualiza estado de la persona

### 9.3. Caso de Uso: Importación Masiva
1. Usuario descarga plantilla Excel
2. Usuario completa plantilla con datos
3. Usuario accede a opción de importación
4. Usuario selecciona archivo completado
5. Sistema valida formato del archivo
6. Sistema procesa datos y valida duplicados
7. Sistema registra todas las personas válidas
8. Sistema marca registros como "importados"
9. Sistema muestra reporte de importación (éxitos y errores)

### 9.4. Caso de Uso: Administrador Gestiona Líder
1. Administrador accede a sección de gestión de usuarios
2. Hace clic en "Crear Nuevo Líder"
3. Completa datos del líder
4. Asigna contraseña por defecto
5. Sistema crea usuario con rol "líder"
6. Sistema envía credenciales (opcional)

## 10. Requerimientos No Funcionales

### 10.1. Rendimiento
- La importación masiva debe manejar archivos con múltiples registros de manera eficiente
- Las búsquedas y filtros deben ser rápidos y responsivos

### 10.2. Seguridad
- Autenticación segura mediante Supabase Auth
- Validación de permisos en cada operación
- Protección contra inyección SQL (Supabase maneja esto)
- Validación de archivos subidos

### 10.3. Usabilidad
- Interfaz intuitiva y fácil de usar
- Mensajes de error claros y descriptivos
- Confirmaciones para acciones destructivas (eliminar, reversar)

---

**Versión del Documento**: 1.0  
**Fecha de Creación**: 2024  
**Última Actualización**: 2024
