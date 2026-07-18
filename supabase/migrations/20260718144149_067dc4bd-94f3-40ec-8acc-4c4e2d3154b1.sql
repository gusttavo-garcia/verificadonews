
-- Allow staff (editor/admin) to write to the article-images bucket, and anyone to read.
CREATE POLICY "article-images public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

CREATE POLICY "article-images staff insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'article-images'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
);

CREATE POLICY "article-images staff update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'article-images'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
);

CREATE POLICY "article-images staff delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'article-images'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
);
