ALTER TABLE public.medication_schedules REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'medication_schedules'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.medication_schedules;
  END IF;
END $$;