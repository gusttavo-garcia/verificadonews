CREATE OR REPLACE FUNCTION public.list_comments_public(_slug text)
 RETURNS TABLE(id uuid, article_slug text, author_name text, content text, created_at timestamp with time zone, is_own boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT c.id, c.article_slug, c.author_name, c.content, c.created_at,
         (c.user_id = auth.uid()) AS is_own
  FROM public.comments c
  WHERE _slug IS NOT NULL
    AND length(_slug) BETWEEN 1 AND 200
    AND c.article_slug = _slug
  ORDER BY c.created_at DESC
  LIMIT 500;
$function$;

REVOKE ALL ON FUNCTION public.list_comments_public(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_comments_public(text) TO anon, authenticated, service_role;