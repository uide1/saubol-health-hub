
-- Allow authenticated users to send notifications to another user when a friendship or family link exists between them
CREATE POLICY "send notifications to linked users"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE (f.user_id = auth.uid() AND f.friend_id = notifications.user_id)
       OR (f.friend_id = auth.uid() AND f.user_id = notifications.user_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.family_links fl
    WHERE (fl.parent_id = auth.uid() AND fl.child_id = notifications.user_id)
       OR (fl.child_id = auth.uid() AND fl.parent_id = notifications.user_id)
  )
);

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
