CREATE OR REPLACE FUNCTION public.trigger_notify_fall_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req_id bigint;
BEGIN
  SELECT net.http_post(
    url := 'https://uqieromzsppetoblhynb.supabase.co/functions/v1/notify-fall-alert',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'fall_alerts',
      'record', row_to_json(NEW),
      'schema', 'public'
    )
  ) INTO req_id;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.trigger_notify_fall_alert() FROM PUBLIC, anon, authenticated;