# Limitaciones y Restricciones del Sistema

Este documento detalla todas las limitaciones, restricciones y consideraciones importantes del Sistema de Gestión de Personas.

## Limitaciones Funcionales

### Exportación de Datos

**Limitación:**
- **No existe funcionalidad de exportación** de datos registrados a archivos Excel
- Solo se proporciona plantilla para importación
- Los datos solo se pueden consultar y visualizar en la interfaz web

**Alternativas:**
- Consultar información directamente en la interfaz
- Usar filtros para visualizar datos específicos
- Contactar al equipo técnico para exportaciones especiales

### Confirmación de Voto

**Restricciones de Imágenes:**
- **Tamaño máximo**: 5 MB por imagen
- **Formatos permitidos**: Solo archivos de imagen
  - JPG / JPEG
  - PNG
  - GIF
  - WEBP
- **Obligatorio**: La imagen es requerida para confirmar voto
- **No se permiten**: PDFs, documentos, videos u otros formatos

**Consecuencias:**
- Si la imagen excede 5 MB, debe comprimirse antes de subir
- Si el formato no es de imagen, debe convertirse
- Sin imagen, no se puede completar la confirmación

### Validación de Documentos

**Limitación:**
- La validación de documentos con sistema externo (PocketBase) es **opcional**
- Si no está configurada, el sistema solo valida duplicados internos
- Si está configurada pero el servicio no está disponible, el sistema continúa funcionando

**Implicaciones:**
- Puede haber duplicados entre sistemas si no está configurada
- La sincronización depende de la disponibilidad del servicio externo

### Restricciones de Acceso por Rol

**Líderes:**
- Solo ven y gestionan sus propias personas registradas
- No pueden ver personas de otros líderes
- No pueden gestionar otros usuarios

**Validadores/Confirmadores:**
- Solo ven personas de líderes asignados por su coordinador
- No pueden registrar nuevas personas
- Acceso limitado según asignación

**Coordinadores:**
- Solo ven personas de sus líderes asignados
- No pueden ver personas de otros coordinadores (excepto admin)

**Consultores:**
- Solo lectura, sin capacidad de modificación
- Acceso según asignación de coordinador

### Estados y Transiciones

**Restricciones:**
- No se puede reversar desde DATOS_PENDIENTES
- No se puede avanzar desde CON_NOVEDAD si hay novedad activa sin resolver
- Las reversiones son escalonadas (no se puede saltar estados)

**Flujo obligatorio:**
```
DATOS_PENDIENTES → VERIFICADO → CONFIRMADO → COMPLETADO
```

### Gestión de Usuarios

**Limitaciones:**
- Los líderes **no pueden** crear otros usuarios
- Solo administradores y coordinadores pueden gestionar usuarios
- No se puede cambiar el rol de un usuario después de creado (requiere intervención técnica)

### Novedades

**Restricciones:**
- Una persona con novedad activa no puede avanzar de estado
- Debe resolverse la novedad antes de continuar
- Solo coordinadores y administradores pueden resolver novedades

## Limitaciones Técnicas

### Dependencias de Servicios Externos

**Servicios Requeridos:**
- **Base de Datos**: PostgreSQL (Railway o similar)
- **Almacenamiento**: Cloudflare R2 (S3-compatible)
- **Autenticación**: Auth.js (local)

**Consecuencias:**
- Si algún servicio externo no está disponible, el sistema puede no funcionar
- Requiere conexión a internet constante
- Depende de la disponibilidad de los proveedores de servicios

### Requisitos de Conexión

**Limitación:**
- **Requiere conexión a internet** para funcionar
- No funciona en modo offline
- Depende de la velocidad de conexión para carga de imágenes

### Configuraciones Opcionales

**Fecha de Expedición:**
- Puede ser obligatoria u opcional según configuración
- Si es obligatoria y falta, la persona queda en DATOS_PENDIENTES
- Configuración a nivel de sistema, no por usuario

**Ubicación por Defecto:**
- Opcional configurar departamento y municipio por defecto
- Si no está configurado, debe ingresarse manualmente

**Gráficos de Administrador:**
- Los gráficos avanzados son opcionales
- Se pueden habilitar/deshabilitar desde configuración
- Solo visibles para administradores

**Publicidad de Candidatos:**
- Modal de publicidad en login es opcional
- Se puede habilitar/deshabilitar desde configuración

## Límites de Rendimiento

### Paginación

**Limitación:**
- Los listados están paginados
- Tamaño de página por defecto: 10 registros
- Puede ajustarse pero tiene límites

**Consecuencias:**
- No se pueden ver todos los registros en una sola página
- Debe navegar entre páginas para ver más registros
- Los filtros ayudan a reducir el volumen

### Importación Masiva

**Consideraciones:**
- No hay límite explícito de registros por importación
- El rendimiento depende del tamaño del archivo
- Archivos muy grandes pueden tardar más tiempo

**Recomendaciones:**
- Importar en lotes si el archivo es muy grande
- Verificar formato antes de importar
- Revisar reporte de errores después de importar

### Búsqueda y Filtros

**Limitaciones:**
- Algunos filtros complejos pueden requerir procesamiento en memoria
- Búsquedas muy amplias pueden ser lentas
- Se recomienda usar filtros específicos

## Limitaciones de Configuración

### Contraseñas por Defecto

**Limitación:**
- Las contraseñas por defecto son el número de documento
- No se requiere cambio en primer login
- Los usuarios deben cambiar su contraseña manualmente si lo desean

**Consideraciones de Seguridad:**
- Contraseñas predecibles pueden ser un riesgo
- Se recomienda cambiar contraseñas después del primer acceso
- Los administradores pueden asignar contraseñas personalizadas

### Separación de Datos

**Limitación:**
- Los datos están separados por rol y asignaciones
- Un usuario no puede ver datos fuera de su alcance
- Esto es por diseño de seguridad, no una limitación técnica

**Implicaciones:**
- Los administradores tienen acceso completo
- Otros roles tienen acceso limitado intencionalmente
- No se puede "compartir" acceso temporalmente

### Validación de Duplicados

**Limitación:**
- La validación de duplicados es por número de documento
- No valida duplicados por nombre u otros campos
- Si dos personas tienen el mismo documento, se previene el registro

## Limitaciones de Datos

### Campos Calculados

**Edad:**
- Se calcula automáticamente desde fecha de nacimiento
- **No es editable** manualmente
- Si la fecha de nacimiento es incorrecta, debe corregirse

### Campos Únicos

**Número de Documento:**
- Debe ser único en todo el sistema
- No se pueden registrar dos personas con el mismo documento
- No se puede cambiar después de creado

### Relaciones

**Coordinador-Líder:**
- Un líder solo puede pertenecer a un coordinador
- No se puede cambiar fácilmente (requiere intervención técnica)

**Líder-Personas:**
- Las personas están vinculadas al líder que las registró
- No se puede transferir fácilmente a otro líder

## Consideraciones de Seguridad

### Contraseñas

**Limitación:**
- Las contraseñas por defecto son predecibles
- No hay política de complejidad obligatoria
- No hay expiración automática de contraseñas

**Recomendaciones:**
- Cambiar contraseñas después del primer acceso
- Usar contraseñas seguras
- No compartir credenciales

### Acceso a Datos

**Limitación:**
- Los administradores tienen acceso completo
- No hay auditoría detallada de consultas (solo de modificaciones)
- Los datos sensibles están protegidos por autenticación

### Almacenamiento de Imágenes

**Limitación:**
- Las imágenes se almacenan en servicio externo (Cloudflare R2)
- Depende de la disponibilidad del servicio
- No hay respaldo automático de imágenes (depende del proveedor)

## Limitaciones de Usabilidad

### Interfaz

**Limitaciones:**
- Interfaz en español únicamente
- No hay modo oscuro/claro configurable por usuario
- Diseño responsive pero optimizado para desktop

### Navegación

**Limitaciones:**
- No hay atajos de teclado documentados
- Navegación principalmente por clics
- No hay búsqueda global avanzada

### Reportes

**Limitaciones:**
- No hay generación automática de reportes PDF
- No hay exportación de reportes
- Los reportes se visualizan en pantalla

## Limitaciones de Integración

### APIs Externas

**Limitación:**
- No hay APIs públicas documentadas
- Integración con sistemas externos requiere desarrollo personalizado
- La integración con PocketBase es la única preconfigurada

### Sincronización

**Limitación:**
- No hay sincronización automática bidireccional
- Los cambios deben hacerse manualmente en cada sistema
- La sincronización con PocketBase es unidireccional (hacia PocketBase)

## Limitaciones de Escalabilidad

### Volumen de Datos

**Consideraciones:**
- El sistema está diseñado para manejar grandes volúmenes
- El rendimiento puede verse afectado con millones de registros
- Se recomienda mantener datos históricos organizados

### Usuarios Concurrentes

**Consideraciones:**
- No hay límite explícito de usuarios concurrentes
- El rendimiento depende de la infraestructura
- Puede requerir escalamiento según uso

## Resumen de Limitaciones Críticas

1. **No hay exportación de datos** a Excel
2. **Imágenes limitadas a 5 MB** y solo formatos de imagen
3. **Requiere conexión a internet** constante
4. **Depende de servicios externos** (base de datos, almacenamiento)
5. **Acceso limitado por rol** (por diseño de seguridad)
6. **Contraseñas por defecto** predecibles
7. **No hay modo offline**
8. **Validación de documentos externa opcional**

## Recomendaciones

### Para Usuarios

- Cambiar contraseñas después del primer acceso
- Comprimir imágenes antes de subir si exceden 5 MB
- Usar filtros para mejorar rendimiento
- Resolver novedades rápidamente para no bloquear procesos

### Para Administradores

- Configurar servicios externos correctamente
- Monitorear disponibilidad de servicios
- Gestionar usuarios y permisos adecuadamente
- Realizar respaldos periódicos

### Para Desarrollo Futuro

- Considerar exportación de datos
- Implementar políticas de contraseñas más estrictas
- Agregar más formatos de exportación
- Mejorar reportes y visualizaciones

---

**Versión del Documento**: 1.0  
**Fecha de Actualización**: Enero 2026
