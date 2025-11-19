-- Fix RLS policy for voto_confirmaciones to allow admins to insert confirmaciones for any persona
-- This migration adds a policy that allows admins to confirm votes for personas they didn't register

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert confirmaciones for own personas" ON voto_confirmaciones;

-- Create a new policy that allows users to insert confirmaciones for their own personas
CREATE POLICY "Users can insert confirmaciones for own personas"
  ON voto_confirmaciones FOR INSERT
  WITH CHECK (
    confirmado_por = auth.uid() AND
    EXISTS (
      SELECT 1 FROM personas
      WHERE personas.id = voto_confirmaciones.persona_id
      AND personas.registrado_por = auth.uid()
    )
  );

-- Create a new policy that allows admins to insert confirmaciones for any persona
-- Use the check_user_is_admin function to avoid RLS recursion
CREATE POLICY "Admins can insert confirmaciones for any persona"
  ON voto_confirmaciones FOR INSERT
  WITH CHECK (
    confirmado_por = auth.uid() AND
    check_user_is_admin(auth.uid())
  );

