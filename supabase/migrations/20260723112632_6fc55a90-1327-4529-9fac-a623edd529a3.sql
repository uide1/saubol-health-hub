
-- Default generator for public_id like SB-XXXXXX
ALTER TABLE public.profiles
  ALTER COLUMN public_id SET DEFAULT ('SB-' || upper(substr(md5(gen_random_uuid()::text), 1, 6)));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full text;
  v_first text;
  v_last text;
  v_avatar text;
  v_username text;
BEGIN
  v_full := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  v_first := COALESCE(NEW.raw_user_meta_data->>'given_name', split_part(v_full, ' ', 1));
  v_last := COALESCE(NEW.raw_user_meta_data->>'family_name', NULLIF(split_part(v_full, ' ', 2), ''));
  v_avatar := COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture');
  v_username := lower(split_part(COALESCE(NEW.email,''), '@', 1));

  INSERT INTO public.profiles (id, username, full_name, first_name, last_name, avatar_url)
  VALUES (NEW.id, NULLIF(v_username,''), NULLIF(v_full,''), NULLIF(v_first,''), v_last, v_avatar)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, username, full_name, first_name, last_name, avatar_url)
SELECT
  u.id,
  NULLIF(lower(split_part(COALESCE(u.email,''), '@', 1)),''),
  NULLIF(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),''),
  NULLIF(COALESCE(u.raw_user_meta_data->>'given_name', split_part(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name',''), ' ', 1)),''),
  NULLIF(COALESCE(u.raw_user_meta_data->>'family_name', split_part(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name',''), ' ', 2)),''),
  COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
