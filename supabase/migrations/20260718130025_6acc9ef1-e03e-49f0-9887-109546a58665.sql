
alter function public.set_updated_at() set search_path = public;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
-- has_role is intentionally callable by authenticated (used in RLS policies and role checks)
