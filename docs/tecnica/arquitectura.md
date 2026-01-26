# Arquitectura del Sistema

Documentación sobre la arquitectura y stack tecnológico del Sistema de Gestión de Personas.

## Stack Tecnológico

### Frontend

- **Next.js 16**: Framework React con App Router
- **React 19**: Biblioteca de UI
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Framework de estilos
- **shadcn/ui**: Componentes UI reutilizables
- **Framer Motion**: Animaciones
- **Recharts**: Gráficos y visualizaciones

### Backend

- **Next.js API Routes**: Endpoints del servidor
- **Prisma**: ORM para PostgreSQL
- **Auth.js (NextAuth)**: Autenticación y autorización
- **Zod**: Validación de esquemas
- **bcryptjs**: Hashing de contraseñas

### Base de Datos

- **PostgreSQL**: Base de datos relacional
- **Prisma ORM**: Acceso a datos y migraciones

### Almacenamiento

- **Cloudflare R2**: Almacenamiento de objetos (S3-compatible)
- **AWS SDK S3**: Cliente para interactuar con R2/S3

### Integraciones Opcionales

- **PocketBase**: Validación de documentos duplicados (opcional)

## Arquitectura de la Aplicación

### Patrón de Arquitectura

El sistema sigue una **arquitectura modular basada en features**, donde cada módulo funcional está organizado de manera independiente.

### Estructura por Features

```
features/
├── auth/              # Autenticación
│   ├── components/   # Componentes de UI
│   ├── contexts/     # Contextos React
│   ├── hooks/        # Custom hooks
│   └── validations/  # Esquemas Zod
├── personas/         # Gestión de personas
├── candidatos/       # Gestión de candidatos
├── dashboard/        # Dashboard y estadísticas
├── filtros/          # Sistema de filtros
├── lideres/          # Gestión de líderes
├── coordinadores/    # Gestión de coordinadores
└── novedades/        # Sistema de novedades
```

Cada feature contiene:
- **components/**: Componentes React específicos del feature
- **validations/**: Esquemas de validación Zod
- **utils/**: Utilidades específicas del feature

### Capas de la Aplicación

#### 1. Capa de Presentación (UI)

- **Páginas**: `app/*/page.tsx`
- **Componentes**: `components/` y `features/*/components/`
- **Layouts**: `components/layout/`

#### 2. Capa de API

- **Rutas API**: `app/api/*/route.ts`
- **Validación**: Esquemas Zod
- **Autorización**: Helpers en `lib/auth/helpers.ts`

#### 3. Capa de Negocio

- **Lógica de negocio**: En rutas API y helpers
- **Validaciones**: Esquemas Zod
- **Reglas de negocio**: Implementadas en servicios

#### 4. Capa de Datos

- **ORM**: Prisma
- **Modelos**: Definidos en `prisma/schema.prisma`
- **Migraciones**: `prisma/migrations/`

## Flujo de Datos

### Autenticación

```
Usuario → Login → Auth.js → Verificación → Session → Profile
```

1. Usuario ingresa credenciales
2. Auth.js valida contra base de datos
3. Se crea sesión
4. Se obtiene perfil del usuario
5. Se establece contexto de autenticación

### Autorización

```
Request → Middleware → Verificar Rol → Permitir/Denegar
```

- Middleware verifica autenticación
- Helpers verifican roles y permisos
- Cada ruta API valida permisos específicos

### Gestión de Personas

```
UI → API Route → Validación Zod → Prisma → PostgreSQL → Response
```

1. Usuario completa formulario
2. Se valida con Zod
3. Se verifica permisos
4. Se ejecuta operación en base de datos
5. Se retorna respuesta

### Confirmación de Voto

```
UI → Seleccionar Imagen → Upload a R2 → Guardar URL → Crear Confirmación → Actualizar Estado
```

1. Usuario selecciona imagen
2. Se sube a Cloudflare R2
3. Se obtiene URL pública
4. Se crea registro de confirmación
5. Se actualiza estado de persona

## Modelo de Datos

### Entidades Principales

#### Profile (Usuarios)
- Representa todos los usuarios del sistema
- Roles: admin, coordinador, lider, validador, confirmador, consultor
- Relaciones con candidatos, coordinadores, barrios, puestos

#### Persona
- Información de personas registradas
- Estados: DATOS_PENDIENTES, CON_NOVEDAD, VERIFICADO, CONFIRMADO, COMPLETADO
- Relaciones con registradoPor, validadoPor, confirmadoEstadoPor

#### VotoConfirmacion
- Confirmaciones de voto con imágenes
- Relación con persona y usuario que confirmó
- Soporte para reversión

#### Candidato
- Información de candidatos
- Relación con profiles (líderes/coordinadores)

#### FiltroLider
- Asignación de líderes a validadores/confirmadores
- Control de acceso granular

#### Novedad
- Observaciones o problemas en personas
- Estados: activa/resuelta

### Relaciones Clave

```
Coordinador
  ├── Líderes (1:N)
  │     └── Personas (1:N)
  └── Filtros (Validadores/Confirmadores) (1:N)
        └── Líderes Asignados (N:M via FiltroLider)

Persona
  ├── RegistradoPor (Líder)
  ├── ValidadoPor (Validador)
  ├── ConfirmadoEstadoPor (Confirmador)
  ├── Confirmaciones (1:N)
  └── Novedades (1:N)
```

## Seguridad

### Autenticación

- **Auth.js**: Manejo de sesiones
- **bcryptjs**: Hashing de contraseñas (12 rounds)
- **JWT**: Tokens de sesión

### Autorización

- **Verificación por rol**: Helpers en `lib/auth/helpers.ts`
- **Control de acceso**: En cada ruta API
- **Separación de datos**: Por rol y asignaciones

### Validación

- **Zod**: Validación de esquemas en cliente y servidor
- **Prisma**: Validación a nivel de base de datos
- **Sanitización**: En inputs de usuario

## Almacenamiento

### Base de Datos

- **PostgreSQL**: Base de datos relacional
- **Prisma**: ORM y migraciones
- **Índices**: Optimización de consultas

### Archivos

- **Cloudflare R2**: Almacenamiento de imágenes
- **Estructura**: `confirmaciones/{personaId}/{timestamp}.{ext}`
- **Acceso**: URLs públicas o privadas según configuración

## Rendimiento

### Optimizaciones

- **Paginación**: En listados grandes
- **Índices**: En campos de búsqueda frecuente
- **Caching**: En sesiones y datos estáticos
- **Lazy Loading**: Componentes y rutas

### Escalabilidad

- **Stateless**: API sin estado
- **Horizontal**: Escalable horizontalmente
- **Base de datos**: Escalable según proveedor

## Despliegue

### Entornos

- **Desarrollo**: `pnpm dev` (localhost:3000)
- **Producción**: Build estático y servidor Node.js

### Servicios Externos

- **Base de datos**: Railway, Supabase, o similar
- **Almacenamiento**: Cloudflare R2 o S3
- **Hosting**: Vercel, Railway, o similar

## Tecnologías por Categoría

### UI/UX
- Next.js 16 (App Router)
- React 19
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Lucide Icons

### Backend
- Next.js API Routes
- Prisma ORM
- Auth.js
- Zod

### Base de Datos
- PostgreSQL
- Prisma Client

### Almacenamiento
- Cloudflare R2
- AWS SDK S3

### Utilidades
- TypeScript
- ExcelJS (importación)
- date-fns (fechas)
- bcryptjs (contraseñas)

## Convenciones

### Nombres de Archivos

- **Componentes**: PascalCase (`PersonaForm.tsx`)
- **Utilidades**: camelCase (`persona-estado.ts`)
- **Rutas API**: kebab-case (`confirmar-estado/route.ts`)

### Estructura de Código

- **Imports**: Absolutos usando alias `@/`
- **Validaciones**: Esquemas Zod en `validations/`
- **Tipos**: Definidos en `lib/types/`
- **Helpers**: En `lib/` organizados por dominio

## Extensibilidad

### Agregar Nuevo Feature

1. Crear carpeta en `features/`
2. Agregar componentes en `components/`
3. Crear validaciones en `validations/`
4. Agregar rutas API en `app/api/`
5. Actualizar schema de Prisma si es necesario

### Agregar Nuevo Rol

1. Actualizar enum `UserRole` en schema
2. Agregar helpers de autorización
3. Actualizar middleware si es necesario
4. Actualizar UI según permisos

---

**Versión del Documento**: 1.0  
**Fecha de Actualización**: Enero 2026
