# Sistema de Gestión de Votantes

Sistema web para la gestión de votantes electorales desarrollado con Next.js, Prisma, Auth.js y Cloudflare R2.

## 📚 Documentación

La documentación completa del sistema está organizada en la carpeta [`docs/`](./docs/):

- **[Documentación Principal](./docs/README.md)**: Índice general de toda la documentación
- **[Documentación para Cliente](./docs/cliente/README.md)**: Manuales y guías para usuarios finales
- **[Documentación Técnica](./docs/tecnica/README.md)**: Guías para desarrolladores y administradores

### Inicio Rápido

- **Nuevos usuarios**: Empiece con la [Guía de Inicio Rápido](./docs/cliente/guia-inicio-rapido.md)
- **Desarrolladores**: Revise la [Guía de Instalación](./docs/tecnica/instalacion.md)

## Características

- **Autenticación y Roles**: Sistema de autenticación con 6 roles (Admin, Coordinador, Líder, Validador, Confirmador, Consultor)
- **CRUD de Personas**: Gestión completa de votantes con validaciones y estados
- **Confirmación de Voto**: Sistema de confirmación con subida de imágenes
- **Importación Masiva**: Importación de datos desde archivos Excel
- **Filtros y Búsqueda**: Sistema avanzado de filtros por puesto, mesa, documento, líder y coordinador
- **Dashboard**: Resumen con métricas y conteos con gráficos avanzados
- **Gestión de Usuarios**: CRUD completo de líderes, coordinadores, validadores y confirmadores
- **Sistema de Filtros**: Asignación granular de líderes a validadores/confirmadores
- **Sistema de Novedades**: Gestión de observaciones y problemas

## Requisitos Previos

- Node.js 18+ y pnpm
- PostgreSQL (Railway, Supabase, o local)
- Cloudflare R2 o servicio S3-compatible para almacenamiento

## Instalación Rápida

Para una guía completa de instalación, consulte la [Guía de Instalación](./docs/tecnica/instalacion.md).

### Pasos Básicos

1. **Configurar variables de entorno**: Crear `.env.local` con las credenciales necesarias
2. **Instalar dependencias**: `pnpm install`
3. **Configurar base de datos**: Ejecutar migraciones de Prisma
4. **Configurar almacenamiento**: Configurar Cloudflare R2 o S3
5. **Ejecutar**: `pnpm dev`

Ver la [documentación técnica completa](./docs/tecnica/instalacion.md) para detalles.

## Estructura del Proyecto

Para información detallada sobre la arquitectura, consulte la [Documentación de Arquitectura](./docs/tecnica/arquitectura.md).

```
pp-gestion/
├── app/                    # Rutas y páginas de Next.js
│   ├── api/               # API routes
│   ├── auth/              # Páginas de autenticación
│   ├── dashboard/          # Dashboard principal
│   ├── personas/           # Gestión de personas
│   ├── lideres/            # Gestión de líderes
│   ├── coordinadores/      # Gestión de coordinadores
│   ├── candidatos/         # Gestión de candidatos
│   ├── filtros/            # Gestión de filtros
│   └── perfil/             # Perfil de usuario
├── components/             # Componentes React
│   ├── ui/                # Componentes de shadcn/ui
│   └── layout/            # Componentes de layout
├── features/               # Features organizados por módulo
│   ├── auth/
│   ├── personas/
│   ├── candidatos/
│   ├── dashboard/
│   ├── filtros/
│   ├── lideres/
│   ├── coordinadores/
│   └── novedades/
├── lib/                    # Utilidades y helpers
│   ├── auth/              # Helpers de autenticación
│   ├── db/                # Cliente Prisma
│   ├── storage/           # Cliente de almacenamiento
│   └── types/             # Tipos TypeScript
├── prisma/                 # Schema y migraciones
└── public/                 # Archivos estáticos
```

## Roles y Permisos

El sistema cuenta con 6 roles diferentes. Para información detallada, consulte la [Documentación de Funcionalidades](./docs/cliente/funcionalidades.md#sistema-de-roles-y-permisos).

### Administrador (Admin)
- Acceso completo a todos los datos
- Puede gestionar todos los usuarios (CRUD)
- Ve todas las personas sin filtros
- Acceso a gráficos y estadísticas avanzadas

### Coordinador
- Gestiona líderes asignados
- Ve personas de sus líderes
- Puede crear validadores/confirmadores
- Asigna líderes a filtros

### Líder
- Solo ve y gestiona sus propias personas registradas
- Puede confirmar votos de sus personas
- Puede editar su propio perfil

### Validador
- Solo ve personas de líderes asignados
- Puede validar personas (cambiar a VERIFICADO)
- Puede crear novedades

### Confirmador
- Solo ve personas de líderes asignados
- Puede confirmar estados (cambiar a CONFIRMADO)
- Puede crear novedades

### Consultor
- Solo lectura de información
- No puede modificar datos

## Funcionalidades Principales

Para un catálogo completo de funcionalidades, consulte la [Documentación de Funcionalidades](./docs/cliente/funcionalidades.md).

### Gestión de Personas
- CRUD completo de personas
- Sistema de estados (DATOS_PENDIENTES, CON_NOVEDAD, VERIFICADO, CONFIRMADO, COMPLETADO)
- Validación de duplicados
- Campos obligatorios y opcionales
- Cálculo automático de edad

### Confirmación de Voto
- Subir imagen como evidencia (máx. 5MB, solo imágenes)
- Reversar confirmación en caso de error
- Historial de confirmaciones
- Visualización de imágenes

### Importación Masiva
- Descargar plantilla Excel
- Importar archivos Excel con validaciones
- Reporte detallado de éxitos y errores
- Validación de duplicados (local y opcionalmente PocketBase)

### Dashboard y Estadísticas
- Métricas por rol
- Conteos en tiempo real
- Gráficos avanzados (solo admin, opcional)
- Filtrado automático según permisos

### Gestión de Usuarios
- CRUD de líderes, coordinadores, validadores y confirmadores
- Sistema de filtros (asignación de líderes)
- Relaciones coordinador-líder
- Gestión de candidatos

### Sistema de Novedades
- Crear y resolver novedades
- Bloqueo de estados hasta resolución
- Trazabilidad completa

## Tecnologías Utilizadas

Para información detallada sobre el stack tecnológico, consulte la [Documentación de Arquitectura](./docs/tecnica/arquitectura.md).

- **Next.js 16**: Framework React con App Router
- **PostgreSQL**: Base de datos relacional
- **Prisma**: ORM para acceso a datos
- **Auth.js**: Autenticación y autorización
- **Cloudflare R2**: Almacenamiento de objetos (S3-compatible)
- **shadcn/ui**: Componentes UI
- **TypeScript**: Tipado estático
- **Zod**: Validación de esquemas
- **React Hook Form**: Manejo de formularios
- **ExcelJS**: Procesamiento de archivos Excel
- **Tailwind CSS**: Estilos

## Documentación Adicional

- **[Manual de Usuario](./docs/cliente/manual-usuario.md)**: Guía completa paso a paso
- **[Limitaciones](./docs/cliente/limitaciones.md)**: Restricciones y consideraciones
- **[Guía de Migración](./docs/tecnica/migracion.md)**: Migración de Supabase a Railway
- **[Scripts](./docs/tecnica/scripts.md)**: Scripts de utilidad disponibles

## Desarrollo

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature
3. Realiza tus cambios
4. Envía un pull request

## Licencia

Este proyecto es privado y de uso interno.
