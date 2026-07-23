
CREATE OR REPLACE FUNCTION public.can_manage_user_data(_manager uuid, _target uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _manager = _target
    OR EXISTS (
      SELECT 1 FROM public.family_links
      WHERE parent_id = _manager AND child_id = _target AND status = 'accepted'
    );
$$;

DROP POLICY IF EXISTS "own meds sched write" ON public.medication_schedules;
CREATE POLICY "meds sched insert" ON public.medication_schedules
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_user_data(auth.uid(), user_id));
CREATE POLICY "meds sched update" ON public.medication_schedules
  FOR UPDATE TO authenticated
  USING (public.can_manage_user_data(auth.uid(), user_id))
  WITH CHECK (public.can_manage_user_data(auth.uid(), user_id));
CREATE POLICY "meds sched delete" ON public.medication_schedules
  FOR DELETE TO authenticated
  USING (public.can_manage_user_data(auth.uid(), user_id));
