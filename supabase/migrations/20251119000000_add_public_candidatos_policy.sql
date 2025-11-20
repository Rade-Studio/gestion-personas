-- Add public policy for reading candidatos (for public ads on login page)
-- This allows unauthenticated users to view candidatos for advertising purposes

CREATE POLICY "Public can view candidatos for ads"
  ON candidatos FOR SELECT
  TO anon
  USING (true);

