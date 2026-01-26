# Manual de Usuario - Sistema de Gestión de Personas

## Introducción

Este manual proporciona instrucciones detalladas para usar el Sistema de Gestión de Personas. Siga las secciones según su rol y necesidades.

## Tabla de Contenidos

1. [Inicio de Sesión](#inicio-de-sesión)
2. [Navegación](#navegación)
3. [Gestión de Personas](#gestión-de-personas)
4. [Confirmación de Voto](#confirmación-de-voto)
5. [Importación Masiva](#importación-masiva)
6. [Dashboard y Estadísticas](#dashboard-y-estadísticas)
7. [Gestión de Usuarios](#gestión-de-usuarios)
8. [Sistema de Filtros](#sistema-de-filtros)
9. [Novedades](#novedades)
10. [Perfil de Usuario](#perfil-de-usuario)
11. [Solución de Problemas](#solución-de-problemas)

## Inicio de Sesión

### Acceso al Sistema

1. Abra su navegador web
2. Ingrese la URL del sistema proporcionada por su administrador
3. Será redirigido a la página de login

### Credenciales

**Primera vez:**
- **Email**: Se genera automáticamente como `{numero_documento}@sistema.local`
- **Contraseña**: Su número de documento

**Ejemplo:**
- Si su documento es `1234567890`
- Email: `1234567890@sistema.local`
- Contraseña: `1234567890`

### Cambiar Contraseña

1. Inicie sesión
2. Vaya a **Perfil** (menú superior derecho)
3. Haga clic en **Cambiar Contraseña**
4. Ingrese contraseña actual y nueva
5. Confirme el cambio

## Navegación

### Menú Principal

El menú lateral contiene las siguientes opciones (según su rol):

- **Dashboard**: Resumen y estadísticas
- **Personas**: Gestión de personas
- **Líderes**: Gestión de líderes (solo admin/coordinador)
- **Coordinadores**: Gestión de coordinadores (solo admin)
- **Candidatos**: Gestión de candidatos (solo admin)
- **Filtros**: Gestión de validadores/confirmadores (solo admin/coordinador)
- **Perfil**: Información personal

### Barra Superior

- **Avatar**: Acceso rápido al perfil
- **Cerrar Sesión**: Salir del sistema

## Gestión de Personas

### Ver Listado de Personas

1. Haga clic en **Personas** en el menú
2. Verá una tabla con todas las personas según sus permisos
3. Use los filtros para encontrar personas específicas

### Crear Nueva Persona

1. En la página de Personas, haga clic en **Nueva Persona**
2. Complete el formulario:

   **Campos Obligatorios:**
   - Nombres
   - Apellidos
   - Tipo de Documento
   - Número de Documento (único)
   - Puesto de Votación
   - Mesa de Votación

   **Campos Opcionales:**
   - Fecha de Nacimiento
   - Fecha de Expedición (si es requerida)
   - Profesión
   - Número de Celular
   - Dirección
   - Barrio
   - Departamento
   - Municipio

3. Haga clic en **Guardar**
4. El sistema validará que no haya duplicados

### Editar Persona

1. En el listado, localice la persona
2. Haga clic en el botón **Editar** (ícono de lápiz)
3. Modifique los campos necesarios
4. **Nota**: No se puede cambiar el número de documento
5. Haga clic en **Guardar**

### Eliminar Persona

1. Localice la persona en el listado
2. Haga clic en el botón **Eliminar** (ícono de basura)
3. Confirme la eliminación
4. **Advertencia**: Esta acción no se puede deshacer

### Filtrar Personas

**Filtros disponibles:**
- **Puesto de Votación**: Seleccione uno o varios
- **Barrio**: Seleccione uno o varios
- **Número de Documento**: Escriba para buscar
- **Estado**: Seleccione estado de persona
- **Líder** (solo admin): Seleccione líder específico
- **Coordinador** (solo admin): Seleccione coordinador

**Cómo usar:**
1. Seleccione los filtros deseados
2. Los resultados se actualizan automáticamente
3. Puede combinar múltiples filtros
4. Use el botón **Limpiar** para resetear

### Buscar por Número de Documento

1. En el campo de búsqueda, escriba el número de documento
2. El sistema buscará coincidencias parciales
3. Los resultados se muestran en tiempo real

## Confirmación de Voto

### Confirmar Voto de una Persona

1. Localice la persona en el listado
2. Verifique que tenga todos los datos completos
3. Haga clic en **Confirmar Voto**
4. Se abrirá un diálogo para subir imagen
5. Haga clic en **Seleccionar Imagen**
6. Elija una imagen de su dispositivo:
   - Tamaño máximo: 5 MB
   - Formatos: JPG, PNG, GIF, WEBP
7. Haga clic en **Confirmar**
8. El sistema procesará y guardará la confirmación

**Importante:**
- La imagen es obligatoria
- Si la imagen es muy grande, comprímala antes
- El estado cambiará a COMPLETADO

### Ver Confirmación

1. En el listado, busque personas con estado COMPLETADO
2. Haga clic en **Ver Detalles**
3. Verá la imagen de confirmación
4. Verá fecha, hora y usuario que confirmó

### Reversar Confirmación

1. Localice la persona con confirmación
2. Haga clic en **Reversar Confirmación**
3. Confirme la acción
4. El estado volverá a CONFIRMADO
5. La confirmación quedará marcada como reversada

## Importación Masiva

### Descargar Plantilla

1. Vaya a la página de **Personas**
2. Haga clic en **Importar**
3. Haga clic en **Descargar Plantilla**
4. Se descargará un archivo Excel con los encabezados

### Preparar Datos

1. Abra la plantilla descargada
2. Complete las columnas con los datos:
   - Use el formato correcto para fechas (YYYY-MM-DD)
   - Complete campos obligatorios
   - Verifique que no haya duplicados
3. Guarde el archivo

### Importar Archivo

1. En la página de importación, haga clic en **Seleccionar Archivo**
2. Elija el archivo Excel completado
3. Haga clic en **Importar**
4. El sistema procesará el archivo
5. Verá un reporte con:
   - Total de registros
   - Registros exitosos
   - Registros fallidos (con detalles)

### Revisar Errores

1. En el reporte de importación, revise los errores
2. Cada error indica:
   - Número de fila
   - Campo con problema
   - Descripción del error
3. Corrija el archivo y vuelva a importar

## Dashboard y Estadísticas

### Ver Dashboard

1. Haga clic en **Dashboard** en el menú
2. Verá métricas principales:
   - Total de personas registradas
   - Personas confirmadas
   - Personas pendientes
   - Porcentajes de avance

### Gráficos (Solo Administradores)

Si tiene acceso a gráficos:
- **Gráfico por Líder**: Confirmados vs pendientes
- **Gráfico por Departamento**: Distribución geográfica
- **Gráfico por Municipio**: Detalle municipal

### Actualizar Datos

- Los datos se actualizan automáticamente
- Use el botón **Actualizar** si necesita refrescar

## Gestión de Usuarios

### Crear Líder (Admin/Coordinador)

1. Vaya a **Líderes** en el menú
2. Haga clic en **Nuevo Líder**
3. Complete el formulario:
   - Nombres y apellidos
   - Tipo y número de documento
   - Fecha de nacimiento
   - Teléfono
   - Coordinador (si es admin)
   - Candidato (opcional)
4. La contraseña será el número de documento
5. Haga clic en **Guardar**

### Crear Coordinador (Solo Admin)

1. Vaya a **Coordinadores** en el menú
2. Haga clic en **Nuevo Coordinador**
3. Complete el formulario similar a líder
4. Haga clic en **Guardar**

### Asignar Líderes a Coordinador

1. Vaya a **Coordinadores**
2. Haga clic en el coordinador
3. En la sección **Líderes**, haga clic en **Asignar Líderes**
4. Seleccione los líderes
5. Confirme

## Sistema de Filtros

### Crear Validador/Confirmador

1. Vaya a **Filtros** en el menú
2. Haga clic en **Nuevo Filtro**
3. Complete datos del usuario
4. Seleccione rol: **Validador** o **Confirmador**
5. Seleccione coordinador
6. **Asigne líderes** que el filtro podrá ver
7. Haga clic en **Guardar**

### Asignar Líderes a Filtro

1. Vaya a **Filtros**
2. Haga clic en el filtro
3. En **Líderes Asignados**, haga clic en **Asignar Líderes**
4. Seleccione los líderes
5. Confirme

### Validar Persona (Validador)

1. Inicie sesión como validador
2. Vaya a **Personas**
3. Verá solo personas de líderes asignados
4. Localice persona en estado DATOS_PENDIENTES o CON_NOVEDAD
5. Haga clic en **Verificar**
6. Confirme la acción
7. El estado cambiará a VERIFICADO

### Confirmar Estado (Confirmador)

1. Inicie sesión como confirmador
2. Vaya a **Personas**
3. Localice persona en estado VERIFICADO
4. Haga clic en **Confirmar Estado**
5. Confirme la acción
6. El estado cambiará a CONFIRMADO

## Novedades

### Crear Novedad

1. Localice la persona en el listado
2. Haga clic en **Crear Novedad**
3. Escriba la observación o descripción del problema
4. Haga clic en **Guardar**
5. La persona quedará en estado CON_NOVEDAD

### Ver Novedades

1. En el listado, busque personas con estado CON_NOVEDAD
2. Haga clic en **Ver Detalles**
3. Verá la novedad activa con:
   - Descripción
   - Fecha de creación
   - Usuario que creó

### Resolver Novedad (Coordinador/Admin)

1. Localice la persona con novedad
2. Haga clic en **Resolver Novedad**
3. La novedad se marcará como resuelta
4. La persona puede avanzar de estado

## Perfil de Usuario

### Ver Perfil

1. Haga clic en su **Avatar** (esquina superior derecha)
2. Seleccione **Perfil**
3. Verá toda su información personal

### Editar Perfil

1. En la página de Perfil, haga clic en **Editar**
2. Modifique los campos permitidos
3. Haga clic en **Guardar**

**Nota**: Algunos campos pueden ser administrados solo por admin

### Cambiar Contraseña

1. En Perfil, haga clic en **Cambiar Contraseña**
2. Ingrese contraseña actual
3. Ingrese nueva contraseña
4. Confirme nueva contraseña
5. Haga clic en **Guardar**

## Solución de Problemas

### No Puedo Iniciar Sesión

**Problema**: Credenciales incorrectas

**Solución:**
- Verifique que el email sea `{numero_documento}@sistema.local`
- Verifique que la contraseña sea su número de documento
- Contacte al administrador si persiste

### No Veo Personas

**Problema**: No aparecen personas en el listado

**Solución:**
- Verifique sus permisos según su rol
- Los líderes solo ven sus propias personas
- Use filtros para buscar específicamente
- Contacte al administrador si cree que hay un error

### Error al Subir Imagen

**Problema**: La imagen no se sube

**Solución:**
- Verifique que el tamaño sea menor a 5 MB
- Verifique que el formato sea JPG, PNG, GIF o WEBP
- Comprima la imagen si es necesario
- Intente con otra imagen

### Error al Importar Excel

**Problema**: La importación falla

**Solución:**
- Verifique el formato del archivo (debe ser .xlsx)
- Revise que los campos obligatorios estén completos
- Verifique el formato de fechas (YYYY-MM-DD)
- Revise el reporte de errores para detalles específicos
- Corrija los errores y vuelva a importar

### No Puedo Avanzar Estado

**Problema**: No puedo cambiar el estado de una persona

**Solución:**
- Verifique que no haya novedad activa (debe resolverse primero)
- Verifique sus permisos según su rol
- Verifique que la persona esté en el estado correcto para avanzar
- Contacte al coordinador o administrador

### No Aparecen Líderes para Asignar

**Problema**: No veo líderes al crear filtro

**Solución:**
- Verifique que haya líderes creados
- Verifique que los líderes pertenezcan al coordinador correcto
- Contacte al administrador

### La Página Carga Lento

**Problema**: El sistema es lento

**Solución:**
- Verifique su conexión a internet
- Use filtros para reducir la cantidad de datos
- Cierre otras pestañas del navegador
- Contacte al administrador si persiste

### No Puedo Eliminar Persona

**Problema**: El botón eliminar no funciona

**Solución:**
- Verifique sus permisos
- Algunas personas pueden tener restricciones
- Contacte al administrador

## Consejos y Mejores Prácticas

### Organización

- Use filtros para organizar la información
- Mantenga los datos actualizados
- Resuelva novedades rápidamente

### Importación

- Revise la plantilla antes de completar
- Valide los datos antes de importar
- Importe en lotes si tiene muchos registros

### Confirmaciones

- Comprima imágenes grandes antes de subir
- Use imágenes claras y legibles
- Verifique la información antes de confirmar

### Seguridad

- Cambie su contraseña después del primer acceso
- No comparta sus credenciales
- Cierre sesión cuando termine

---

**Versión del Manual**: 1.0  
**Fecha de Actualización**: Enero 2026
