# Sistema de Gestión de Votantes

Sistema web para la gestión de votantes electorales desarrollado con Next.js, Supabase y shadcn/ui.

## Características

- **Autenticación y Roles**: Sistema de autenticación con dos tipos de usuarios (Admin y Líder)
- **CRUD de Personas**: Gestión completa de votantes con validaciones
- **Confirmación de Voto**: Sistema de confirmación con subida de imágenes
- **Importación Masiva**: Importación de datos desde archivos Excel
- **Filtros y Búsqueda**: Sistema avanzado de filtros por puesto, mesa, documento y líder
- **Dashboard**: Resumen con métricas y conteos
- **Gestión de Líderes**: CRUD de líderes para administradores

## Requisitos Previos

- Node.js 18+ y pnpm
- Cuenta de Supabase
- Bucket de almacenamiento configurado en Supabase

## Configuración

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_de_supabase
NEXT_PUBLIC_ENABLE_ADMIN_CHARTS=true
NEXT_PUBLIC_SHOW_CANDIDATOS_ADS=true
```

**Importante**: La `SUPABASE_SERVICE_ROLE_KEY` es necesaria para crear usuarios (líderes) desde el panel de administración. Puedes encontrarla en tu dashboard de Supabase en **Settings > API > service_role key**. **Nunca expongas esta clave en el cliente**, solo úsala en el servidor.

**Gráficos de Administrador**: La variable `NEXT_PUBLIC_ENABLE_ADMIN_CHARTS` controla la visualización de gráficos estadísticos avanzados en el dashboard. Solo son visibles para usuarios con rol de administrador. Establece en `true` para habilitar o `false` para deshabilitar.

**Publicidad de Candidatos**: La variable `NEXT_PUBLIC_SHOW_CANDIDATOS_ADS` controla la visualización del modal de publicidad de candidatos en la página de login. Establece en `true` para habilitar o `false` para deshabilitar. Cuando está habilitado, el modal se muestra automáticamente al cargar la página de login con la información de los candidatos disponibles.

### 2. Base de Datos

Ejecuta las migraciones SQL en tu proyecto de Supabase:

1. Ve a SQL Editor en tu dashboard de Supabase
2. Ejecuta las migraciones en orden cronológico desde la carpeta `supabase/migrations/`:
   - `20251118151403_initial_db.sql`
   - `20251118151634_initial_db_01.sql`
   - `20251118160000_fix_profiles_rls_recursion.sql`
   - `20251118170000_setup_storage_bucket.sql`
   - `20251118180000_fix_voto_confirmaciones_admin_insert.sql`
   - `20251118190000_add_departamento_municipio_personas.sql`
   - `20251118200000_add_candidatos_and_lider_fields.sql`
   - `20251118210000_setup_candidatos_storage_bucket.sql`
   - `20251119000000_add_public_candidatos_policy.sql` (necesaria para la publicidad de candidatos)

### 3. Storage Bucket

Crea un bucket en Supabase Storage llamado `voto-imagenes`:

1. Ve a **Storage** en tu dashboard de Supabase
2. Haz clic en **"New bucket"** o **"Crear bucket"**
3. Configura el bucket:
   - **Name**: `voto-imagenes`
   - **Public bucket**: ✅ Marca esta opción (para que las imágenes sean accesibles públicamente)
   - **File size limit**: `5242880` (5MB en bytes)
   - **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/gif, image/webp`
4. Haz clic en **"Create bucket"**

**Importante**: Después de crear el bucket, ejecuta la migración SQL para configurar las políticas RLS:

1. Ve a **SQL Editor** en tu dashboard de Supabase
2. Ejecuta el contenido de `supabase/migrations/20251118170000_setup_storage_bucket.sql`

### 4. Instalación de Dependencias

```bash
pnpm install
```

### 5. Ejecutar en Desarrollo

```bash
pnpm dev
```

El servidor estará disponible en `http://localhost:3000`

## Estructura del Proyecto

```
pp-gestion/
├── app/                    # Rutas y páginas de Next.js
│   ├── api/               # API routes
│   ├── auth/              # Páginas de autenticación
│   ├── dashboard/          # Dashboard principal
│   ├── personas/           # Gestión de personas
│   ├── lideres/            # Gestión de líderes (solo admin)
│   └── perfil/             # Perfil de usuario
├── components/             # Componentes React
│   ├── ui/                # Componentes de shadcn/ui
│   ├── layout/            # Componentes de layout
│   ├── personas/          # Componentes de personas
│   └── auth/              # Componentes de autenticación
├── lib/                    # Utilidades y helpers
│   ├── supabase/          # Clientes de Supabase
│   ├── auth/              # Helpers de autenticación
│   ├── types/             # Tipos TypeScript
│   └── validations/       # Esquemas de validación Zod
├── hooks/                  # Custom hooks
├── supabase/               # Migraciones SQL
└── public/                 # Archivos estáticos
```

## Roles y Permisos

### Administrador (Admin)
- Acceso completo a todos los datos
- Puede gestionar líderes (CRUD)
- Ve todas las personas sin filtros
- Acceso a todas las funcionalidades

### Líder
- Solo ve y gestiona sus propias personas registradas
- Puede confirmar votos de sus personas
- Puede editar su propio perfil
- No puede gestionar otros usuarios

## Funcionalidades Principales

### Gestión de Personas
- Crear, editar, eliminar personas
- Campos obligatorios: nombres, apellidos, tipo y número de documento, puesto y mesa de votación
- Campos opcionales: fecha de nacimiento, celular, dirección, barrio
- La edad se calcula automáticamente

### Confirmación de Voto
- Subir imagen como evidencia (máx. 5MB, solo imágenes)
- Reversar confirmación en caso de error
- Visualización de imágenes de confirmación

### Importación Masiva
- Descargar plantilla Excel
- Importar archivos Excel con validaciones
- Reporte de éxitos y errores
- Validación de duplicados

### Filtros
- Por puesto de votación
- Por mesa de votación
- Por número de documento
- Por líder (solo admin)

### Dashboard
- Conteo de personas registradas
- Conteo de votos confirmados
- Conteo de pendientes
- Filtrado automático por rol
- Gráficos estadísticos avanzados (solo admin, controlado por `NEXT_PUBLIC_ENABLE_ADMIN_CHARTS`):
  - Estadísticas por líder (confirmados vs pendientes)
  - Personas registradas por departamento y municipio
  - Votos confirmados por departamento y municipio

## Tecnologías Utilizadas

- **Next.js 16**: Framework React
- **Supabase**: Backend y base de datos
- **shadcn/ui**: Componentes UI
- **TypeScript**: Tipado estático
- **Zod**: Validación de esquemas
- **React Hook Form**: Manejo de formularios
- **ExcelJS**: Procesamiento de archivos Excel
- **Tailwind CSS**: Estilos

## Notas Importantes

1. **Storage Bucket**: Asegúrate de crear el bucket `voto-imagenes` en Supabase Storage antes de usar la funcionalidad de confirmación de voto.

2. **RLS Policies**: Las políticas RLS están configuradas en las migraciones. Asegúrate de que estén activas.

3. **Primer Usuario Admin**: Necesitarás crear el primer usuario administrador manualmente en Supabase o mediante SQL.

4. **Contraseñas por Defecto**: Los líderes creados por admin tienen contraseñas por defecto que no requieren cambio en el primer login.

## Desarrollo

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature
3. Realiza tus cambios
4. Envía un pull request

## Licencia

Este proyecto es privado y de uso interno.
