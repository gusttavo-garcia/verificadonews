# Autenticação + Painel Editorial

## Backend (Lovable Cloud)

**Habilitar Lovable Cloud** e configurar login Email/Senha + Google.

### Schema (migração única)

1. `public.profiles` — `id uuid PK → auth.users`, `display_name text`, `created_at`. Trigger `on_auth_user_created` cria profile automaticamente com `raw_user_meta_data->>'display_name'` ou email.
2. `public.app_role` enum: `admin | editor | reader`.
3. `public.user_roles` — `(user_id, role)`, com trigger que insere `reader` para todo novo usuário.
4. Função `public.has_role(uuid, app_role)` SECURITY DEFINER (evita recursão RLS).
5. `public.articles` — id, slug único, title, excerpt, body, category, verdict, cover_url, `status` (`draft | pending_review | published`), `author_id`, `published_at`, timestamps.
   - RLS:
     - SELECT público: só `status = 'published'`.
     - SELECT próprio: autor vê os seus (qualquer status).
     - SELECT admin: vê tudo.
     - INSERT: editores/admins (autor = auth.uid()).
     - UPDATE: autor pode editar seus rascunhos e mover `draft → pending_review`; admin pode tudo (incluindo `pending_review → published`).
     - DELETE: só admin.
6. Migrar artigos mock atuais para a tabela como `published`, `author_id` = usuário admin do sistema (criado pelo próprio dono do site depois, ou `NULL` autor "Equipe Verificado" — usar coluna adicional `author_name` para exibição quando não houver autor).
7. GRANTs: `authenticated` full; `anon` SELECT em articles (RLS filtra); `authenticated` SELECT em user_roles/profiles próprio.

### Server functions (`src/lib/*.functions.ts`)

- `getPublishedArticles`, `getArticleBySlug` — públicos, cliente publishable.
- `getMyArticles` — editor: seus artigos; admin: todos.
- `requestReview(articleId)` — editor muda status para `pending_review`.
- `publishArticle(articleId)` / `deleteArticle(articleId)` — só admin (`has_role`).
- `createDraft(...)` / `updateDraft(...)` — editor/admin.

## Frontend

### Header
- Deslogado: botão **"Entrar"** (primary vermelho, à direita).
- Logado como reader: botão **"Sair"** (accent verde).
- Logado como editor/admin: botões **"Painel"** (outline) + **"Sair"** (verde).

### Rotas novas
- `/auth` (público) — tabs "Entrar" / "Cadastrar" (email+senha) + botão Google. Cadastro cria conta como reader automaticamente. `redirectTo = window.location.origin`.
- `/_authenticated/painel` — layout gated. Redireciona reader para `/`.
  - `/painel` — lista artigos do usuário com status, botão "Pedir revisão" nos drafts. Admin vê seção extra "Aguardando aprovação" com botões **Publicar** / **Excluir**.
  - `/painel/novo` — form de rascunho (editor/admin).
  - `/painel/editar/$id` — edita rascunho próprio.

### Homepage e listagens
- Passam a consumir `getPublishedArticles` (dados reais migrados). Página de detalhe usa `getArticleBySlug`.
- Mock antigo permanece só como seed inicial na migração.

### Comportamento pós-login
- Reader: volta para `/`.
- Editor/Admin: vai para `/painel`.

## Notas técnicas

- `onAuthStateChange` no `__root.tsx` → `router.invalidate()` + `queryClient.invalidateQueries()` filtrado.
- `attachSupabaseAuth` middleware em `src/start.ts`.
- Role check via `has_role()` RPC no cliente para decidir CTA "Painel"; server sempre re-valida.
- Admin inicial: criado manualmente pelo dono via SQL/painel Cloud (documentar no chat após implementar).
- Google OAuth: chamar `supabase--configure_social_auth` para habilitar Google no provider.

Confirma pra eu implementar?