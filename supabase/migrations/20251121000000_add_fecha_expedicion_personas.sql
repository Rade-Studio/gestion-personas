-- Add fecha_expedicion field to personas table
-- This field stores the document expiration/issue date
-- It can be optional or required based on FECHA_EXPEDICION_REQUIRED environment variable

ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS fecha_expedicion DATE;

