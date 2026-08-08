CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" ON public.categories
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage categories" ON public.categories
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER categories_set_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.categories (name)
SELECT DISTINCT category FROM public.articles
WHERE category IS NOT NULL AND btrim(category) <> ''
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.categories (name) VALUES
  ('Política'), ('Saúde'), ('Economia'), ('Tecnologia'), ('Meio Ambiente'), ('Famosos'), ('Copa do Mundo')
ON CONFLICT (name) DO NOTHING;