
-- === PROFILES ===
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  public_id TEXT UNIQUE NOT NULL,
  full_name TEXT,
  age INT,
  height_cm INT,
  weight_kg NUMERIC,
  blood_type TEXT,
  allergies TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- everyone signed in can read profiles (needed to search by username / public_id and to show family members' names)
CREATE POLICY "profiles readable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- === FAMILY LINKS ===
CREATE TABLE public.family_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (parent_id, child_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_links TO authenticated;
GRANT ALL ON public.family_links TO service_role;
ALTER TABLE public.family_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family links visible to participants" ON public.family_links
  FOR SELECT TO authenticated USING (auth.uid() = parent_id OR auth.uid() = child_id);
CREATE POLICY "parent creates link" ON public.family_links
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "child accepts own link" ON public.family_links
  FOR UPDATE TO authenticated USING (auth.uid() = child_id OR auth.uid() = parent_id)
    WITH CHECK (auth.uid() = child_id OR auth.uid() = parent_id);
CREATE POLICY "participant deletes link" ON public.family_links
  FOR DELETE TO authenticated USING (auth.uid() = parent_id OR auth.uid() = child_id);

-- Security definer helper: is the given viewer allowed to see this user's data?
CREATE OR REPLACE FUNCTION public.can_view_user_data(_viewer UUID, _target UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT _viewer = _target OR EXISTS (
    SELECT 1 FROM public.family_links
    WHERE parent_id = _viewer AND child_id = _target AND status = 'accepted'
  );
$$;

-- === FRIENDSHIPS ===
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, friend_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "friendships visible to participants" ON public.friendships
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "user creates friendship" ON public.friendships
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "participant updates friendship" ON public.friendships
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id)
    WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "participant deletes friendship" ON public.friendships
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- === FOOD LOGS ===
CREATE TABLE public.food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo_path TEXT,
  calories NUMERIC NOT NULL DEFAULT 0,
  carbs_g NUMERIC NOT NULL DEFAULT 0,
  protein_g NUMERIC NOT NULL DEFAULT 0,
  fat_g NUMERIC NOT NULL DEFAULT 0,
  warning TEXT,
  source TEXT NOT NULL DEFAULT 'photo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_logs TO authenticated;
GRANT ALL ON public.food_logs TO service_role;
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "food logs viewable by owner or linked parent" ON public.food_logs
  FOR SELECT TO authenticated USING (public.can_view_user_data(auth.uid(), user_id));
CREATE POLICY "user inserts own food log" ON public.food_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user updates own food log" ON public.food_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user deletes own food log" ON public.food_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- === MEDICATION LOGS ===
CREATE TABLE public.medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dose TEXT,
  scheduled_time TEXT,
  taken BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medication_logs TO authenticated;
GRANT ALL ON public.medication_logs TO service_role;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "med logs viewable by owner or linked parent" ON public.medication_logs
  FOR SELECT TO authenticated USING (public.can_view_user_data(auth.uid(), user_id));
CREATE POLICY "user inserts own med log" ON public.medication_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user updates own med log" ON public.medication_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user deletes own med log" ON public.medication_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- === REALTIME ===
ALTER PUBLICATION supabase_realtime ADD TABLE public.food_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.medication_logs;

-- === AUTO PROFILE ON SIGNUP ===
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_public_id TEXT;
BEGIN
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  -- deduplicate username if taken
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) THEN
    v_username := v_username || '_' || substr(NEW.id::text, 1, 4);
  END IF;
  v_public_id := 'SB-' || upper(substr(replace(NEW.id::text, '-', ''), 1, 6));

  INSERT INTO public.profiles (id, username, public_id, full_name, role)
  VALUES (
    NEW.id,
    v_username,
    v_public_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', v_username),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- === STORAGE POLICIES ===
-- avatars: user manages own folder (userId/...); readable to authenticated
CREATE POLICY "avatars readable by authenticated" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY "users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users update own avatar" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users delete own avatar" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- food-photos: owner + linked parent can read
CREATE POLICY "food photos readable by owner or parent" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'food-photos' AND public.can_view_user_data(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
CREATE POLICY "users upload own food photo" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'food-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users delete own food photo" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'food-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
