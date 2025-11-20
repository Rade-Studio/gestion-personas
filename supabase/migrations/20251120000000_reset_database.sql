-- ============================================================================
-- SCRIPT DE RESET COMPLETO DE BASE DE DATOS
-- ============================================================================
-- Este script elimina TODOS los datos de la base de datos y deja solo
-- un usuario admin registrado.
--
-- ADVERTENCIA: Este script es DESTRUCTIVO y eliminará TODOS los datos.
-- Úsalo solo en desarrollo o cuando necesites resetear completamente la BD.
--
-- INSTRUCCIONES:
-- 1. Ejecuta este script desde el SQL Editor de Supabase
-- 2. Después ejecuta el script TypeScript: pnpm reset-db
--    para limpiar los buckets de storage y usuarios de auth
-- ============================================================================

-- Desactivar temporalmente las restricciones de foreign key para facilitar la limpieza
SET session_replication_role = 'replica';

-- ============================================================================
-- PASO 1: Eliminar todos los datos de las tablas (en orden correcto)
-- ============================================================================

-- Eliminar confirmaciones de voto primero (depende de personas y profiles)
TRUNCATE TABLE voto_confirmaciones CASCADE;

-- Eliminar personas (depende de profiles e importaciones)
TRUNCATE TABLE personas CASCADE;

-- Eliminar importaciones (depende de profiles)
TRUNCATE TABLE importaciones CASCADE;

-- Eliminar candidatos (puede ser referenciado por profiles)
TRUNCATE TABLE candidatos CASCADE;

-- Eliminar todos los perfiles
-- Nota: Los usuarios de auth.users deben eliminarse manualmente o con el script TypeScript
TRUNCATE TABLE profiles CASCADE;

-- ============================================================================
-- PASO 2: Restaurar restricciones
-- ============================================================================
SET session_replication_role = 'origin';

-- ============================================================================
-- NOTA IMPORTANTE:
-- ============================================================================
-- Este script SQL solo limpia las tablas de datos.
-- Para una limpieza completa, también necesitas:
--
-- 1. Limpiar buckets de storage (usa el script TypeScript):
--    pnpm reset-db
--
-- 2. Eliminar usuarios de auth (el script TypeScript lo hace automáticamente)
--
-- 3. Crear usuario admin (el script TypeScript lo hace automáticamente)
--
-- O manualmente desde el dashboard:
-- - Storage: Elimina todos los archivos de voto-imagenes y candidatos-imagenes
-- - Authentication: Elimina todos los usuarios excepto el admin
-- - Authentication: Crea un nuevo usuario admin si no existe
-- - Ejecuta el INSERT de abajo con el User UID del admin
-- ============================================================================

-- Para crear el perfil admin después de crear el usuario en Authentication:
-- Reemplaza 'TU_USER_ID_AQUI' con el User UID del usuario admin creado

/*
INSERT INTO profiles (
  id,
  nombres,
  apellidos,
  tipo_documento,
  numero_documento,
  role,
  created_at,
  updated_at
) VALUES (
  'TU_USER_ID_AQUI'::UUID,  -- Reemplaza con el User UID del admin
  'Administrador',
  'Sistema',
  'CC',
  '0000000000',
  'admin',
  NOW(),
  NOW()
);
*/
