
-- Drop overly broad public read on wardrobe; restrict to authenticated users
DROP POLICY IF EXISTS "wardrobe public read" ON storage.objects;
CREATE POLICY "wardrobe auth read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'wardrobe');

-- Lock down signup trigger function
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
