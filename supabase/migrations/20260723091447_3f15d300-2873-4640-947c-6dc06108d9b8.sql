
-- 1) Extend viewer permissions to include accepted friends and pending links, so contacts render
CREATE OR REPLACE FUNCTION public.can_view_user_data(_viewer uuid, _target uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    _viewer = _target
    OR EXISTS (
      SELECT 1 FROM public.family_links
      WHERE ((parent_id = _viewer AND child_id = _target)
          OR (child_id = _viewer AND parent_id = _target))
        AND status IN ('accepted','pending')
    )
    OR EXISTS (
      SELECT 1 FROM public.friendships
      WHERE ((user_id = _viewer AND friend_id = _target)
          OR (friend_id = _viewer AND user_id = _target))
        AND status IN ('accepted','pending')
    );
$$;

-- 2) Public directory lookup by public_id / username (bypass RLS but return only safe fields)
CREATE OR REPLACE FUNCTION public.find_user(_query text)
RETURNS TABLE(id uuid, username text, public_id text, full_name text, avatar_url text, role text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, username, public_id, full_name, avatar_url, role
  FROM public.profiles
  WHERE public_id = upper(_query) OR username = lower(_query)
  LIMIT 5;
$$;
GRANT EXECUTE ON FUNCTION public.find_user(text) TO authenticated;

-- 3) Real messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) BETWEEN 1 AND 4000),
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_pair_idx ON public.messages (sender_id, recipient_id, created_at DESC);
CREATE INDEX messages_recipient_idx ON public.messages (recipient_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own messages" ON public.messages FOR SELECT
  TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "send messages as self" ON public.messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "mark received read" ON public.messages FOR UPDATE
  TO authenticated USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "delete own sent" ON public.messages FOR DELETE
  TO authenticated USING (auth.uid() = sender_id);

-- 4) Enable realtime on messages
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
