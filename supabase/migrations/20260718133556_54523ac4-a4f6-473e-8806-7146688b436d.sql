
-- Profiles: newsletter + email
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS newsletter_opt_in boolean NOT NULL DEFAULT false;

-- Update signup trigger to store email as well
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      split_part(new.email, '@', 1)
    ),
    new.email
  )
  on conflict (id) do update set email = excluded.email;

  insert into public.user_roles (user_id, role)
  values (new.id, 'reader')
  on conflict (user_id, role) do nothing;

  return new;
end;
$function$;

-- Admins can read all profiles (needed for newsletter subscriber list)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Comments table
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_slug text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX comments_article_slug_idx ON public.comments (article_slug, created_at DESC);

GRANT SELECT ON public.comments TO anon;
GRANT SELECT, INSERT, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments"
  ON public.comments FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert their own comments"
  ON public.comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors and admins can delete comments"
  ON public.comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
