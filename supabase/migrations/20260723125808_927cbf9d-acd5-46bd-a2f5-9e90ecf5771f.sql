-- Allow any authenticated user to READ avatar files (bucket stays private otherwise).
-- Writes remain restricted to the owner via existing policies.
DROP POLICY IF EXISTS "Avatars: authenticated can read" ON storage.objects;
CREATE POLICY "Avatars: authenticated can read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');