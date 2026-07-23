DROP POLICY IF EXISTS "profiles readable by authenticated" ON public.profiles;
CREATE POLICY "profiles readable by self or linked family" ON public.profiles
FOR SELECT TO authenticated
USING (public.can_view_user_data(auth.uid(), id));