-- Migración: Agregar direccion y barrio_id a tabla profiles
-- Fecha: 2025-01-05

-- Agregar campos a tabla profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS direccion TEXT,
ADD COLUMN IF NOT EXISTS barrio_id INTEGER REFERENCES barrios(id);

-- Crear índice para la foreign key
CREATE INDEX IF NOT EXISTS idx_profiles_barrio_id ON profiles(barrio_id);

