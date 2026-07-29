DROP POLICY IF EXISTS "article-images public read" ON storage.objects;

CREATE POLICY "article-images staff read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'article-images'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
);