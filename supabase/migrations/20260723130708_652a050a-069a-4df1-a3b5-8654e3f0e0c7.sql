
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS telegram_chat_id bigint,
  ADD COLUMN IF NOT EXISTS telegram_link_code text;

CREATE TABLE public.fall_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','ok','help','escalated')),
  escalated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  escalated_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fall_alerts TO authenticated;
GRANT ALL ON public.fall_alerts TO service_role;

ALTER TABLE public.fall_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own fall alerts"
  ON public.fall_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Family can view linked user fall alerts"
  ON public.fall_alerts FOR SELECT
  TO authenticated
  USING (public.can_manage_user_data(auth.uid(), user_id));

CREATE POLICY "Users can insert their own fall alerts"
  ON public.fall_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_fall_alerts_user_id ON public.fall_alerts(user_id);
CREATE INDEX idx_fall_alerts_created_at ON public.fall_alerts(created_at DESC);

ALTER TABLE public.fall_alerts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fall_alerts;
