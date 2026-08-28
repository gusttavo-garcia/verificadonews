CREATE TABLE public.integration_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  api_key text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_keys TO authenticated;
GRANT ALL ON public.integration_keys TO service_role;

ALTER TABLE public.integration_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage integration keys"
ON public.integration_keys FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER integration_keys_set_updated_at
BEFORE UPDATE ON public.integration_keys
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();