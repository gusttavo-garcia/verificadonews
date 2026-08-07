ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS articles_deleted_at_idx ON public.articles (deleted_at);

DROP POLICY IF EXISTS "Anyone can view published articles" ON public.articles;
CREATE POLICY "Anyone can view published articles"
ON public.articles FOR SELECT
TO anon, authenticated
USING (status = 'published'::article_status AND deleted_at IS NULL);