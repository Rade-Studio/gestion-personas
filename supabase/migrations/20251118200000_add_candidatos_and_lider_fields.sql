-- Create candidatos table
CREATE TABLE IF NOT EXISTS candidatos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_completo TEXT NOT NULL,
  numero_tarjeton TEXT NOT NULL UNIQUE,
  imagen_url TEXT,
  imagen_path TEXT,
  partido_grupo TEXT,
  es_por_defecto BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Add new fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS departamento TEXT,
ADD COLUMN IF NOT EXISTS municipio TEXT,
ADD COLUMN IF NOT EXISTS zona TEXT,
ADD COLUMN IF NOT EXISTS candidato_id UUID REFERENCES candidatos(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_candidatos_numero_tarjeton ON candidatos(numero_tarjeton);
CREATE INDEX IF NOT EXISTS idx_candidatos_es_por_defecto ON candidatos(es_por_defecto);
CREATE INDEX IF NOT EXISTS idx_profiles_candidato_id ON profiles(candidato_id);
CREATE INDEX IF NOT EXISTS idx_profiles_departamento ON profiles(departamento);
CREATE INDEX IF NOT EXISTS idx_profiles_municipio ON profiles(municipio);
CREATE INDEX IF NOT EXISTS idx_profiles_zona ON profiles(zona);

-- Create unique constraint for es_por_defecto (only one can be true)
-- We'll use a partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_candidatos_unico_por_defecto 
ON candidatos(es_por_defecto) 
WHERE es_por_defecto = TRUE;

-- Create trigger for updated_at on candidatos
CREATE TRIGGER trigger_candidatos_updated_at
BEFORE UPDATE ON candidatos
FOR EACH ROW
EXECUTE FUNCTION actualizar_updated_at();

-- Enable Row Level Security for candidatos
ALTER TABLE candidatos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for candidatos
-- Only admins can view all candidatos
CREATE POLICY "Admins can view all candidatos"
  ON candidatos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can insert candidatos
CREATE POLICY "Admins can insert candidatos"
  ON candidatos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update candidatos
CREATE POLICY "Admins can update candidatos"
  ON candidatos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete candidatos
CREATE POLICY "Admins can delete candidatos"
  ON candidatos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

