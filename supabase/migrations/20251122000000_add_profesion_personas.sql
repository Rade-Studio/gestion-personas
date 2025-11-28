-- Add profesion field to personas table
-- This field stores the profession/occupation of the person
-- It is optional and does not affect the persona state

ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS profesion TEXT;

