
-- 1. Fix can_view_user_data: only 'accepted' status, and SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.can_view_user_data(_viewer uuid, _target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    _viewer = _target
    OR EXISTS (
      SELECT 1 FROM public.family_links
      WHERE ((parent_id = _viewer AND child_id = _target)
          OR (child_id = _viewer AND parent_id = _target))
        AND status = 'accepted'
    )
    OR EXISTS (
      SELECT 1 FROM public.friendships
      WHERE ((user_id = _viewer AND friend_id = _target)
          OR (friend_id = _viewer AND user_id = _target))
        AND status = 'accepted'
    );
$$;

-- 2. can_manage_user_data: switch to SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.can_manage_user_data(_manager uuid, _target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    _manager = _target
    OR EXISTS (
      SELECT 1 FROM public.family_links
      WHERE parent_id = _manager AND child_id = _target AND status = 'accepted'
    );
$$;

-- 3. Tighten medication_schedules select to use can_manage_user_data
DROP POLICY IF EXISTS "own meds sched select" ON public.medication_schedules;
CREATE POLICY "own meds sched select" ON public.medication_schedules
  FOR SELECT
  USING (public.can_manage_user_data(auth.uid(), user_id));

-- 4. Fix avatars SELECT policy: owner or accepted connection only
DROP POLICY IF EXISTS "avatars readable by authenticated" ON storage.objects;
CREATE POLICY "avatars readable by owner or connections" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND public.can_view_user_data(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

-- 5. Lock down handle_new_user (trigger only; no direct callers needed)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 6. find_user: keep SECURITY DEFINER (needs to bypass profile RLS for search),
-- but block anonymous callers and require an authenticated session at runtime.
CREATE OR REPLACE FUNCTION public.find_user(_query text)
RETURNS TABLE(id uuid, username text, public_id text, full_name text, avatar_url text, role text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  RETURN QUERY
    SELECT p.id, p.username, p.public_id, p.full_name, p.avatar_url, p.role
    FROM public.profiles p
    WHERE p.public_id = upper(_query) OR p.username = lower(_query)
    LIMIT 5;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.find_user(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_user(text) TO authenticated;
