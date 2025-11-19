-- Add departamento and municipio fields to personas table
-- Make puesto_votacion and mesa_votacion optional

-- Add new columns
ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS departamento TEXT,
ADD COLUMN IF NOT EXISTS municipio TEXT;

-- Make puesto_votacion and mesa_votacion optional
ALTER TABLE personas 
ALTER COLUMN puesto_votacion DROP NOT NULL,
ALTER COLUMN mesa_votacion DROP NOT NULL;

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_personas_departamento ON personas(departamento);
CREATE INDEX IF NOT EXISTS idx_personas_municipio ON personas(municipio);

