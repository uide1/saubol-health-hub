REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
DROP POLICY IF EXISTS "Avatars: authenticated can read" ON storage.objects;