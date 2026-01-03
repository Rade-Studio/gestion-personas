-- Migración: Agregar rol consultor
-- Fecha: 2025-01-01

-- Agregar 'consultor' al enum user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'consultor';

-- Crear función helper para verificar si un usuario es consultor
CREATE OR REPLACE FUNCTION check_user_is_consultor(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = user_id;
  
  RETURN COALESCE(user_role = 'consultor', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Crear función helper para verificar si un usuario es admin o consultor
CREATE OR REPLACE FUNCTION check_user_is_admin_or_consultor(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = user_id;
  
  RETURN COALESCE(user_role IN ('admin', 'consultor'), FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_user_is_consultor(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_is_admin_or_consultor(UUID) TO authenticated;

-- Políticas RLS para consultores: pueden ver todo pero no modificar
-- Los consultores pueden ver todos los perfiles (similar a admins)
DROP POLICY IF EXISTS "Consultores can view all profiles" ON profiles;
CREATE POLICY "Consultores can view all profiles"
  ON profiles FOR SELECT
  USING (check_user_is_consultor(auth.uid()) OR check_user_is_admin(auth.uid()));

-- Los consultores pueden ver todas las personas
DROP POLICY IF EXISTS "Consultores can view all personas" ON personas;
CREATE POLICY "Consultores can view all personas"
  ON personas FOR SELECT
  USING (check_user_is_consultor(auth.uid()) OR check_user_is_admin(auth.uid()) OR check_user_is_coordinador(auth.uid()));

-- Los consultores pueden ver todas las confirmaciones
DROP POLICY IF EXISTS "Consultores can view all confirmaciones" ON voto_confirmaciones;
CREATE POLICY "Consultores can view all confirmaciones"
  ON voto_confirmaciones FOR SELECT
  USING (check_user_is_consultor(auth.uid()) OR check_user_is_admin(auth.uid()) OR check_user_is_coordinador(auth.uid()));

