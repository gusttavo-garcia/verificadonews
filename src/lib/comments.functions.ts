import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";

// Public read: uses the anon-key client so it works during SSR and for
// visitors that are not signed in.
export const listComments = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supa = createClient(process.env.SUPABASE_URL!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data: rows, error } = await supa
      .from("comments")
      .select("id, author_name, content, created_at, user_id")
      .eq("article_slug", data.slug)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { comments: rows ?? [] };
  });

export const createComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        slug: z.string().min(1),
        content: z.string().trim().min(1).max(2000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("display_name")
      .eq("id", context.userId)
      .maybeSingle();
    const authorName = profile?.display_name ?? "Leitor";
    const { data: row, error } = await context.supabase
      .from("comments")
      .insert({
        article_slug: data.slug,
        user_id: context.userId,
        author_name: authorName,
        content: data.content,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { comment: row };
  });

export const deleteComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("comments")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Newsletter opt-in for the signed-in user
export const setNewsletterOptIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ optIn: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ newsletter_opt_in: data.optIn })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyNewsletterOptIn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("newsletter_opt_in")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { optIn: data?.newsletter_opt_in ?? false };
  });

// Admin: list subscribers
export const listNewsletterSubscribers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (isAdmin !== true) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, display_name, email, created_at")
      .eq("newsletter_opt_in", true)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { subscribers: data ?? [] };
  });