
-- Profiles: no public read
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);
REVOKE SELECT ON public.profiles FROM anon;

-- Comments: hide user_id publicly
DROP POLICY IF EXISTS "Anyone can read comments" ON public.comments;
CREATE POLICY "Owners and admins can read comments"
  ON public.comments FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));
REVOKE SELECT ON public.comments FROM anon;

CREATE OR REPLACE VIEW public.comments_public AS
SELECT
  id,
  article_slug,
  author_name,
  content,
  created_at,
  (auth.uid() = user_id) AS is_own
FROM public.comments;

GRANT SELECT ON public.comments_public TO anon, authenticated;

-- SECURITY DEFINER exposure: restrict has_role to authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
