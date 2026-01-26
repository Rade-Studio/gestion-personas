# Documentación del Sistema de Gestión de Personas

Bienvenido a la documentación completa del Sistema de Gestión de Personas. Esta documentación está organizada en diferentes secciones según el tipo de información que necesites.

## Estructura de la Documentación

### 📋 [Documentación para Cliente](./cliente/)
Documentación orientada a usuarios finales y clientes del sistema:
- **Funcionalidades**: Catálogo completo de todas las funcionalidades del sistema
- **Limitaciones**: Restricciones y limitaciones del sistema
- **Manual de Usuario**: Guía completa paso a paso para usar el sistema
- **Guía de Inicio Rápido**: Guía rápida para empezar a usar el sistema

### 🔧 [Documentación Técnica](./tecnica/)
Documentación para desarrolladores y administradores técnicos:
- **Arquitectura**: Stack tecnológico y arquitectura del sistema
- **Instalación**: Guía de instalación y configuración
- **Migración**: Guía de migración de Supabase a Railway + Prisma
- **Scripts**: Documentación de scripts de utilidad
- **Especificaciones Funcionales**: Especificaciones técnicas originales

### 📚 [Documentación Histórica](./historico/)
Versiones anteriores de documentación:
- **Informe Cliente v1**: Versión anterior del informe para cliente

## Acceso Rápido

### Para Usuarios Finales
1. Empieza con la [Guía de Inicio Rápido](./cliente/guia-inicio-rapido.md)
2. Consulta el [Manual de Usuario](./cliente/manual-usuario.md) para guías detalladas
3. Revisa las [Funcionalidades](./cliente/funcionalidades.md) disponibles
4. Conoce las [Limitaciones](./cliente/limitaciones.md) del sistema

### Para Desarrolladores
1. Revisa la [Arquitectura](./tecnica/arquitectura.md) del sistema
2. Sigue la guía de [Instalación](./tecnica/instalacion.md)
3. Consulta las [Especificaciones Funcionales](./tecnica/especificaciones-funcionales.md)
4. Revisa la guía de [Migración](./tecnica/migracion.md) si es necesario

## Información General del Sistema

El Sistema de Gestión de Personas es una aplicación web desarrollada con Next.js que permite:

- **Registro y gestión** de personas con información completa
- **Confirmación de actividades** con evidencia fotográfica
- **Importación masiva** desde archivos Excel
- **Dashboard y estadísticas** en tiempo real
- **Gestión de usuarios** con diferentes roles y permisos
- **Sistema de filtros** para validadores y confirmadores
- **Gestión de novedades** y seguimiento de estados

## Roles del Sistema

El sistema cuenta con 6 roles diferentes:

1. **Admin**: Acceso completo a todas las funcionalidades
2. **Coordinador**: Gestiona líderes y sus personas
3. **Líder**: Registra y gestiona sus propias personas
4. **Validador**: Valida personas de líderes asignados
5. **Confirmador**: Confirma estados de personas de líderes asignados
6. **Consultor**: Solo lectura de información

## Estados de las Personas

Las personas pueden tener los siguientes estados:

- **DATOS_PENDIENTES**: Faltan datos obligatorios
- **CON_NOVEDAD**: Tiene una novedad activa
- **VERIFICADO**: Ha sido validado por un validador
- **CONFIRMADO**: Estado confirmado por un confirmador
- **COMPLETADO**: Confirmación de voto completada con imagen

## Soporte

Para consultas o problemas:
- Revisa la documentación correspondiente
- Consulta la sección de solución de problemas en el manual de usuario
- Contacta al equipo técnico para soporte avanzado

---

**Última actualización**: Enero 2026
