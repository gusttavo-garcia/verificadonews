
-- ============= ENUMS =============
create type public.app_role as enum ('admin', 'editor', 'reader');
create type public.article_status as enum ('draft', 'pending_review', 'published');
create type public.verdict as enum ('verificado', 'falso', 'enganoso', 'parcial', 'apuracao');
create type public.article_type as enum ('noticia', 'golpe', 'empresa', 'site', 'video', 'fake');

-- ============= PROFILES =============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============= USER ROLES =============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view their own roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can view all roles"
  on public.user_roles for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage roles"
  on public.user_roles for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============= AUTO PROFILE + READER ROLE ON SIGNUP =============
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'reader')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============= ARTICLES =============
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  category text not null,
  verdict verdict not null,
  type article_type not null default 'noticia',
  cover_url text,
  status article_status not null default 'draft',
  author_id uuid references auth.users(id) on delete set null,
  author_name text,
  views integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.articles to anon;
grant select, insert, update, delete on public.articles to authenticated;
grant all on public.articles to service_role;
alter table public.articles enable row level security;

-- Public sees only published
create policy "Anyone can view published articles"
  on public.articles for select
  to anon, authenticated
  using (status = 'published');

-- Author sees their own regardless of status
create policy "Authors can view their own articles"
  on public.articles for select
  to authenticated
  using (author_id = auth.uid());

-- Admins see all
create policy "Admins can view all articles"
  on public.articles for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Editors and admins can insert; must be author
create policy "Editors and admins can insert articles"
  on public.articles for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and (public.has_role(auth.uid(), 'editor') or public.has_role(auth.uid(), 'admin'))
  );

-- Authors can update their own drafts / pending
create policy "Authors can update own draft articles"
  on public.articles for update
  to authenticated
  using (author_id = auth.uid() and status in ('draft', 'pending_review'))
  with check (author_id = auth.uid() and status in ('draft', 'pending_review'));

-- Admins can update everything (incl. publish)
create policy "Admins can update all articles"
  on public.articles for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
create policy "Admins can delete articles"
  on public.articles for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============= SEED FROM MOCKS =============
insert into public.articles (slug, title, excerpt, body, category, verdict, type, status, author_name, views, published_at) values
('reforma-tributaria-2026', 'Reforma Tributária 2026: análise das mudanças fiscais', 'Analisamos ponto a ponto as principais alterações trazidas pela nova reforma e o impacto direto no bolso do consumidor.', 'Nossa equipe realizou a checagem seguindo o protocolo padrão de investigação: identificação da origem do conteúdo, análise de fontes primárias, cruzamento de dados públicos e consulta a especialistas independentes.', 'Economia', 'verificado', 'noticia', 'published', 'Equipe Verificado', 1240, '2026-07-15'),
('golpe-pix-falso-banco', 'Golpe do falso funcionário de banco cresce 220% no Pix', 'Criminosos ligam se passando pelo banco e convencem vítimas a transferir dinheiro para uma conta ''segura''. Saiba como identificar.', 'Análise completa do golpe do falso funcionário de banco, com orientações para se proteger.', 'Tecnologia', 'falso', 'golpe', 'published', 'Equipe Verificado', 3820, '2026-07-14'),
('vacina-gripe-2026', 'Nova vacina da gripe altera o DNA humano?', 'Boato viraliza no WhatsApp com áudio de suposto médico. Confira o que dizem os especialistas e agências reguladoras.', 'Especialistas e órgãos oficiais desmentem categoricamente a alegação de que a vacina altera o DNA humano.', 'Saúde', 'falso', 'fake', 'published', 'Equipe Verificado', 5410, '2026-07-12'),
('celebridade-crise-publica', 'Celebridade brasileira enfrenta crise após vídeo editado', 'Vídeo circulando nas redes foi manipulado com corte estratégico. A gravação original mostra contexto diferente.', 'Análise reversa do vídeo confirma a manipulação através de cortes estratégicos.', 'Famosos', 'enganoso', 'noticia', 'published', 'Equipe Verificado', 8730, '2026-07-10'),
('loja-online-fraude', 'Loja ''MegaOfertas Brasil'' aplica golpe do produto que não chega', 'Site clonado usa selos falsos de segurança e anúncios patrocinados. Denúncias no Procon passam de 400 casos.', 'A loja usa selos falsos e anúncios patrocinados para atrair vítimas. Mais de 400 denúncias registradas.', 'Tecnologia', 'falso', 'empresa', 'published', 'Equipe Verificado', 2110, '2026-07-09'),
('video-manifestacao-editado', 'Vídeo de manifestação em Brasília foi gravado em 2019', 'Imagens compartilhadas como recentes são de protesto ocorrido há sete anos, conforme análise reversa de vídeo.', 'A análise reversa de vídeo confirma que as imagens são de 2019.', 'Política', 'enganoso', 'video', 'published', 'Equipe Verificado', 6390, '2026-07-08'),
('brasil-argentina-analise', 'Brasil x Argentina: tática, gols e momentos decisivos', 'Cobertura verificada da partida com dados oficiais da CBF e Conmebol, sem os boatos que circularam nas redes.', 'Cobertura completa e verificada com dados oficiais da CBF e Conmebol.', 'Copa do Mundo', 'verificado', 'noticia', 'published', 'Equipe Verificado', 940, '2026-07-07'),
('site-clone-receita-federal', 'Site clone da Receita Federal captura CPF e dados bancários', 'Página com domínio parecido promete restituição do IR e coleta dados sensíveis. Denunciado às autoridades.', 'Site clone coleta CPF e dados bancários. Denunciado às autoridades competentes.', 'Tecnologia', 'falso', 'site', 'published', 'Equipe Verificado', 4520, '2026-07-06'),
('queimadas-amazonia-2026', 'Queimadas na Amazônia bateram recorde em junho?', 'Dado circula fora de contexto. Comparação com anos anteriores mostra cenário diferente do afirmado.', 'Comparação com anos anteriores mostra que o dado está sendo usado fora de contexto.', 'Meio Ambiente', 'parcial', 'noticia', 'published', 'Equipe Verificado', 1780, '2026-07-05'),
('premio-atriz-brasileira', 'Atriz brasileira conquista prêmio internacional de cinema', 'Confirmamos com a organização do festival: prêmio é real, entregue na cerimônia de encerramento.', 'Confirmação obtida diretamente com a organização do festival.', 'Famosos', 'verificado', 'noticia', 'published', 'Equipe Verificado', 2210, '2026-07-04'),
('decreto-governo-economia', 'Novo decreto do governo impacta economia e sociedade', 'Publicação oficial no Diário da União confirma as medidas anunciadas na coletiva.', 'Confirmação via Diário Oficial da União.', 'Política', 'verificado', 'noticia', 'published', 'Equipe Verificado', 1360, '2026-07-03'),
('app-emprestimo-fantasma', 'App de empréstimo desaparece após cobrar taxa antecipada', 'Modelo clássico de golpe: cobra ''taxa de liberação'' e some. Aplicativo foi removido das lojas oficiais.', 'Golpe clássico de cobrança de taxa de liberação. App foi removido das lojas oficiais.', 'Economia', 'falso', 'golpe', 'published', 'Equipe Verificado', 3105, '2026-07-02');
