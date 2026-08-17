CREATE TABLE public.ad_slots (
  id uuid primary key default gen_random_uuid(),
  position text not null unique,
  label text not null,
  enabled boolean not null default false,
  code text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT ON public.ad_slots TO anon;
GRANT SELECT ON public.ad_slots TO authenticated;
GRANT ALL ON public.ad_slots TO service_role;

ALTER TABLE public.ad_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ad slots" ON public.ad_slots FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage ad slots" ON public.ad_slots FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER ad_slots_set_updated_at BEFORE UPDATE ON public.ad_slots FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.ad_slots (position, label) VALUES
  ('top', 'Topo do artigo (acima do título)'),
  ('after_intro', 'Após o resumo/resposta rápida'),
  ('mid_content', 'No meio do conteúdo'),
  ('after_content', 'Após o conteúdo'),
  ('before_comments', 'Antes dos comentários');