import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const COLUMNS =
  "slug, title, excerpt, body, category, verdict, type, author_name, views, image_url, published_at, created_at";

function serverClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
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
}

export const getPublicArticle = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { data: row } = await serverClient()
      .from("articles")
      .select(COLUMNS)
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    return { article: row ?? null };
  });

export const listPublicArticles = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await serverClient()
    .from("articles")
    .select(
      "slug, title, excerpt, category, verdict, type, author_name, views, image_url, published_at, created_at",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(60);
  return { articles: data ?? [] };
});

export const registerArticleView = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    await serverClient().rpc("increment_article_views", { _slug: data.slug });
    return { ok: true };
  });
