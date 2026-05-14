
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS skin_tone text,
  ADD COLUMN IF NOT EXISTS undertone text,
  ADD COLUMN IF NOT EXISTS body_notes text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('looks', 'looks', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "looks public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'looks');

CREATE POLICY "looks owner write"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'looks' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "looks owner update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'looks' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "looks owner delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'looks' AND auth.uid()::text = (storage.foldername(name))[1]);
