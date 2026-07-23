-- Database webhook: on INSERT into fall_alerts, call notify-fall-alert edge function
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
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
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

DROP TRIGGER IF EXISTS on_fall_alert_insert ON public.fall_alerts;
CREATE TRIGGER on_fall_alert_insert
  AFTER INSERT ON public.fall_alerts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_notify_fall_alert();