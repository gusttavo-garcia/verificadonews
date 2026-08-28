DROP POLICY IF EXISTS "Anyone can view ad slots" ON public.ad_slots;

CREATE POLICY "Public can view enabled ad slots"
ON public.ad_slots
FOR SELECT
TO anon, authenticated
USING (enabled = true);

CREATE POLICY "Staff can view all ad slots"
ON public.ad_slots
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'editor'::app_role));