
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, username, full_name, first_name, last_name, avatar_url)
SELECT
  u.id,
  NULLIF(lower(split_part(COALESCE(u.email,''), '@', 1)), ''),
  NULLIF(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''), ''),
  NULLIF(COALESCE(u.raw_user_meta_data->>'given_name', split_part(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''), ' ', 1)), ''),
  NULLIF(COALESCE(u.raw_user_meta_data->>'family_name', split_part(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''), ' ', 2)), ''),
  COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
  AND NULLIF(lower(split_part(COALESCE(u.email,''), '@', 1)), '') IS NOT NULL
ON CONFLICT (id) DO NOTHING;
