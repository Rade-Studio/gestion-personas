# Scripts de Utilidad

## Script de Reset de Base de Datos

Este script permite resetear completamente la base de datos, eliminando todos los datos y dejando solo un usuario admin.

### Requisitos

1. **Variables de entorno**: Asegúrate de tener configuradas en tu `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
   ```

   ⚠️ **IMPORTANTE**: Necesitas la `SUPABASE_SERVICE_ROLE_KEY`, NO la `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   La service role key la encuentras en: Supabase Dashboard > Settings > API > service_role key

2. **Instalar dependencias**:
   ```bash
   pnpm install
   ```

### Uso

#### Opción 1: Script TypeScript Completo (Recomendado)

Este script hace todo automáticamente:
- Limpia los buckets de storage
- Elimina datos de las tablas
- Elimina usuarios de auth (excepto el admin que especifiques)
- Crea un usuario admin nuevo si lo necesitas

```bash
pnpm reset-db
```

El script te pedirá:
1. Confirmación de que quieres continuar (escribe "SI")
2. Email del usuario admin a mantener (o Enter para crear uno nuevo)
3. Si quieres crear un nuevo admin: email, contraseña, nombres, apellidos, documento

#### Opción 2: Script SQL + Manual

Si prefieres hacerlo manualmente:

1. **Ejecuta el script SQL** desde el SQL Editor de Supabase:
   ```sql
   -- Ejecuta: supabase/migrations/20251120000000_reset_database.sql
   ```

2. **Limpia los buckets manualmente** desde el dashboard:
   - Ve a Storage > voto-imagenes > Selecciona todos > Delete
   - Ve a Storage > candidatos-imagenes > Selecciona todos > Delete

3. **Elimina usuarios manualmente** desde Authentication:
   - Ve a Authentication > Users
   - Elimina todos excepto el admin que quieres mantener

4. **Crea el perfil admin** (si creaste un nuevo usuario):
   ```sql
   INSERT INTO profiles (
     id,
     nombres,
     apellidos,
     tipo_documento,
     numero_documento,
     role
   ) VALUES (
     'TU_USER_ID_AQUI'::UUID,  -- Reemplaza con el User UID
     'Administrador',
     'Sistema',
     'CC',
     '0000000000',
     'admin'
   );
   ```

### Advertencias

⚠️ **ESTE SCRIPT ES DESTRUCTIVO**
- Eliminará TODOS los datos de la base de datos
- Eliminará TODOS los archivos de los buckets de storage
- Eliminará TODOS los usuarios excepto el admin especificado
- **NO se puede deshacer**

Solo úsalo en:
- Entornos de desarrollo
- Cuando necesites resetear completamente la base de datos
- Antes de hacer un deploy limpio

### Qué hace el script

1. ✅ Limpia bucket `voto-imagenes` (imágenes de confirmaciones de voto)
2. ✅ Limpia bucket `candidatos-imagenes` (imágenes de candidatos)
3. ✅ Elimina datos de `voto_confirmaciones`
4. ✅ Elimina datos de `personas`
5. ✅ Elimina datos de `importaciones`
6. ✅ Elimina datos de `candidatos`
7. ✅ Elimina datos de `profiles`
8. ✅ Elimina usuarios de `auth.users` (excepto el admin)
9. ✅ Crea usuario admin nuevo si lo solicitas

### Solución de Problemas

**Error: "Variables de entorno requeridas"**
- Verifica que tengas `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en tu `.env.local`

**Error: "Permission denied"**
- Asegúrate de usar la `SUPABASE_SERVICE_ROLE_KEY`, no la anon key
- La service role key tiene permisos completos

**Error al limpiar buckets**
- Algunos buckets pueden requerir limpieza manual desde el dashboard
- El script continuará aunque falle la limpieza de buckets

**No se pueden eliminar usuarios**
- Verifica que tengas la service role key correcta
- Algunos usuarios pueden requerir eliminación manual desde el dashboard
