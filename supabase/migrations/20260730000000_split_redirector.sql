-- Tabela para organizar as pastas de redirecionamento probabilístico
CREATE TABLE IF NOT EXISTS public.split_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  auto_ecpm_balancing BOOLEAN DEFAULT false,
  gam_network_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para as rotas e suas porcentagens (pesos) e eCPM do GAM
CREATE TABLE IF NOT EXISTS public.split_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES public.split_folders(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 50,
  ecpm NUMERIC DEFAULT 0,
  gam_ad_unit_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.split_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read split_folders" ON public.split_folders FOR SELECT USING (true);
CREATE POLICY "Public read split_routes" ON public.split_routes FOR SELECT USING (true);

CREATE POLICY "Staff manage split_folders" ON public.split_folders FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')
);

CREATE POLICY "Staff manage split_routes" ON public.split_routes FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')
);