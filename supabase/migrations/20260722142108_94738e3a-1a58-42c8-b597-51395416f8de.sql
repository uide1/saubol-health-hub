
REVOKE EXECUTE ON FUNCTION public.can_view_user_data(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
