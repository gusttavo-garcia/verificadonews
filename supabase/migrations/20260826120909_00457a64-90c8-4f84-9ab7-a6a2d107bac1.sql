CREATE TABLE public.ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  text_model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  image_model text NOT NULL DEFAULT 'google/gemini-3-pro-image-preview',
  style_instructions text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'pt-BR',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_settings TO authenticated;
GRANT ALL ON public.ai_settings TO service_role;

ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ai settings"
ON public.ai_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view ai settings"
ON public.ai_settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'editor'::app_role));

CREATE TRIGGER ai_settings_updated_at
BEFORE UPDATE ON public.ai_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.ai_settings (singleton) VALUES (true);