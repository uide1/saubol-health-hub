
DROP FUNCTION IF EXISTS public.find_user(text);

ALTER POLICY "own meds sched select" ON public.medication_schedules TO authenticated;
