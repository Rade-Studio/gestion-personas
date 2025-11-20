-- Setup Storage Bucket Policies for candidatos images
-- IMPORTANT: You must create the bucket manually in Supabase Dashboard first!
-- Go to Storage > New bucket > Name: candidatos-imagenes > Public: Yes

-- Storage policies for candidatos-imagenes bucket
-- These policies allow only admins to upload, view, and delete images

-- Policy: Allow admins to upload images
CREATE POLICY "Admins can upload candidato images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'candidatos-imagenes' AND
  check_user_is_admin(auth.uid())
);

-- Policy: Allow authenticated users to view images (public bucket)
CREATE POLICY "Authenticated users can view candidato images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'candidatos-imagenes');

-- Policy: Allow admins to delete images
CREATE POLICY "Admins can delete candidato images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'candidatos-imagenes' AND
  check_user_is_admin(auth.uid())
);

