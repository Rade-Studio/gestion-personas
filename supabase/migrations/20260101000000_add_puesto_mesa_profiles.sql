-- Migración: Agregar puesto_votacion_id y mesa_votacion a tabla profiles
-- Fecha: 2025-01-01

-- Agregar campos a tabla profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS puesto_votacion_id INTEGER REFERENCES puestos_votacion(id),
ADD COLUMN IF NOT EXISTS mesa_votacion TEXT;

-- Crear índice para la foreign key
CREATE INDEX IF NOT EXISTS idx_profiles_puesto_votacion_id ON profiles(puesto_votacion_id);

