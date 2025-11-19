-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for document types
CREATE TYPE documento_tipo AS ENUM ('CC', 'CE', 'Pasaporte', 'TI', 'Otro');

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'lider');

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  tipo_documento documento_tipo NOT NULL,
  numero_documento TEXT NOT NULL UNIQUE,
  fecha_nacimiento DATE,
  telefono TEXT,
  role user_role NOT NULL DEFAULT 'lider',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create personas table (votantes)
CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  tipo_documento documento_tipo NOT NULL DEFAULT 'CC',
  numero_documento TEXT NOT NULL UNIQUE,
  fecha_nacimiento DATE,
  edad INTEGER,
  numero_celular TEXT,
  direccion TEXT,
  barrio TEXT,
  puesto_votacion TEXT NOT NULL,
  mesa_votacion TEXT NOT NULL,
  registrado_por UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  es_importado BOOLEAN DEFAULT FALSE,
  importacion_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create voto_confirmaciones table
CREATE TABLE IF NOT EXISTS voto_confirmaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  imagen_url TEXT NOT NULL,
  imagen_path TEXT NOT NULL,
  confirmado_por UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  confirmado_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  reversado BOOLEAN DEFAULT FALSE,
  reversado_por UUID REFERENCES profiles(id),
  reversado_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create importaciones table
CREATE TABLE IF NOT EXISTS importaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_registros INTEGER NOT NULL,
  registros_exitosos INTEGER NOT NULL DEFAULT 0,
  registros_fallidos INTEGER NOT NULL DEFAULT 0,
  archivo_nombre TEXT,
  errores JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Add foreign key for importacion_id in personas
ALTER TABLE personas 
ADD CONSTRAINT fk_personas_importacion 
FOREIGN KEY (importacion_id) REFERENCES importaciones(id) ON DELETE SET NULL;

-- Create indexes for optimization
CREATE INDEX IF NOT EXISTS idx_personas_numero_documento ON personas(numero_documento);
CREATE INDEX IF NOT EXISTS idx_personas_registrado_por ON personas(registrado_por);
CREATE INDEX IF NOT EXISTS idx_personas_puesto_votacion ON personas(puesto_votacion);
CREATE INDEX IF NOT EXISTS idx_personas_mesa_votacion ON personas(mesa_votacion);
CREATE INDEX IF NOT EXISTS idx_personas_es_importado ON personas(es_importado);
CREATE INDEX IF NOT EXISTS idx_voto_confirmaciones_persona_id ON voto_confirmaciones(persona_id);
CREATE INDEX IF NOT EXISTS idx_voto_confirmaciones_reversado ON voto_confirmaciones(reversado);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_numero_documento ON profiles(numero_documento);

-- Function to calculate age from fecha_nacimiento
CREATE OR REPLACE FUNCTION calcular_edad(fecha_nac DATE)
RETURNS INTEGER AS $$
BEGIN
  IF fecha_nac IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN EXTRACT(YEAR FROM AGE(fecha_nac));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to update edad when fecha_nacimiento changes
CREATE OR REPLACE FUNCTION actualizar_edad()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.fecha_nacimiento IS NOT NULL THEN
    NEW.edad := calcular_edad(NEW.fecha_nacimiento);
  ELSE
    NEW.edad := NULL;
  END IF;
  NEW.updated_at := TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_edad
BEFORE INSERT OR UPDATE ON personas
FOR EACH ROW
EXECUTE FUNCTION actualizar_edad();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_voto_confirmaciones_updated_at
BEFORE UPDATE ON voto_confirmaciones
FOR EACH ROW
EXECUTE FUNCTION actualizar_updated_at();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE voto_confirmaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE importaciones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for personas
CREATE POLICY "Users can view own personas"
  ON personas FOR SELECT
  USING (
    registrado_por = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own personas"
  ON personas FOR INSERT
  WITH CHECK (registrado_por = auth.uid());

CREATE POLICY "Users can update own personas"
  ON personas FOR UPDATE
  USING (
    registrado_por = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete own personas"
  ON personas FOR DELETE
  USING (
    registrado_por = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for voto_confirmaciones
CREATE POLICY "Users can view confirmaciones for own personas"
  ON voto_confirmaciones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM personas
      WHERE personas.id = voto_confirmaciones.persona_id
      AND (
        personas.registrado_por = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

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

CREATE POLICY "Users can update confirmaciones for own personas"
  ON voto_confirmaciones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM personas
      WHERE personas.id = voto_confirmaciones.persona_id
      AND (
        personas.registrado_por = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

-- RLS Policies for importaciones
CREATE POLICY "Users can view own importaciones"
  ON importaciones FOR SELECT
  USING (
    usuario_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own importaciones"
  ON importaciones FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

