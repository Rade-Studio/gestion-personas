# Guía de Migración: Supabase a Railway + Prisma + Auth.js + Cloudflare R2

## Resumen de cambios

Esta migración reemplaza:
- **Supabase Auth** → **Auth.js** (con provider Credentials)
- **Supabase Database** → **PostgreSQL directo** (via Prisma ORM)
- **Supabase Storage** → **Cloudflare R2** (S3-compatible)

## Pasos de migración

### 1. Configurar Railway

1. Crear proyecto en Railway
2. Agregar servicio PostgreSQL
3. Obtener la `DATABASE_URL`

### 2. Configurar Cloudflare R2

1. Crear bucket en Cloudflare R2
2. Configurar acceso público o privado
3. Obtener credenciales S3-compatible:
   - `S3_ENDPOINT`
   - `S3_ACCESS_KEY_ID`
   - `S3_SECRET_ACCESS_KEY`
   - `S3_BUCKET_NAME`
   - `S3_PUBLIC_URL`

### 3. Configurar variables de entorno

Copiar `.env.example` a `.env.local` y configurar:

```bash
cp .env.example .env.local
```

Generar `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 4. Ejecutar migraciones de Prisma

```bash
# Generar cliente Prisma
pnpm db:generate

# Crear tablas en la base de datos
pnpm db:push

# O usar migraciones (recomendado para producción)
pnpm db:migrate
```

### 5. Cargar datos iniciales

```bash
pnpm db:seed
```

### 6. Migrar datos existentes de Supabase

#### 6.1 Exportar datos de Supabase

1. Ir al dashboard de Supabase
2. Exportar tablas como CSV o SQL:
   - `profiles`
   - `personas`
   - `candidatos`
   - `voto_confirmaciones`
   - `importaciones`

#### 6.2 Migrar usuarios (passwords)

**IMPORTANTE**: Las contraseñas de Supabase Auth NO son compatibles directamente. Opciones:

**Opción A: Reset de contraseñas (Recomendado)**
- Los usuarios deberán restablecer su contraseña al iniciar sesión por primera vez

**Opción B: Migración con contraseña temporal**
- Crear usuarios con la contraseña = número de documento (como al crear nuevos)
- Notificar a usuarios que su contraseña es su número de documento

#### 6.3 Script de migración de perfiles

```typescript
// scripts/migrate-users.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'

const prisma = new PrismaClient()

async function migrateUsers() {
  // Leer CSV exportado de Supabase
  const data = JSON.parse(fs.readFileSync('exported-profiles.json', 'utf-8'))
  
  for (const profile of data) {
    // Usar numero_documento como contraseña temporal
    const passwordHash = await bcrypt.hash(profile.numero_documento, 12)
    
    await prisma.profile.create({
      data: {
        id: profile.id, // Mantener IDs si es posible
        email: profile.email || `${profile.numero_documento}@sistema.local`,
        passwordHash,
        nombres: profile.nombres,
        apellidos: profile.apellidos,
        tipoDocumento: profile.tipo_documento,
        numeroDocumento: profile.numero_documento,
        // ... mapear otros campos
        role: profile.role,
      }
    })
  }
}

migrateUsers()
```

#### 6.4 Migrar archivos de Storage

```bash
# Descargar archivos de Supabase Storage
# (usar supabase CLI o dashboard)

# Subir a Cloudflare R2 manteniendo la estructura de carpetas
# candidatos/
# confirmaciones/
```

### 7. Verificar migración

1. Verificar login con credenciales migradas
2. Verificar que las imágenes se cargan correctamente
3. Probar CRUD de todas las entidades

## Notas importantes

### Diferencias de Auth

- **Supabase**: El usuario se crea en `auth.users` y el perfil en `profiles` con FK al user
- **Auth.js**: El usuario y perfil están combinados en la tabla `profiles` con `passwordHash`

### RLS eliminado

Prisma no soporta RLS de PostgreSQL. La autorización se maneja en:
- `lib/auth/helpers.ts` - Funciones de verificación de roles
- Cada ruta API verifica permisos manualmente

### Rutas API sin cambios

Las rutas de importaciones (`/api/importaciones/*`) necesitan migración manual adicional debido a su complejidad. El patrón de migración es el mismo:
- Reemplazar `await createClient()` por `prisma`
- Cambiar queries de Supabase a Prisma
- Mantener la misma lógica de negocio

## Rollback

Si necesitas revertir:
1. Reactivar variables de entorno de Supabase
2. Restaurar archivos `lib/supabase/*` desde git
3. Revertir cambios en rutas API

## Soporte

Para problemas de migración, revisar:
- Documentación de Prisma: https://www.prisma.io/docs
- Documentación de Auth.js: https://authjs.dev
- Documentación de AWS SDK S3: https://docs.aws.amazon.com/sdk-for-javascript/
