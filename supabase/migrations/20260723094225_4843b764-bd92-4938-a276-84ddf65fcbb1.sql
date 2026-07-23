
-- Attach trigger so profile is auto-created on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill missing profiles for existing users
INSERT INTO public.profiles (id, username, public_id, full_name, first_name, last_name, role)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email,'@',1)) || '_' || substr(u.id::text,1,4),
  'SB-' || upper(substr(replace(u.id::text,'-',''),1,6)),
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email,'@',1)),
  u.raw_user_meta_data->>'first_name',
  u.raw_user_meta_data->>'last_name',
  'user'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
