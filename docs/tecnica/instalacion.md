# Guía de Instalación

Guía completa para instalar y configurar el Sistema de Gestión de Personas.

## Requisitos Previos

- **Node.js**: Versión 18 o superior
- **pnpm**: Gestor de paquetes (instalar con `npm install -g pnpm`)
- **PostgreSQL**: Base de datos (puede ser Railway, Supabase, o local)
- **Cloudflare R2**: Para almacenamiento de imágenes (o compatible S3)
- **Cuenta de Railway** (o similar) para base de datos PostgreSQL

## Configuración

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto `pp-gestion/`:

```env
# Base de Datos
DATABASE_URL=postgresql://usuario:password@host:puerto/database

# Autenticación
AUTH_SECRET=tu_secret_generado
AUTH_URL=http://localhost:3000

# Almacenamiento (Cloudflare R2 o S3-compatible)
S3_ENDPOINT=https://tu_endpoint.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=tu_access_key
S3_SECRET_ACCESS_KEY=tu_secret_key
S3_BUCKET_NAME=nombre_del_bucket
S3_PUBLIC_URL=https://tu_dominio_publico.com
S3_REGION=auto

# Configuración de la Aplicación
NEXT_PUBLIC_ENABLE_ADMIN_CHARTS=true
NEXT_PUBLIC_SHOW_CANDIDATOS_ADS=true

# Validación de Documentos con PocketBase (Opcional)
DOCUMENTO_VALIDATION_ENABLED=false
POCKETBASE_URL=http://localhost:8090
POCKETBASE_EMAIL=tu_email_de_pocketbase
POCKETBASE_PASSWORD=tu_contraseña_de_pocketbase

# Fecha de Expedición (Opcional)
FECHA_EXPEDICION_REQUIRED=false

# Ubicación por Defecto (Opcional)
NEXT_PUBLIC_USE_DEFAULT_LOCATION=false
NEXT_PUBLIC_DEFAULT_DEPARTAMENTO=Atlántico
NEXT_PUBLIC_DEFAULT_MUNICIPIO=Soledad

# Dominio del correo electrónico del sistema
# Los correos se generan automáticamente como: {numero_documento}{SYSTEM_EMAIL_DOMAIN}
SYSTEM_EMAIL_DOMAIN=@sistema.local
```

#### Generar AUTH_SECRET

```bash
openssl rand -base64 32
```

### 2. Configurar Base de Datos

#### Opción A: Railway

1. Crear proyecto en Railway
2. Agregar servicio PostgreSQL
3. Copiar la `DATABASE_URL` proporcionada
4. Agregarla a `.env.local`

#### Opción B: PostgreSQL Local

1. Instalar PostgreSQL
2. Crear base de datos
3. Configurar `DATABASE_URL` en formato:
   ```
   postgresql://usuario:password@localhost:5432/nombre_db
   ```

### 3. Configurar Almacenamiento (Cloudflare R2)

1. Crear bucket en Cloudflare R2
2. Configurar acceso público o privado según necesidades
3. Obtener credenciales S3-compatible:
   - Endpoint
   - Access Key ID
   - Secret Access Key
   - Bucket Name
   - Public URL (si es público)
4. Agregar a `.env.local`

**Nota**: También puede usar cualquier servicio compatible con S3 (AWS S3, MinIO, etc.)

### 4. Instalación de Dependencias

```bash
cd pp-gestion
pnpm install
```

### 5. Configurar Base de Datos con Prisma

#### Generar Cliente Prisma

```bash
pnpm db:generate
```

#### Aplicar Schema a la Base de Datos

**Opción 1: Push (Desarrollo)**
```bash
pnpm db:push
```

**Opción 2: Migraciones (Producción)**
```bash
pnpm db:migrate
```

#### Cargar Datos Iniciales (Opcional)

```bash
pnpm db:seed
```

### 6. Ejecutar en Desarrollo

```bash
pnpm dev
```

El servidor estará disponible en `http://localhost:3000`

## Configuración de Variables Opcionales

### Gráficos de Administrador

La variable `NEXT_PUBLIC_ENABLE_ADMIN_CHARTS` controla la visualización de gráficos estadísticos avanzados en el dashboard.

- `true`: Habilita gráficos (solo visibles para administradores)
- `false`: Deshabilita gráficos

### Publicidad de Candidatos

La variable `NEXT_PUBLIC_SHOW_CANDIDATOS_ADS` controla el modal de publicidad de candidatos en el login.

- `true`: Muestra modal automáticamente al cargar login
- `false`: No muestra modal

### Validación de Documentos con PocketBase

Si desea habilitar la validación de documentos con PocketBase:

1. Configure `DOCUMENTO_VALIDATION_ENABLED=true`
2. Configure `POCKETBASE_URL`, `POCKETBASE_EMAIL` y `POCKETBASE_PASSWORD`
3. El sistema validará duplicados contra PocketBase antes de registrar

**Nota**: Si PocketBase no está disponible, el sistema continúa funcionando normalmente.

### Fecha de Expedición

La variable `FECHA_EXPEDICION_REQUIRED` controla si el campo fecha de expedición es obligatorio.

- `true`: Campo obligatorio (personas sin fecha quedan en DATOS_PENDIENTES)
- `false`: Campo opcional

### Ubicación por Defecto

Configure valores por defecto para departamento y municipio:

```env
NEXT_PUBLIC_USE_DEFAULT_LOCATION=true
NEXT_PUBLIC_DEFAULT_DEPARTAMENTO=Atlántico
NEXT_PUBLIC_DEFAULT_MUNICIPIO=Soledad
```

## Estructura del Proyecto

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
│   ├── pocketbase/        # Cliente PocketBase (opcional)
│   └── types/             # Tipos TypeScript
├── prisma/                 # Schema y migraciones
│   ├── schema.prisma      # Schema de Prisma
│   └── seed.ts            # Datos iniciales
├── hooks/                  # Custom hooks
└── public/                 # Archivos estáticos
```

## Crear Primer Usuario Administrador

Después de la instalación, necesitarás crear el primer usuario administrador. Puedes hacerlo de dos formas:

### Opción 1: Script de Seed

Modifica `prisma/seed.ts` para crear un usuario admin y ejecuta:

```bash
pnpm db:seed
```

### Opción 2: SQL Directo

Ejecuta en tu base de datos:

```sql
-- Generar hash de contraseña (reemplaza '1234567890' con el número de documento)
-- Usa bcrypt con 12 rounds

INSERT INTO profiles (
  id,
  email,
  password_hash,
  nombres,
  apellidos,
  tipo_documento,
  numero_documento,
  role
) VALUES (
  gen_random_uuid(),
  '1234567890@sistema.local',
  '$2a$12$...', -- Hash bcrypt de '1234567890'
  'Administrador',
  'Sistema',
  'CC',
  '1234567890',
  'admin'
);
```

## Verificación de Instalación

1. **Servidor ejecutándose**: `http://localhost:3000` debe responder
2. **Base de datos**: Verificar que las tablas se crearon correctamente
3. **Login**: Intentar iniciar sesión con el usuario admin creado
4. **Almacenamiento**: Probar subir una imagen de confirmación

## Comandos Útiles

```bash
# Desarrollo
pnpm dev

# Build para producción
pnpm build

# Iniciar en producción
pnpm start

# Base de datos
pnpm db:generate    # Generar cliente Prisma
pnpm db:push       # Aplicar cambios (desarrollo)
pnpm db:migrate    # Ejecutar migraciones (producción)
pnpm db:seed       # Cargar datos iniciales

# Reset de base de datos (CUIDADO: destructivo)
pnpm reset-db

# Linting
pnpm lint
```

## Solución de Problemas

### Error: "Cannot find module '@prisma/client'"

```bash
pnpm db:generate
```

### Error: "DATABASE_URL is not set"

Verifica que `.env.local` existe y tiene `DATABASE_URL` configurada.

### Error: "Migration failed"

Verifica que la base de datos esté accesible y las credenciales sean correctas.

### Error al subir imágenes

Verifica:
- Credenciales de S3/R2 correctas
- Bucket existe y está configurado
- Permisos de acceso correctos

### Error de autenticación

Verifica:
- `AUTH_SECRET` está configurado
- `AUTH_URL` apunta a la URL correcta
- Base de datos tiene las tablas de Auth.js creadas

## Producción

Para desplegar en producción:

1. Configure variables de entorno en el servicio de hosting
2. Ejecute `pnpm build`
3. Configure base de datos de producción
4. Ejecute migraciones: `pnpm db:migrate`
5. Configure almacenamiento de producción
6. Inicie con `pnpm start`

## Notas Importantes

1. **Nunca expongas** `AUTH_SECRET` o credenciales de base de datos en el cliente
2. **Usa migraciones** en producción, no `db:push`
3. **Configura backups** de la base de datos
4. **Monitorea** el uso de almacenamiento
5. **Revisa logs** regularmente

---

**Versión de la Guía**: 1.0  
**Fecha de Actualización**: Enero 2026
