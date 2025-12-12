-- ============================================================================
-- MIGRACIÓN: Agregar rol coordinador
-- ============================================================================
-- Esta migración agrega el rol 'coordinador' al sistema y establece la
-- relación entre coordinadores y líderes.
-- ============================================================================

-- Agregar 'coordinador' al enum user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'coordinador';

-- Agregar columna coordinador_id a profiles para relacionar líderes con coordinadores
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS coordinador_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Crear índice para optimizar consultas de líderes por coordinador
CREATE INDEX IF NOT EXISTS idx_profiles_coordinador_id ON profiles(coordinador_id);

-- Crear función helper para verificar si un usuario es coordinador
CREATE OR REPLACE FUNCTION check_user_is_coordinador(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = user_id;
  
  RETURN COALESCE(user_role = 'coordinador', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Crear función helper para verificar si un usuario es admin o coordinador
CREATE OR REPLACE FUNCTION check_user_is_admin_or_coordinador(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = user_id;
  
  RETURN COALESCE(user_role IN ('admin', 'coordinador'), FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Crear función helper para verificar si un líder pertenece a un coordinador
CREATE OR REPLACE FUNCTION check_lider_belongs_to_coordinador(lider_id UUID, coordinador_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = lider_id 
    AND coordinador_id = check_lider_belongs_to_coordinador.coordinador_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_user_is_coordinador(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_is_admin_or_coordinador(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_lider_belongs_to_coordinador(UUID, UUID) TO authenticated;

-- ============================================================================
-- ACTUALIZAR RLS POLICIES PARA PROFILES
-- ============================================================================

-- Coordinadores pueden ver sus propios líderes
CREATE POLICY "Coordinadores can view their leaders"
  ON profiles FOR SELECT
  USING (
    check_user_is_coordinador(auth.uid()) AND
    coordinador_id = auth.uid()
  );

-- Coordinadores pueden ver su propio perfil
CREATE POLICY "Coordinadores can view own profile"
  ON profiles FOR SELECT
  USING (
    check_user_is_coordinador(auth.uid()) AND
    id = auth.uid()
  );

-- Coordinadores pueden insertar líderes asignándolos a sí mismos
CREATE POLICY "Coordinadores can insert leaders"
  ON profiles FOR INSERT
  WITH CHECK (
    check_user_is_coordinador(auth.uid()) AND
    role = 'lider' AND
    coordinador_id = auth.uid()
  );

-- Coordinadores pueden actualizar sus líderes
CREATE POLICY "Coordinadores can update their leaders"
  ON profiles FOR UPDATE
  USING (
    check_user_is_coordinador(auth.uid()) AND
    coordinador_id = auth.uid()
  )
  WITH CHECK (
    check_user_is_coordinador(auth.uid()) AND
    coordinador_id = auth.uid()
  );

-- Coordinadores pueden actualizar su propio perfil
CREATE POLICY "Coordinadores can update own profile"
  ON profiles FOR UPDATE
  USING (
    check_user_is_coordinador(auth.uid()) AND
    id = auth.uid()
  )
  WITH CHECK (
    check_user_is_coordinador(auth.uid()) AND
    id = auth.uid()
  );

-- ============================================================================
-- ACTUALIZAR RLS POLICIES PARA PERSONAS
-- ============================================================================

-- Coordinadores pueden ver personas de sus líderes y propias
CREATE POLICY "Coordinadores can view personas from their leaders"
  ON personas FOR SELECT
  USING (
    check_user_is_coordinador(auth.uid()) AND
    (
      registrado_por = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = personas.registrado_por
        AND profiles.coordinador_id = auth.uid()
      )
    )
  );

-- Coordinadores pueden actualizar personas de sus líderes y propias
CREATE POLICY "Coordinadores can update personas from their leaders"
  ON personas FOR UPDATE
  USING (
    check_user_is_coordinador(auth.uid()) AND
    (
      registrado_por = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = personas.registrado_por
        AND profiles.coordinador_id = auth.uid()
      )
    )
  );

-- Coordinadores pueden eliminar personas de sus líderes y propias
CREATE POLICY "Coordinadores can delete personas from their leaders"
  ON personas FOR DELETE
  USING (
    check_user_is_coordinador(auth.uid()) AND
    (
      registrado_por = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = personas.registrado_por
        AND profiles.coordinador_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- ACTUALIZAR RLS POLICIES PARA VOTO_CONFIRMACIONES
-- ============================================================================

-- Coordinadores pueden ver confirmaciones de personas de sus líderes y propias
CREATE POLICY "Coordinadores can view confirmaciones from their leaders"
  ON voto_confirmaciones FOR SELECT
  USING (
    check_user_is_coordinador(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM personas
      WHERE personas.id = voto_confirmaciones.persona_id
      AND (
        personas.registrado_por = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = personas.registrado_por
          AND profiles.coordinador_id = auth.uid()
        )
      )
    )
  );

-- Coordinadores pueden insertar confirmaciones para personas de sus líderes y propias
CREATE POLICY "Coordinadores can insert confirmaciones for their leaders personas"
  ON voto_confirmaciones FOR INSERT
  WITH CHECK (
    check_user_is_coordinador(auth.uid()) AND
    confirmado_por = auth.uid() AND
    EXISTS (
      SELECT 1 FROM personas
      WHERE personas.id = voto_confirmaciones.persona_id
      AND (
        personas.registrado_por = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = personas.registrado_por
          AND profiles.coordinador_id = auth.uid()
        )
      )
    )
  );

-- Coordinadores pueden actualizar confirmaciones de personas de sus líderes y propias
CREATE POLICY "Coordinadores can update confirmaciones from their leaders"
  ON voto_confirmaciones FOR UPDATE
  USING (
    check_user_is_coordinador(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM personas
      WHERE personas.id = voto_confirmaciones.persona_id
      AND (
        personas.registrado_por = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = personas.registrado_por
          AND profiles.coordinador_id = auth.uid()
        )
      )
    )
  );

-- ============================================================================
-- ACTUALIZAR RLS POLICIES PARA IMPORTACIONES
-- ============================================================================

-- Coordinadores pueden ver importaciones de sus líderes y propias
CREATE POLICY "Coordinadores can view importaciones from their leaders"
  ON importaciones FOR SELECT
  USING (
    check_user_is_coordinador(auth.uid()) AND
    (
      usuario_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = importaciones.usuario_id
        AND profiles.coordinador_id = auth.uid()
      )
    )
  );

