
DROP POLICY IF EXISTS "wardrobe auth read" ON storage.objects;
CREATE POLICY "wardrobe own list" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'wardrobe' AND auth.uid()::text = (storage.foldername(name))[1]);
