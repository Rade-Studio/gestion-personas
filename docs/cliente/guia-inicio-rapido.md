# Guía de Inicio Rápido

Bienvenido al Sistema de Gestión de Personas. Esta guía le ayudará a empezar rápidamente.

## Primeros Pasos

### 1. Acceder al Sistema

1. Abra su navegador web (Chrome, Firefox, Edge, etc.)
2. Ingrese la URL proporcionada por su administrador
3. Será redirigido a la página de login

### 2. Iniciar Sesión

**Primera vez:**
- **Email**: `{su_numero_documento}@sistema.local`
  - Ejemplo: Si su documento es `1234567890`, su email es `1234567890@sistema.local`
- **Contraseña**: Su número de documento
  - Ejemplo: `1234567890`

**Ejemplo práctico:**
```
Documento: 1234567890
Email: 1234567890@sistema.local
Contraseña: 1234567890
```

### 3. Cambiar Contraseña (Recomendado)

1. Después de iniciar sesión, haga clic en su **Avatar** (esquina superior derecha)
2. Seleccione **Perfil**
3. Haga clic en **Cambiar Contraseña**
4. Ingrese su contraseña actual (su número de documento)
5. Ingrese una nueva contraseña segura
6. Confirme y guarde

## Tareas Más Comunes

### Para Líderes

#### Registrar una Persona

1. Haga clic en **Personas** en el menú lateral
2. Haga clic en el botón **Nueva Persona**
3. Complete los campos obligatorios:
   - Nombres y apellidos
   - Tipo y número de documento
   - Puesto y mesa de votación
4. Complete campos opcionales si tiene la información
5. Haga clic en **Guardar**

#### Confirmar Voto

1. En el listado de Personas, localice la persona
2. Haga clic en **Confirmar Voto**
3. Seleccione una imagen (máx. 5 MB)
4. Haga clic en **Confirmar**

#### Importar Personas desde Excel

1. Haga clic en **Importar** en la página de Personas
2. Descargue la plantilla Excel
3. Complete la plantilla con los datos
4. Suba el archivo completado
5. Revise el reporte de importación

### Para Coordinadores

#### Ver Estadísticas

1. Haga clic en **Dashboard**
2. Vea el resumen de su coordinación:
   - Total de personas
   - Confirmadas
   - Pendientes

#### Crear un Líder

1. Haga clic en **Líderes**
2. Haga clic en **Nuevo Líder**
3. Complete el formulario
4. La contraseña será el número de documento del líder

#### Asignar Líderes a Filtro

1. Haga clic en **Filtros**
2. Seleccione o cree un validador/confirmador
3. Haga clic en **Asignar Líderes**
4. Seleccione los líderes que el filtro podrá ver

### Para Validadores/Confirmadores

#### Ver Personas Asignadas

1. Inicie sesión
2. Haga clic en **Personas**
3. Verá solo personas de líderes asignados por su coordinador

#### Validar Persona (Validador)

1. Localice persona en estado DATOS_PENDIENTES
2. Haga clic en **Verificar**
3. Confirme la acción

#### Confirmar Estado (Confirmador)

1. Localice persona en estado VERIFICADO
2. Haga clic en **Confirmar Estado**
3. Confirme la acción

### Para Administradores

#### Ver Todo el Sistema

1. Haga clic en **Dashboard**
2. Vea estadísticas completas del sistema
3. Acceda a gráficos avanzados (si están habilitados)

#### Crear Usuario

1. Vaya a la sección correspondiente:
   - **Líderes** para crear líder
   - **Coordinadores** para crear coordinador
   - **Filtros** para crear validador/confirmador
2. Complete el formulario
3. Asigne relaciones (coordinador, líderes, etc.)

## Navegación Rápida

### Menú Principal

```
Dashboard        → Resumen y estadísticas
Personas         → Gestión de personas
Líderes          → Gestión de líderes (admin/coordinador)
Coordinadores    → Gestión de coordinadores (admin)
Candidatos       → Gestión de candidatos (admin)
Filtros          → Gestión de validadores/confirmadores
Perfil           → Información personal
```

### Atajos Visuales

- **Botón "+" o "Nuevo"**: Crear nuevo registro
- **Ícono de lápiz**: Editar
- **Ícono de basura**: Eliminar
- **Ícono de ojo**: Ver detalles
- **Filtros**: En la parte superior de las tablas

## Estados de las Personas

Entienda el flujo de estados:

```
DATOS_PENDIENTES
    ↓ (Validar)
VERIFICADO
    ↓ (Confirmar Estado)
CONFIRMADO
    ↓ (Confirmar Voto con imagen)
COMPLETADO
```

**Con novedad:**
```
Cualquier estado → CON_NOVEDAD → (Resolver) → Estado anterior
```

## Consejos Rápidos

### Búsqueda Eficiente

- Use el campo de búsqueda por número de documento
- Combine filtros para resultados específicos
- Use paginación para navegar grandes listados

### Importación Exitosa

1. Descargue siempre la plantilla actualizada
2. Complete campos obligatorios
3. Use formato correcto para fechas (YYYY-MM-DD)
4. Revise el reporte de errores después de importar

### Confirmaciones

- Comprima imágenes grandes antes de subir
- Use imágenes claras y legibles
- Verifique la información antes de confirmar

### Resolución de Problemas

- **No puedo iniciar sesión**: Verifique credenciales
- **No veo personas**: Verifique sus permisos y filtros
- **Error al subir imagen**: Verifique tamaño (máx. 5 MB) y formato
- **No puedo avanzar estado**: Verifique que no haya novedad activa

## Próximos Pasos

1. **Explore el Dashboard**: Familiarícese con las estadísticas
2. **Revise sus Permisos**: Entienda qué puede hacer según su rol
3. **Consulte el Manual**: Lea el [Manual de Usuario](./manual-usuario.md) para guías detalladas
4. **Conozca las Funcionalidades**: Revise el [Catálogo de Funcionalidades](./funcionalidades.md)
5. **Entienda las Limitaciones**: Lea las [Limitaciones del Sistema](./limitaciones.md)

## Obtener Ayuda

### Documentación

- **Manual Completo**: [manual-usuario.md](./manual-usuario.md)
- **Funcionalidades**: [funcionalidades.md](./funcionalidades.md)
- **Limitaciones**: [limitaciones.md](./limitaciones.md)

### Soporte

- Contacte a su coordinador para problemas de acceso
- Contacte al administrador para problemas técnicos
- Revise la sección de solución de problemas en el manual

## Checklist de Inicio

- [ ] Accedí al sistema con mis credenciales
- [ ] Cambié mi contraseña
- [ ] Revisé mi perfil
- [ ] Exploré el Dashboard
- [ ] Entendí mi rol y permisos
- [ ] Revisé el listado de Personas
- [ ] Leí la documentación relevante

---

**¡Listo para empezar!** Si tiene dudas, consulte el [Manual de Usuario](./manual-usuario.md) o contacte a su administrador.

**Versión de la Guía**: 1.0  
**Fecha de Actualización**: Enero 2026
