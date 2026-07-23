
-- 1) family_links: restrict UPDATE so only the child can update (accept), and neither party can rewrite parent_id/child_id.
DROP POLICY IF EXISTS "child accepts own link" ON public.family_links;

CREATE POLICY "child accepts own link"
ON public.family_links
FOR UPDATE
TO authenticated
USING (auth.uid() = child_id)
WITH CHECK (auth.uid() = child_id AND status IN ('pending','accepted','declined'));

CREATE OR REPLACE FUNCTION public.family_links_prevent_identity_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.parent_id <> OLD.parent_id OR NEW.child_id <> OLD.child_id THEN
    RAISE EXCEPTION 'parent_id/child_id are immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS family_links_identity_guard ON public.family_links;
CREATE TRIGGER family_links_identity_guard
BEFORE UPDATE ON public.family_links
FOR EACH ROW EXECUTE FUNCTION public.family_links_prevent_identity_change();

-- 2) notifications: restrict allowed 'kind' values and content lengths at insert time.
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_kind_check,
  DROP CONSTRAINT IF EXISTS notifications_title_len_check,
  DROP CONSTRAINT IF EXISTS notifications_body_len_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_kind_check
    CHECK (kind IN (
      'friend_request','friend_accepted',
      'family_request','family_accepted',
      'new_message','system'
    )),
  ADD CONSTRAINT notifications_title_len_check
    CHECK (char_length(title) BETWEEN 1 AND 140),
  ADD CONSTRAINT notifications_body_len_check
    CHECK (body IS NULL OR char_length(body) <= 500);
