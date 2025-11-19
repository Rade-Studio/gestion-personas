-- Setup Storage Bucket Policies for vote confirmation images
-- IMPORTANT: You must create the bucket manually in Supabase Dashboard first!
-- Go to Storage > New bucket > Name: voto-imagenes > Public: Yes

-- Storage policies for voto-imagenes bucket
-- These policies allow authenticated users to upload and view images

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete any image" ON storage.objects;

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voto-imagenes' AND
  (storage.foldername(name))[1] = 'confirmaciones'
);

-- Policy: Allow authenticated users to view images
CREATE POLICY "Authenticated users can view images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'voto-imagenes');

-- Policy: Allow users to delete images they uploaded (for error cleanup)
-- Note: This checks if the file path contains the user's ID or if they confirmed the vote
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'voto-imagenes' AND
  (
    -- Allow deletion if user is the one who confirmed (check via voto_confirmaciones)
    EXISTS (
      SELECT 1 FROM voto_confirmaciones
      WHERE imagen_path = (bucket_id || '/' || name)
      AND confirmado_por = auth.uid()
    )
  )
);

-- Policy: Allow admins to delete any image
-- Use the check_user_is_admin function to avoid RLS recursion
CREATE POLICY "Admins can delete any image"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'voto-imagenes' AND
  check_user_is_admin(auth.uid())
);

