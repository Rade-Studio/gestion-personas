# Documentación Técnica

Esta sección contiene documentación técnica para desarrolladores y administradores del sistema.

## Documentos Disponibles

### 🏗️ [Arquitectura](./arquitectura.md)
Información sobre el stack tecnológico y arquitectura del sistema.
- Stack tecnológico
- Arquitectura de la aplicación
- Estructura del proyecto
- Tecnologías utilizadas

### 🔧 [Instalación](./instalacion.md)
Guía completa de instalación y configuración del sistema.
- Requisitos previos
- Variables de entorno
- Configuración de base de datos
- Configuración de almacenamiento
- Instalación de dependencias
- Ejecución en desarrollo

### 🔄 [Migración](./migracion.md)
Guía de migración de Supabase a Railway + Prisma + Auth.js + Cloudflare R2.
- Resumen de cambios
- Pasos de migración
- Configuración de servicios
- Migración de datos
- Verificación

### 📜 [Scripts](./scripts.md)
Documentación de scripts de utilidad disponibles.
- Script de reset de base de datos
- Uso y configuración
- Advertencias y consideraciones

### 📋 [Especificaciones Funcionales](./especificaciones-funcionales.md)
Especificaciones técnicas originales del sistema.
- Información general
- Gestión de personas
- Importación y exportación
- Filtros y búsqueda
- Gestión de usuarios
- Casos de uso
- Requerimientos no funcionales

## Estructura de Documentación

```
tecnica/
├── README.md                        ← Este archivo
├── arquitectura.md                  ← Stack y arquitectura
├── instalacion.md                   ← Guía de instalación
├── migracion.md                     ← Guía de migración
├── scripts.md                       ← Scripts de utilidad
└── especificaciones-funcionales.md  ← Especificaciones originales
```

## Información del Sistema

### Stack Tecnológico Actual

- **Frontend**: Next.js 16 (React)
- **Backend**: Next.js API Routes
- **Base de Datos**: PostgreSQL (Railway)
- **ORM**: Prisma
- **Autenticación**: Auth.js (NextAuth)
- **Almacenamiento**: Cloudflare R2 (S3-compatible)
- **UI**: shadcn/ui + Tailwind CSS
- **Validación**: Zod
- **Formularios**: React Hook Form

### Estructura del Proyecto

```
pp-gestion/
├── app/                    # Rutas y páginas Next.js
├── components/            # Componentes React
├── features/              # Features organizados por módulo
├── lib/                   # Utilidades y helpers
├── prisma/                # Schema y migraciones
└── public/                # Archivos estáticos
```

## Guías Rápidas

### Instalación Rápida

1. Revise [Instalación](./instalacion.md) para requisitos
2. Configure variables de entorno
3. Ejecute migraciones de Prisma
4. Instale dependencias con `pnpm install`
5. Ejecute con `pnpm dev`

### Migración Rápida

1. Revise [Migración](./migracion.md) para entender cambios
2. Configure nuevos servicios (Railway, Cloudflare R2)
3. Actualice variables de entorno
4. Ejecute migraciones de Prisma
5. Migre datos existentes

## Desarrollo

### Comandos Útiles

```bash
# Desarrollo
pnpm dev

# Build
pnpm build

# Base de datos
pnpm db:generate    # Generar cliente Prisma
pnpm db:push       # Aplicar cambios al schema
pnpm db:migrate    # Ejecutar migraciones
pnpm db:seed       # Cargar datos iniciales

# Reset de base de datos
pnpm reset-db
```

### Estructura de Features

El proyecto está organizado por features:

```
features/
├── auth/           # Autenticación
├── personas/       # Gestión de personas
├── candidatos/     # Gestión de candidatos
├── dashboard/      # Dashboard y estadísticas
├── filtros/        # Sistema de filtros
├── lideres/        # Gestión de líderes
├── coordinadores/  # Gestión de coordinadores
└── novedades/      # Sistema de novedades
```

Cada feature contiene:
- `components/`: Componentes React
- `validations/`: Esquemas Zod
- `utils/`: Utilidades específicas

## Referencias

### Documentación Externa

- [Next.js](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs)
- [Auth.js](https://authjs.dev)
- [shadcn/ui](https://ui.shadcn.com)
- [Zod](https://zod.dev)

### Documentación del Proyecto

- [Documentación Principal](../README.md)
- [Documentación para Cliente](../cliente/README.md)

## Contribución

Para contribuir al proyecto:

1. Revise la [Arquitectura](./arquitectura.md)
2. Siga la estructura de features
3. Use TypeScript y Zod para validaciones
4. Siga las convenciones del proyecto
5. Documente cambios importantes

---

**Última actualización**: Enero 2026
