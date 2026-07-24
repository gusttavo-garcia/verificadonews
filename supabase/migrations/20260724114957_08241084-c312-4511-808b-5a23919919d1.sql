
DROP VIEW IF EXISTS public.comments_public;

CREATE OR REPLACE FUNCTION public.list_comments_public(_slug text)
RETURNS TABLE (
  id uuid,
  article_slug text,
  author_name text,
  content text,
  created_at timestamptz,
  is_own boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.article_slug, c.author_name, c.content, c.created_at,
         (c.user_id = auth.uid()) AS is_own
  FROM public.comments c
  WHERE c.article_slug = _slug
  ORDER BY c.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.list_comments_public(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_comments_public(text) TO anon, authenticated;
